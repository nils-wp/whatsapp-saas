/**
 * HubSpot CRM Integration
 * Production-ready client für HubSpot API
 */

const HUBSPOT_API_BASE = 'https://api.hubapi.com'

export interface HubSpotConfig {
  accessToken: string
  refreshToken?: string
  portalId?: string
  pipelineId?: string
  stageNew?: string
  stageContacted?: string
  stageQualified?: string
  stageBooked?: string
  stageLost?: string
}

export interface HubSpotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    whatsapp_status?: string
    [key: string]: string | undefined
  }
}

export interface HubSpotDeal {
  id: string
  properties: {
    dealname: string
    amount?: string
    dealstage: string
    pipeline: string
    closedate?: string
    [key: string]: string | undefined
  }
}

interface HubSpotResponse<T> {
  success: boolean
  data: T | null
  error?: string
}

/**
 * Macht einen API Request zu HubSpot
 */
async function hubspotRequest<T>(
  config: HubSpotConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<HubSpotResponse<T>> {
  try {
    const response = await fetch(`${HUBSPOT_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('HubSpot API error:', response.status, errorData)
      return {
        success: false,
        data: null,
        error: errorData.message || `HTTP ${response.status}`
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('HubSpot request error:', error)
    return { success: false, data: null, error: String(error) }
  }
}

/**
 * Sucht einen Kontakt nach Telefonnummer
 */
export async function findContactByPhone(
  config: HubSpotConfig,
  phone: string
): Promise<HubSpotContact | null> {
  const normalizedPhone = phone.replace(/\D/g, '')

  const result = await hubspotRequest<{ results: HubSpotContact[] }>(
    config,
    '/crm/v3/objects/contacts/search',
    {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'phone',
            operator: 'CONTAINS_TOKEN',
            value: normalizedPhone,
          }],
        }],
        properties: ['firstname', 'lastname', 'email', 'phone', 'whatsapp_status'],
        limit: 1,
      }),
    }
  )

  return result.success && result.data?.results?.[0] || null
}

/**
 * Sucht einen Kontakt nach E-Mail
 */
export async function findContactByEmail(
  config: HubSpotConfig,
  email: string
): Promise<HubSpotContact | null> {
  const result = await hubspotRequest<{ results: HubSpotContact[] }>(
    config,
    '/crm/v3/objects/contacts/search',
    {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email,
          }],
        }],
        properties: ['firstname', 'lastname', 'email', 'phone', 'whatsapp_status'],
        limit: 1,
      }),
    }
  )

  return result.success && result.data?.results?.[0] || null
}

/**
 * Erstellt einen neuen Kontakt
 */
export async function createContact(
  config: HubSpotConfig,
  data: {
    name: string
    phone?: string
    email?: string
  }
): Promise<HubSpotContact | null> {
  const [firstName, ...lastNameParts] = data.name.split(' ')
  const lastName = lastNameParts.join(' ') || ''

  const result = await hubspotRequest<HubSpotContact>(
    config,
    '/crm/v3/objects/contacts',
    {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          phone: data.phone,
          email: data.email,
          whatsapp_status: 'new',
        },
      }),
    }
  )

  return result.success ? result.data : null
}

/**
 * Aktualisiert einen Kontakt
 */
export async function updateContact(
  config: HubSpotConfig,
  contactId: string,
  properties: Record<string, string>
): Promise<boolean> {
  const result = await hubspotRequest(
    config,
    `/crm/v3/objects/contacts/${contactId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    }
  )

  return result.success
}

/**
 * Sucht Deals für einen Kontakt
 */
export async function getDealsForContact(
  config: HubSpotConfig,
  contactId: string
): Promise<HubSpotDeal[]> {
  // Erst die Assoziationen holen
  const assocResult = await hubspotRequest<{ results: Array<{ id: string }> }>(
    config,
    `/crm/v3/objects/contacts/${contactId}/associations/deals`
  )

  if (!assocResult.success || !assocResult.data?.results?.length) {
    return []
  }

  // Dann die Deal-Details holen
  const dealIds = assocResult.data.results.map(r => r.id)
  const dealsResult = await hubspotRequest<{ results: HubSpotDeal[] }>(
    config,
    '/crm/v3/objects/deals/batch/read',
    {
      method: 'POST',
      body: JSON.stringify({
        inputs: dealIds.map(id => ({ id })),
        properties: ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate'],
      }),
    }
  )

  return dealsResult.success ? dealsResult.data?.results || [] : []
}

/**
 * Erstellt einen Deal
 */
export async function createDeal(
  config: HubSpotConfig,
  data: {
    title: string
    contactId: string
    value?: number
    stageId?: string
  }
): Promise<HubSpotDeal | null> {
  const dealResult = await hubspotRequest<HubSpotDeal>(
    config,
    '/crm/v3/objects/deals',
    {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          dealname: data.title,
          amount: data.value?.toString(),
          pipeline: config.pipelineId || 'default',
          dealstage: data.stageId || config.stageNew || 'appointmentscheduled',
        },
      }),
    }
  )

  if (!dealResult.success || !dealResult.data) {
    return null
  }

  // Deal mit Kontakt verknüpfen
  await hubspotRequest(
    config,
    `/crm/v3/objects/deals/${dealResult.data.id}/associations/contacts/${data.contactId}/deal_to_contact`,
    { method: 'PUT' }
  )

  return dealResult.data
}

/**
 * Aktualisiert Deal Stage
 */
