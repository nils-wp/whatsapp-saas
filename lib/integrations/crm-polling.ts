/**
 * CRM Polling Library
 * Polling-basierte Event-Erkennung für CRMs ohne native Webhook-Unterstützung
 * Wie n8n: Regelmäßiges Abfragen der API nach neuen/geänderten Records
 */

// ===========================================
// Types
// ===========================================

export interface CRMEvent {
  id: string
  crm: CRMType
  eventType: string
  recordId: string
  phone: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  email: string | null
  data: Record<string, unknown>
  timestamp: Date
}

export type CRMType = 'pipedrive' | 'hubspot' | 'monday' | 'close' | 'activecampaign'

export interface PollingConfig {
  apiToken?: string
  apiKey?: string
  apiUrl?: string
  accessToken?: string
  boardId?: string
  phoneColumnId?: string
}

/**
 * Get CRM API config from integration settings
 */
export function getCRMApiConfig(
  crmType: CRMType,
  integrations: Record<string, unknown>
): PollingConfig {
  switch (crmType) {
    case 'pipedrive':
      return {
        apiToken: (integrations.pipedrive_api_token || integrations.apiToken) as string | undefined,
      }

    case 'monday':
      return {
        apiToken: (integrations.monday_api_token || integrations.apiToken) as string | undefined,
        boardId: (integrations.monday_board_id || integrations.boardId) as string | undefined,
        phoneColumnId: integrations.monday_phone_column_id as string | undefined,
      }

    case 'hubspot':
      return {
        accessToken: (integrations.hubspot_access_token || integrations.accessToken || integrations.apiToken) as string | undefined,
      }

    case 'close':
      return {
        apiKey: (integrations.close_api_key || integrations.apiKey || integrations.apiToken) as string | undefined,
      }

    case 'activecampaign':
      return {
        apiKey: (integrations.activecampaign_api_key || integrations.apiKey || integrations.apiToken) as string | undefined,
        apiUrl: (integrations.activecampaign_api_url || integrations.apiUrl) as string | undefined,
      }

    default:
      return {}
  }
}

export interface PollingResult {
  events: CRMEvent[]
  newCursor?: string
  error?: string
  debugInfo?: any // Useful for troubleshooting production issues
}

/**
 * Defensively check if a record matches trigger filters
 * This is a "fail-safe" for when CRM API filtering is imperfect or keys mismatch
 */
