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

export interface PollingResult {
  events: CRMEvent[]
  newCursor?: string
  error?: string
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
        operator: 'GTE',
        value: lastPolledAt.getTime().toString(),
      }]
    }]

    // Add stage filter if specified
    if (triggerEvent === 'deal_stage_changed' && filters?.stage) {
      filterGroups[0].filters.push({
        propertyName: 'dealstage',
        operator: 'EQ',
        value: filters.stage,
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
      queryParams.set('date_created__gte', dateFilter)
    } else {
      queryParams.set('date_updated__gte', dateFilter)
    }

    queryParams.set('_limit', '50')
    queryParams.set('_order_by', '-date_updated')

    // Add status filter if specified
    if (filters?.status_id) {
      queryParams.set('status_id', filters.status_id)
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
    const baseUrl = apiUrl.replace(/\/+$/, '')
    const dateFilter = lastPolledAt.toISOString()

    // Determine endpoint based on trigger event
    let endpoint: string
    const queryParams = new URLSearchParams()

    if (triggerEvent.includes('deal') || triggerEvent.includes('stage')) {
      endpoint = '/api/3/deals'
      queryParams.set('filters[updated_timestamp][gte]', dateFilter)

      if (filters?.stage) {
        queryParams.set('filters[stage]', filters.stage)
      }
    } else {
      endpoint = '/api/3/contacts'
      queryParams.set('filters[updated_after]', dateFilter)

      if (filters?.list) {
        queryParams.set('listid', filters.list)
      }
    }

    queryParams.set('limit', '50')
    queryParams.set('orders[cdate]', 'DESC')

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
      return { events: [], error: `ActiveCampaign API error: ${response.status}` }
    }

    const result = await response.json()
    const events: CRMEvent[] = []

    const records = result.contacts || result.deals || []

    for (const record of records) {
      events.push({
        id: `activecampaign_${record.id}_${Date.now()}`,
        crm: 'activecampaign',
        eventType: triggerEvent,
        recordId: record.id,
        phone: record.phone || null,
        firstName: record.firstName || null,
        lastName: record.lastName || null,
        fullName: [record.firstName, record.lastName].filter(Boolean).join(' ') || null,
        email: record.email || null,
        data: record,
        timestamp: new Date(record.updated_timestamp || record.udate || Date.now()),
      })
    }

    return { events }
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
      const current = payload.current as Record<string, unknown> | undefined
      const phone = (current?.phone as Array<{ value: string }>)?.[0]?.value || null
      const firstName = (current?.first_name as string) || null
      const lastName = (current?.last_name as string) || null
      return {
        phone,
        firstName,
        lastName,
        fullName: (current?.name as string) || [firstName, lastName].filter(Boolean).join(' ') || null,
        email: (current?.email as Array<{ value: string }>)?.[0]?.value || null,
        externalId: String(current?.id || ''),
      }
    }

    case 'hubspot': {
      const props = payload.properties as Record<string, string> | undefined
      return {
        phone: props?.phone || null,
        firstName: props?.firstname || null,
        lastName: props?.lastname || null,
        fullName: [props?.firstname, props?.lastname].filter(Boolean).join(' ') || null,
        email: props?.email || null,
        externalId: String(payload.objectId || ''),
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
      const contact = payload.contact as Record<string, string> | undefined || payload
      return {
        phone: (contact as Record<string, string>).phone || null,
        firstName: (contact as Record<string, string>).firstName || null,
        lastName: (contact as Record<string, string>).lastName || null,
        fullName: [(contact as Record<string, string>).firstName, (contact as Record<string, string>).lastName].filter(Boolean).join(' ') || null,
        email: (contact as Record<string, string>).email || null,
        externalId: String((contact as Record<string, string>).id || ''),
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