export async function updateDealStage(
  config: HubSpotConfig,
  dealId: string,
  stageId: string
): Promise<boolean> {
  const result = await hubspotRequest(
    config,
    `/crm/v3/objects/deals/${dealId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        properties: { dealstage: stageId },
      }),
    }
  )

  return result.success
}

/**
 * Erstellt eine Notiz und verknüpft sie mit einem Kontakt
 */
export async function createNote(
  config: HubSpotConfig,
  data: {
    content: string
    contactId: string
    dealId?: string
  }
): Promise<boolean> {
  const timestamp = Date.now().toString()

  const noteResult = await hubspotRequest<{ id: string }>(
    config,
    '/crm/v3/objects/notes',
    {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          hs_timestamp: timestamp,
          hs_note_body: data.content,
        },
      }),
    }
  )

  if (!noteResult.success || !noteResult.data) {
    return false
  }

  // Mit Kontakt verknüpfen
  await hubspotRequest(
    config,
    `/crm/v3/objects/notes/${noteResult.data.id}/associations/contacts/${data.contactId}/note_to_contact`,
    { method: 'PUT' }
  )

  // Mit Deal verknüpfen falls vorhanden
  if (data.dealId) {
    await hubspotRequest(
      config,
      `/crm/v3/objects/notes/${noteResult.data.id}/associations/deals/${data.dealId}/note_to_deal`,
      { method: 'PUT' }
    )
  }

  return true
}

/**
 * Holt Pipeline Stages
 */
export async function getPipelineStages(
  config: HubSpotConfig,
  pipelineId?: string
): Promise<Array<{ id: string; label: string; displayOrder: number }>> {
  const pid = pipelineId || config.pipelineId || 'default'

  const result = await hubspotRequest<{ stages: Array<{ id: string; label: string; displayOrder: number }> }>(
    config,
    `/crm/v3/pipelines/deals/${pid}`
  )

  return result.success ? result.data?.stages || [] : []
}

/**
 * Holt alle Pipelines
 */
export async function getPipelines(
  config: HubSpotConfig
): Promise<Array<{ id: string; label: string }>> {
  const result = await hubspotRequest<{ results: Array<{ id: string; label: string }> }>(
    config,
    '/crm/v3/pipelines/deals'
  )

  return result.success ? result.data?.results || [] : []
}

/**
 * Testet die Verbindung
 */
export async function testConnection(config: HubSpotConfig): Promise<{
  success: boolean
  error?: string
  portalId?: string
}> {
  try {
    const result = await hubspotRequest<{ portalId: number }>(
      config,
      '/account-info/v3/details'
    )

    if (result.success && result.data) {
      return { success: true, portalId: result.data.portalId.toString() }
    }

    return { success: false, error: result.error || 'Verbindung fehlgeschlagen' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Loggt eine WhatsApp Nachricht als Notiz
 */
export async function logWhatsAppMessage(
  config: HubSpotConfig,
  options: {
    contactId: string
    dealId?: string
    message: string
    direction: 'inbound' | 'outbound'
  }
): Promise<boolean> {
  const directionLabel = options.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'
  const content = `**WhatsApp ${directionLabel}**\n\n${options.message}`

  return createNote(config, {
    content,
    contactId: options.contactId,
    dealId: options.dealId,
  })
}

/**
 * Aktualisiert WhatsApp Status am Kontakt
 */
export async function updateWhatsAppStatus(
  config: HubSpotConfig,
  contactId: string,
  status: 'new' | 'contacted' | 'qualified' | 'booked' | 'not_interested'
): Promise<boolean> {
  return updateContact(config, contactId, {
    whatsapp_status: status,
    hs_lead_status: status === 'booked' ? 'QUALIFIED' : status === 'not_interested' ? 'UNQUALIFIED' : 'IN_PROGRESS',
  })
}

// ===========================================
// Metadata Functions for Dynamic Filters
// ===========================================

/**
 * Holt alle Formulare
 */
export async function getForms(
  config: HubSpotConfig
): Promise<Array<{ id: string; name: string }>> {
  const result = await hubspotRequest<{ results: Array<{ guid: string; name: string }> }>(
    config,
    '/marketing/v3/forms'
  )

  return result.success
    ? result.data?.results?.map(f => ({ id: f.guid, name: f.name })) || []
    : []
}

/**
 * Holt alle Kontakt-Eigenschaften
 */
export async function getContactProperties(
  config: HubSpotConfig
): Promise<Array<{ name: string; label: string; type: string }>> {
  const result = await hubspotRequest<{ results: Array<{ name: string; label: string; type: string }> }>(
    config,
    '/crm/v3/properties/contacts'
  )

  return result.success
    ? result.data?.results?.map(p => ({ name: p.name, label: p.label, type: p.type })) || []
    : []
}

/**
 * Holt Ticket Pipelines
 */
export async function getTicketPipelines(
  config: HubSpotConfig
): Promise<Array<{ id: string; label: string; stages: Array<{ id: string; label: string }> }>> {
  const result = await hubspotRequest<{ results: Array<{ id: string; label: string; stages: Array<{ id: string; label: string }> }> }>(
    config,
    '/crm/v3/pipelines/tickets'
  )

  return result.success ? result.data?.results || [] : []
}

/**
 * Holt alle Deal Pipelines mit Stages
 */
export async function getPipelinesWithStages(
  config: HubSpotConfig
): Promise<Array<{ id: string; label: string; stages: Array<{ id: string; label: string }> }>> {
  const result = await hubspotRequest<{ results: Array<{ id: string; label: string; stages: Array<{ id: string; label: string }> }> }>(
    config,
    '/crm/v3/pipelines/deals'
  )

  return result.success ? result.data?.results || [] : []
}