export function matchesFilters(
  crm: CRMType,
  event: string,
  record: any,
  filters?: Record<string, string | string[]>
): boolean {
  if (!filters || Object.keys(filters).length === 0) return true

  try {
    switch (crm) {
      case 'close': {
        // lead_status_changed or lead_created
        const statusValue = filters.target_status || filters.lead_status || filters.status_id
        if (statusValue) {
          // Close lead status can be status_id or status_label (the frontend often saves label)
          const recordStatus = record.status_label || record.status_id
          if (recordStatus !== statusValue) return false
        }

        const pipelineValue = filters.pipeline || filters.pipeline_id
        if (pipelineValue && record.pipeline_id !== pipelineValue) return false

        break
      }

      case 'hubspot': {
        const props = record.properties || record
        const stageValue = filters.target_stage || filters.stage
        if (stageValue && props.dealstage !== stageValue) return false

        const pipelineValue = filters.pipeline
        if (pipelineValue && props.pipeline !== pipelineValue) return false

        break
      }

      case 'pipedrive': {
        const stageValue = filters.stage_id || filters.stage || filters.target_stage || filters.target_stage_id
        const recordStage = record.current?.stage_id || record.stage_id || record.stage
        if (stageValue && String(recordStage) !== String(stageValue)) return false

        const pipelineValue = filters.pipeline_id || filters.pipeline
        const recordPipeline = record.current?.pipeline_id || record.pipeline_id || record.pipeline
        if (pipelineValue && String(recordPipeline) !== String(pipelineValue)) return false

        break
      }

      case 'monday': {
        const groupId = filters.group_id || filters.group || filters.target_group_id
        const recordGroup = record.event?.destGroupId || record.group?.id || record.group
        if (groupId && String(recordGroup) !== String(groupId)) return false

        break
      }

      case 'activecampaign': {
        const stageValue = filters.target_stage || filters.stage
        if (stageValue && String(record.stage || record.stageid) !== String(stageValue)) return false

        const pipelineValue = filters.pipeline_id || filters.pipeline
        if (pipelineValue && String(record.pipeline || record.pipelineid) !== String(pipelineValue)) return false

        // Special handling for tags - they can be in various formats
        const tagValue = filters.tag_name || filters.tag
        if (tagValue) {
          const recordTags = record.tags ||
            record['contact[tags]'] ||
            record.contact?.tags ||
            record.tag_names ||
            record.tag ||
            record.tagid ||
            (Array.isArray(record.tags) ? record.tags.map((t: any) => t.id || t.tag || t).join(',') : null)

          if (recordTags) {
            const tagsString = String(recordTags)
            // Check if tagValue (which could be ID or name) is in the tags string
            if (!tagsString.includes(String(tagValue))) return false
          } else if (event.includes('tag')) {
            console.warn('[Filtering] AC tag filter found but no tags in record')
          }
        }

        break
      }
    }

    // Standard fallback: check filters against record using common payload paths if possible
    // This replicates the logic from the webhook route for consistency
    for (const [key, expectedValue] of Object.entries(filters)) {
      // Skip if already handled by CRM-specific logic above
      if (['target_status', 'lead_status', 'status_id', 'target_stage', 'stage', 'stage_id', 'pipeline_id', 'pipeline', 'group_id', 'group', 'target_group_id'].includes(key)) {
        continue
      }

      const actualValue = getNestedValue(record, key)
      if (actualValue === undefined || actualValue === null) continue

      if (String(actualValue) !== String(expectedValue)) {
        // Special case: if actual is a comma-separated list
        if (String(actualValue).includes(',') && String(actualValue).split(',').map(s => s.trim()).includes(String(expectedValue))) {
          continue
        }
        return false
      }
    }

    return true
  } catch (error) {
    console.error(`[Filtering] Error matching filters for ${crm}:`, error)
    return true // Fallback to including it if filter check fails
  }
}

// ===========================================
// Pipedrive Polling
// Verwendet GET /recents API
// ===========================================

export async function pollPipedriveEvents(
  apiToken: string,
  triggerEvent: string,
  lastPolledAt: Date,
  filters?: Record<string, string>
): Promise<PollingResult> {
  try {
    const sinceTimestamp = lastPolledAt.toISOString()

    // Map trigger events to item types
    const itemTypeMap: Record<string, string> = {
      'deal_created': 'deal',
      'deal_updated': 'deal',
      'deal_stage_changed': 'deal',
      'person_created': 'person',
      'person_updated': 'person',
      'activity_created': 'activity',
      'activity_completed': 'activity',
    }

    const itemType = itemTypeMap[triggerEvent] || 'deal'

    const response = await fetch(
      `https://api.pipedrive.com/v1/recents?since_timestamp=${encodeURIComponent(sinceTimestamp)}&items=${itemType}&limit=50&api_token=${apiToken}`
    )

    if (!response.ok) {
      return { events: [], error: `Pipedrive API error: ${response.status}` }
    }

    const result = await response.json()
    if (!result.success || !result.data) {
      return { events: [] }
    }

    const events: CRMEvent[] = []

    for (const item of result.data) {
      // Filter by action type
      const actionMap: Record<string, string[]> = {
        'deal_created': ['add'],
        'deal_updated': ['update'],
        'deal_stage_changed': ['update'],
        'person_created': ['add'],
        'person_updated': ['update'],
        'activity_created': ['add'],
        'activity_completed': ['update'],
      }

      const validActions = actionMap[triggerEvent] || ['add', 'update']
      if (!validActions.includes(item.item)) continue

      const data = item.data

      // For stage change, check if stage actually changed
      if (triggerEvent === 'deal_stage_changed' && filters?.stage_id) {
        if (String(data.stage_id) !== filters.stage_id) continue
      }

      // Extract phone - may need to fetch person if this is a deal
      let phone: string | null = null
      let firstName: string | null = null
      let lastName: string | null = null
      let fullName: string | null = null

      if (itemType === 'person') {
        phone = data.phone?.[0]?.value || null
        firstName = data.first_name || null
        lastName = data.last_name || null
        fullName = data.name || null
      } else if (itemType === 'deal' && data.person_id) {
        // Fetch person details
        const personRes = await fetch(
          `https://api.pipedrive.com/v1/persons/${data.person_id}?api_token=${apiToken}`
        )
        if (personRes.ok) {
          const personData = await personRes.json()
          if (personData.success && personData.data) {
            phone = personData.data.phone?.[0]?.value || null
            firstName = personData.data.first_name || null
            lastName = personData.data.last_name || null
            fullName = personData.data.name || null
          }
        }
      }

      events.push({
        id: `pipedrive_${item.item}_${data.id}_${Date.now()}`,
        crm: 'pipedrive',
        eventType: triggerEvent,
        recordId: String(data.id),
        phone,
        firstName,
        lastName,
        fullName,
        email: data.email?.[0]?.value || null,
        data,
        timestamp: new Date(item.timestamp || Date.now()),
      })
    }

    return { events }
  } catch (error) {
    console.error('[Polling] Pipedrive error:', error)
    return { events: [], error: String(error) }
  }
}

// ===========================================
// HubSpot Polling
// Verwendet POST /crm/v3/objects/search mit lastmodifieddate Filter
// ===========================================

export async function pollHubSpotEvents(
  accessToken: string,
  triggerEvent: string,
  lastPolledAt: Date,
  filters?: Record<string, string>
): Promise<PollingResult> {
  try {
    // Determine object type from trigger event
    const objectTypeMap: Record<string, string> = {
      'contact_created': 'contacts',
      'contact_updated': 'contacts',
      'deal_created': 'deals',
      'deal_updated': 'deals',
      'deal_stage_changed': 'deals',
      'form_submitted': 'contacts',
      'ticket_created': 'tickets',
    }

    const objectType = objectTypeMap[triggerEvent] || 'contacts'

    const filterGroups: Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }> = [{
      filters: [{
        propertyName: triggerEvent.includes('created') ? 'createdate' : 'hs_lastmodifieddate',
        operator: 'GT',
        value: lastPolledAt.getTime().toString(),
      }]
    }]

    // Add stage filter if specified
    const stageValue = filters?.stage || filters?.target_stage
    if (triggerEvent === 'deal_stage_changed' && stageValue) {
      filterGroups[0].filters.push({
        propertyName: 'dealstage',
        operator: 'EQ',
        value: stageValue,
      })
    }

    const pipelineValue = filters?.pipeline
    if (pipelineValue) {
      filterGroups[0].filters.push({
        propertyName: 'pipeline',
        operator: 'EQ',
        value: pipelineValue,
      })
    }

    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${objectType}/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups,
          properties: ['firstname', 'lastname', 'email', 'phone', 'dealname', 'dealstage', 'amount'],
          sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
          limit: 50,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { events: [], error: `HubSpot API error: ${response.status} - ${errorData.message || ''}` }
    }

    const result = await response.json()
    const events: CRMEvent[] = []

    for (const record of result.results || []) {
      if (!matchesFilters('hubspot', triggerEvent, record, filters)) continue

      const props = record.properties

      events.push({
        id: `hubspot_${objectType}_${record.id}_${Date.now()}`,
        crm: 'hubspot',
        eventType: triggerEvent,
        recordId: record.id,
        phone: props.phone || null,
        firstName: props.firstname || null,
        lastName: props.lastname || null,
        fullName: [props.firstname, props.lastname].filter(Boolean).join(' ') || null,
        email: props.email || null,
        data: props,
        timestamp: new Date(props.hs_lastmodifieddate || Date.now()),
      })
    }

    return { events }
  } catch (error) {
    console.error('[Polling] HubSpot error:', error)
    return { events: [], error: String(error) }
  }
}

// ===========================================
// Close Polling
// Verwendet GET /lead mit date_updated__gte Filter
// ===========================================

export async function pollCloseEvents(
  apiKey: string,
  triggerEvent: string,
  lastPolledAt: Date,
  filters?: Record<string, string>
): Promise<PollingResult> {
  try {
    const auth = Buffer.from(`${apiKey}:`).toString('base64')
    const dateFilter = lastPolledAt.toISOString()

    // Build query based on trigger event
    let endpoint = '/api/v1/lead/'
    const queryParams = new URLSearchParams()

    if (triggerEvent.includes('created')) {
      queryParams.set('date_created__gt', dateFilter)
    } else {
      queryParams.set('date_updated__gt', dateFilter)
    }

    queryParams.set('_limit', '50')
    queryParams.set('_order_by', '-date_updated')

    // Add status filter if specified
    // Map various potential filter keys from frontend
    const statusValue = filters?.status_id || filters?.target_status || filters?.lead_status
    if (statusValue) {
      queryParams.set('status_id', statusValue)
    }

    const pipelineValue = filters?.pipeline_id || filters?.pipeline
    if (pipelineValue) {
      queryParams.set('pipeline_id', pipelineValue)
    }

    const response = await fetch(
      `https://api.close.com${endpoint}?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return { events: [], error: `Close API error: ${response.status}` }
    }

    const result = await response.json()
    const events: CRMEvent[] = []

    for (const lead of result.data || []) {
      if (!matchesFilters('close', triggerEvent, lead, filters)) continue

      // Get primary contact
      const contact = lead.contacts?.[0]
      const phone = contact?.phones?.[0]?.phone || null

      events.push({
        id: `close_lead_${lead.id}_${Date.now()}`,
        crm: 'close',
        eventType: triggerEvent,
        recordId: lead.id,
        phone,
        firstName: contact?.name?.split(' ')[0] || null,
        lastName: contact?.name?.split(' ').slice(1).join(' ') || null,
        fullName: contact?.name || lead.display_name || null,
        email: contact?.emails?.[0]?.email || null,
        data: lead,
        timestamp: new Date(lead.date_updated || lead.date_created || Date.now()),
      })
    }

    return { events }
  } catch (error) {
    console.error('[Polling] Close error:', error)
    return { events: [], error: String(error) }
  }
}

// ===========================================
// ActiveCampaign Polling
// Verwendet GET /contacts mit filters[updated_after]
// ===========================================

export async function pollActiveCampaignEvents(
  apiUrl: string,
  apiKey: string,
  triggerEvent: string,
  lastPolledAt: Date,
  filters?: Record<string, string>
): Promise<PollingResult> {
  try {
    // URL Normalization: Ensure we don't have double /api/3
    let baseUrl = apiUrl.replace(/\/+$/, '')
    if (baseUrl.endsWith('/api/3')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 6)
    }
    baseUrl = baseUrl.replace(/\/+$/, '')

    // Add a lookback buffer to account for API delays and timezone issues
    // Test mode: 24h buffer (to catch timezone issues during testing)
    // Active mode: 30 min buffer (enough for timezone offset, fast enough for real-time)
    const isTestMode = filters?.__isTestMode === 'true'
    const isTagEvent = triggerEvent.includes('tag')
    const lookbackMs = isTestMode ? 86400000 : 1800000 // 24h or 30 min
    const adjustedLastPolledAt = new Date(lastPolledAt.getTime() - lookbackMs)

    // Format date for ActiveCampaign (YYYY-MM-DD HH:MM:SS)
    const dateFilter = adjustedLastPolledAt.toISOString().replace('T', ' ').substring(0, 19)

    // Determine endpoint based on trigger event
    let endpoint: string
    const queryParams = new URLSearchParams()

    // Cache tags if we need to filter by tag name
    let tagMap: Record<string, string> = {}
    let targetTagId: string | null = null

    if (isTagEvent) {
      // Fetch tags to map IDs to names. limit=500 is often supported
      try {
        const tagsResponse = await fetch(`${baseUrl}/api/3/tags?limit=500`, {
          headers: { 'Api-Token': apiKey! }
        })
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          tagsData.tags?.forEach((t: any) => {
            tagMap[String(t.id)] = t.tag
          })
          console.log(`[AC Polling] Loaded ${Object.keys(tagMap).length} tags`)
        }
      } catch (e) {
        console.warn('[Polling] Failed to fetch tag metadata for mapping:', e)
      }

      // Find target tag ID if filter is set
      const targetTagName = filters?.tag_name || filters?.tag
      if (targetTagName && Object.keys(tagMap).length > 0) {
        targetTagId = Object.entries(tagMap).find(([, name]) => name === targetTagName)?.[0] || null
        if (targetTagId) {
          console.log(`[AC Polling] Target tag: "${targetTagName}" = ID ${targetTagId}`)
        }
      }
    }

    if (triggerEvent.includes('deal') || triggerEvent.includes('stage')) {
      endpoint = '/api/3/deals'
      queryParams.set('filters[updated_timestamp][gt]', adjustedLastPolledAt.toISOString())
      queryParams.set('orders[udate]', 'DESC')

      if (filters?.stage || filters?.target_stage) {
        queryParams.set('filters[stage]', (filters.stage || filters.target_stage) as string)
      }
      if (filters?.pipeline_id) {
        queryParams.set('filters[pipeline]', filters.pipeline_id as string)
      }
    } else if (isTagEvent) {
      // For tag events, we poll the contactTags endpoint with pagination
      // AC API does not reliably sort by cdate, so we paginate and filter client-side
      endpoint = `/api/3/contactTags`

      // Filter by specific tag if we know the ID (reduces result set significantly)
      if (targetTagId) {
        queryParams.set('filters[tag]', targetTagId)
      }
    } else {
      endpoint = '/api/3/contacts'
      // ActiveCampaign v3 Contacts API uses 'filters[updated_after]' without [gt]
      queryParams.set('filters[updated_after]', dateFilter)
      queryParams.set('orders[udate]', 'DESC') // Sort by update date

      if (filters?.list || filters?.list_id) {
        queryParams.set('listid', (filters.list || filters.list_id) as string)
      }
    }

    const events: CRMEvent[] = []
    const debugInfo: any = {
      endpoint,
      lastPolledAt: lastPolledAt.toISOString(),
      adjustedLastPolledAt: adjustedLastPolledAt.toISOString(),
      targetTagId,
      pagesSearched: 0,
      totalRecordsScanned: 0,
      newestRecordFound: null as string | null,
      processingDetails: [] as string[]
    }

    // For tag events, we need to paginate through results to find new ones
    // The AC API may not return results sorted by cdate correctly
    if (isTagEvent) {
      const maxPages = 5 // Limit pagination to avoid infinite loops
      let offset = 0
      const limit = 100 // Fetch more per page to reduce API calls
      let foundNewRecords = false
      let allRecordsOld = false

      for (let page = 0; page < maxPages && !foundNewRecords && !allRecordsOld; page++) {
        debugInfo.pagesSearched++
        queryParams.set('limit', String(limit))
        queryParams.set('offset', String(offset))

        const response = await fetch(
          `${baseUrl}${endpoint}?${queryParams.toString()}`,
          {
            headers: {
              'Api-Token': apiKey,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'No error body')
          console.error(`[Polling] ActiveCampaign API error ${response.status}: ${errorBody}`)
          return { events: [], error: `ActiveCampaign API error: ${response.status}`, debugInfo }
        }

        const result = await response.json()
        const rawRecords = result.contactTags || []
        debugInfo.totalRecordsScanned += rawRecords.length

        // Count how many records match our target tag
        const matchingTagRecords = targetTagId
          ? rawRecords.filter((r: any) => String(r.tag) === targetTagId)
          : rawRecords

        // Log first few records for debugging
        if (page === 0) {
          const sampleCdates = rawRecords.slice(0, 3).map((r: any) => ({
            id: r.id,
            contact: r.contact,
            tag: r.tag,
            cdate: r.cdate
          }))
          console.log(`[AC Polling] Page ${page + 1}: ${rawRecords.length} total, ${matchingTagRecords.length} matching tag ${targetTagId}`)
          console.log(`[AC Polling] Sample records:`, JSON.stringify(sampleCdates))
          console.log(`[AC Polling] Cutoff time: ${adjustedLastPolledAt.toISOString()}`)

          // Log matching records if any
          if (matchingTagRecords.length > 0) {
            console.log(`[AC Polling] Matching tag records:`, JSON.stringify(matchingTagRecords.slice(0, 5).map((r: any) => ({
              id: r.id,
              contact: r.contact,
              tag: r.tag,
              cdate: r.cdate
            }))))
          }
        } else {
          console.log(`[AC Polling] Page ${page + 1}: ${rawRecords.length} total, ${matchingTagRecords.length} matching tag ${targetTagId}`)
        }

        if (rawRecords.length === 0) {
          allRecordsOld = true
          break
        }

        // Track the newest cdate we find
        for (const record of rawRecords) {
          // CRITICAL: AC API ignores filters[tag] parameter, so we must filter client-side
          if (targetTagId && String(record.tag) !== targetTagId) {
            continue // Skip records that don't match our target tag
          }

          const cdate = new Date(record.cdate)
          if (!debugInfo.newestRecordFound || cdate.toISOString() > debugInfo.newestRecordFound) {
            debugInfo.newestRecordFound = cdate.toISOString()
          }

          // Check if this record is new enough
          if (cdate > adjustedLastPolledAt) {
            foundNewRecords = true
            const recordId = record.contact
            const tagName = tagMap[String(record.tag)]

            debugInfo.processingDetails.push(`[Contact ${recordId}] New tag! cdate=${cdate.toISOString()}, tag=${tagName}`)

            // Fetch full contact details
            try {
              const contactResponse = await fetch(`${baseUrl}/api/3/contacts/${recordId}`, {
                headers: { 'Api-Token': apiKey }
              })
              if (contactResponse.ok) {
                const contactData = await contactResponse.json()
                const contact = contactData.contact
                if (contact) {
                  // Add tag info to contact
                  contact.tag_names = tagName
                  contact.tags = tagName

                  // Check if this matches our filters
                  if (matchesFilters('activecampaign', triggerEvent, contact, filters)) {
                    events.push({
                      id: `activecampaign_${contact.id}_${Date.now()}`,
                      crm: 'activecampaign',
                      eventType: triggerEvent,
                      recordId: contact.id,
                      phone: contact.phone || null,
                      firstName: contact.firstName || null,
                      lastName: contact.lastName || null,
                      fullName: contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || null,
                      email: contact.email || null,
                      data: { ...record, ...contact },
                      timestamp: cdate,
                    })
                    debugInfo.processingDetails.push(`[Contact ${contact.id}] Added to events. Phone: ${contact.phone}`)
                  }
                }
              }
            } catch (e) {
              console.error(`[Polling] Failed to fetch contact ${recordId}:`, e)
            }
          }
        }

        // If we didn't find any new records on this page but got full results, try next page
        if (!foundNewRecords && rawRecords.length >= limit) {
          offset += limit
        } else if (rawRecords.length < limit) {
          // No more records to fetch
          allRecordsOld = true
        }
      }

      debugInfo.foundNewRecords = foundNewRecords
      console.log(`[AC Polling] Search complete: ${events.length} new events found after scanning ${debugInfo.totalRecordsScanned} records`)

      return { events, debugInfo }
    }

    // Non-tag events: standard single request
    queryParams.set('limit', '50')

    const response = await fetch(
      `${baseUrl}${endpoint}?${queryParams.toString()}`,
      {
        headers: {
          'Api-Token': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No error body')
      console.error(`[Polling] ActiveCampaign API error ${response.status}: ${errorBody}`)
      return { events: [], error: `ActiveCampaign API error: ${response.status} - ${errorBody.substring(0, 100)}` }
    }

    const result = await response.json()

    // AC returns results in a key named after the endpoint suffix
    const rawRecords = result.contacts || result.deals || []
    debugInfo.recordCount = rawRecords.length

    // Process records
    for (const record of rawRecords) {
      const eventTimestamp = new Date(record.updated_timestamp || record.udate || record.cdate || Date.now())

      if (!matchesFilters('activecampaign', triggerEvent, record, filters)) continue

      events.push({
        id: `activecampaign_${record.id}_${Date.now()}`,
        crm: 'activecampaign',
        eventType: triggerEvent,
        recordId: record.id,
        phone: record.phone || null,
        firstName: record.firstName || null,
        lastName: record.lastName || null,
        fullName: record.fullName || [record.firstName, record.lastName].filter(Boolean).join(' ') || null,
        email: record.email || null,
        data: record,
        timestamp: eventTimestamp,
      })
    }

    return { events, debugInfo }
  } catch (error) {
    console.error('[Polling] ActiveCampaign error:', error)
    return { events: [], error: String(error) }
  }
}

// ===========================================
// Monday.com Polling
// Verwendet GraphQL mit activity_logs oder items query
// ===========================================

export async function pollMondayEvents(
  apiToken: string,
  boardId: string,
  triggerEvent: string,
  lastPolledAt: Date,
  phoneColumnId?: string,
  filters?: Record<string, string>
): Promise<PollingResult> {
  try {
    // Query for items updated after lastPolledAt
    // Monday doesn't have a direct "updated_after" filter, so we use activity_logs
    const query = `
      query ($boardId: ID!, $limit: Int!) {
        boards(ids: [$boardId]) {
          activity_logs(limit: $limit) {
            id
            event
            data
            created_at
          }
          items_page(limit: 50) {
            items {
              id
              name
              updated_at
              group {
                id
                title
              }
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({
        query,
        variables: { boardId, limit: 100 },
      }),
    })

    if (!response.ok) {
      return { events: [], error: `Monday.com API error: ${response.status}` }
    }

    const result = await response.json()

    if (result.errors?.length) {
      return { events: [], error: result.errors[0]?.message || 'GraphQL Error' }
    }

    const board = result.data?.boards?.[0]
    if (!board) {
      return { events: [] }
    }

    // Filter items by updated_at
    const items = board.items_page?.items || []
    const events: CRMEvent[] = []

    for (const item of items) {
      const updatedAt = new Date(item.updated_at)
      if (updatedAt <= lastPolledAt) continue

      // Check event type filter
      if (triggerEvent === 'item_moved_to_group' && filters?.group_id) {
        if (item.group?.id !== filters.group_id) continue
      }

      // Extract phone from column values
      let phone: string | null = null
      let email: string | null = null
      let nameValue: string | null = null

      for (const col of item.column_values || []) {
        if (col.id === phoneColumnId || col.id.includes('phone')) {
          try {
            const parsed = JSON.parse(col.value || '{}')
            phone = parsed.phone || col.text || null
          } catch {
            phone = col.text || null
          }
        }
        if (col.id.includes('email')) {
          try {
            const parsed = JSON.parse(col.value || '{}')
            email = parsed.email || parsed.text || col.text || null
          } catch {
            email = col.text || null
          }
        }
        if (col.id.includes('name') && !nameValue) {
          nameValue = col.text || null
        }
      }

      const displayName = item.name || nameValue
      const nameParts = displayName?.split(' ') || []

      events.push({
        id: `monday_item_${item.id}_${Date.now()}`,
        crm: 'monday',
        eventType: triggerEvent,
        recordId: item.id,
        phone,
        firstName: nameParts[0] || null,
        lastName: nameParts.slice(1).join(' ') || null,
        fullName: displayName || null,
        email,
        data: {
          ...item,
          group: item.group,
          column_values: item.column_values,
        },
        timestamp: updatedAt,
      })
    }

    return { events }
  } catch (error) {
    console.error('[Polling] Monday.com error:', error)
    return { events: [], error: String(error) }
  }
}

// ===========================================
// Unified Polling Function
// ===========================================

export async function pollCRMEvents(
  crm: CRMType,
  config: PollingConfig,
  triggerEvent: string,
  lastPolledAt: Date,
  filters?: Record<string, string>
): Promise<PollingResult> {
  switch (crm) {
    case 'pipedrive':
      if (!config.apiToken) return { events: [], error: 'Pipedrive API token required' }
      return pollPipedriveEvents(config.apiToken, triggerEvent, lastPolledAt, filters)

    case 'hubspot':
      if (!config.accessToken) return { events: [], error: 'HubSpot access token required' }
      return pollHubSpotEvents(config.accessToken, triggerEvent, lastPolledAt, filters)

    case 'close':
      if (!config.apiKey) return { events: [], error: 'Close API key required' }
      return pollCloseEvents(config.apiKey, triggerEvent, lastPolledAt, filters)

    case 'activecampaign':
      if (!config.apiUrl || !config.apiKey) {
        return { events: [], error: 'ActiveCampaign API URL and key required' }
      }
      return pollActiveCampaignEvents(config.apiUrl, config.apiKey, triggerEvent, lastPolledAt, filters)

    case 'monday':
      if (!config.apiToken || !config.boardId) {
        return { events: [], error: 'Monday.com API token and board ID required' }
      }
      return pollMondayEvents(
        config.apiToken,
        config.boardId,
        triggerEvent,
        lastPolledAt,
        config.phoneColumnId,
        filters
      )

    default:
      return { events: [], error: `Unknown CRM type: ${crm}` }
  }
}

// ===========================================
// Contact Data Extraction
// Unified function to extract contact data from CRM events
// ===========================================

export interface ExtractedContact {
  phone: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  email: string | null
  externalId: string
}

export function extractContactFromEvent(event: CRMEvent): ExtractedContact {
  return {
    phone: event.phone,
    firstName: event.firstName,
    lastName: event.lastName,
    fullName: event.fullName || [event.firstName, event.lastName].filter(Boolean).join(' ') || null,
    email: event.email,
    externalId: event.recordId,
  }
}

/**
 * Extract contact from raw CRM webhook payload
 * Used by the unified webhook endpoint
 */
export function extractContactFromPayload(
  crm: CRMType,
  payload: Record<string, unknown>
): ExtractedContact {
  switch (crm) {
    case 'pipedrive': {
      // Pipedrive usually sends data in 'current', but fall back to the root payload
      const data = (payload.current as Record<string, unknown>) || payload
      const phone = (data.phone as Array<{ value: string }>)?.[0]?.value || (data.phone as string) || null
      const firstName = (data.first_name as string) || (data.firstname as string) || null
      const lastName = (data.last_name as string) || (data.lastname as string) || null
      return {
        phone,
        firstName,
        lastName,
        fullName: (data.name as string) || [firstName, lastName].filter(Boolean).join(' ') || null,
        email: (data.email as Array<{ value: string }>)?.[0]?.value || (data.email as string) || null,
        externalId: String(data.id || payload.id || ''),
      }
    }

    case 'hubspot': {
      // HubSpot usually sends 'properties', but fallback to root
      const props = (payload.properties as Record<string, any>) || payload
      return {
        phone: props.phone || props.mobilephone || null,
        firstName: props.firstname || null,
        lastName: props.lastname || null,
        fullName: [props.firstname, props.lastname].filter(Boolean).join(' ') || null,
        email: props.email || null,
        externalId: String(payload.objectId || payload.id || ''),
      }
    }

    case 'monday': {
      const event = payload.event as Record<string, unknown> | undefined
      const pulseName = (event?.pulseName as string) || ''
      const nameParts = pulseName.split(' ')

      // Try to extract phone from column value
      const columnValue = event?.value as Record<string, unknown> | undefined
      const phone = (columnValue?.phone as string) || (columnValue?.text as string) || null

      return {
        phone,
        firstName: nameParts[0] || null,
        lastName: nameParts.slice(1).join(' ') || null,
        fullName: pulseName || null,
        email: null,
        externalId: String(event?.pulseId || ''),
      }
    }

    case 'close': {
      const lead = payload as Record<string, unknown>
      const contacts = lead.contacts as Array<Record<string, unknown>> | undefined
      const contact = contacts?.[0]
      const phones = contact?.phones as Array<{ phone: string }> | undefined
      const emails = contact?.emails as Array<{ email: string }> | undefined
      const contactName = (contact?.name as string) || ''
      const nameParts = contactName.split(' ')

      return {
        phone: phones?.[0]?.phone || null,
        firstName: nameParts[0] || null,
        lastName: nameParts.slice(1).join(' ') || null,
        fullName: contactName || (lead.display_name as string) || null,
        email: emails?.[0]?.email || null,
        externalId: String(lead.id || ''),
      }
    }

    case 'activecampaign': {
      // AC can send data as nested contact object or flattened contact[field] keys
      const contact = payload.contact as Record<string, any> | undefined

      const getVal = (key: string) => {
        if (contact && contact[key]) return String(contact[key])
        const flatKey = `contact[${key}]`
        if (payload[flatKey]) return String(payload[flatKey])
        const underscoreKey = `contact_${key}`
        if (payload[underscoreKey]) return String(payload[underscoreKey])
        if (payload[key]) return String(payload[key])
        return null
      }

      return {
        phone: getVal('phone'),
        firstName: getVal('firstName') || getVal('first_name'),
        lastName: getVal('lastName') || getVal('last_name'),
        fullName: [getVal('firstName') || getVal('first_name'), getVal('lastName') || getVal('last_name')].filter(Boolean).join(' ') || null,
        email: getVal('email'),
        externalId: String(getVal('id') || ''),
      }
    }

    default:
      return {
        phone: null,
        firstName: null,
        lastName: null,
        fullName: null,
        email: null,
        externalId: '',
      }
  }
}
/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return undefined
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return (current as any)[key]
    }
    return undefined
  }, obj)
}
