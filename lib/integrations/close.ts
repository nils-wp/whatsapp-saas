/**
 * Close CRM Integration
 * Ermöglicht das Abrufen und Aktualisieren von Leads aus Close
 */

interface CloseConfig {
  apiKey: string
}

interface Lead {
  id: string
  displayName: string
  status: string
  contacts: CloseContact[]
  customFields: Record<string, unknown>
}

interface CloseContact {
  id: string
  name: string
  emails: Array<{ email: string; type: string }>
  phones: Array<{ phone: string; type: string }>
}

interface Opportunity {
  id: string
  leadId: string
  status: string
  value: number
  confidence: number
  note: string
}

const CLOSE_API_BASE = 'https://api.close.com/api/v1'

/**
 * Macht einen API Request zu Close
 */
async function closeRequest(
  config: CloseConfig,
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const auth = Buffer.from(`${config.apiKey}:`).toString('base64')

  return fetch(`${CLOSE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

/**
 * Sucht einen Lead nach Telefonnummer
 */
export async function findLeadByPhone(
  config: CloseConfig,
  phone: string
): Promise<Lead | null> {
  try {
    const normalizedPhone = phone.replace(/\D/g, '')

    const response = await closeRequest(
      config,
      `/lead/?query=phone:${encodeURIComponent(normalizedPhone)}`
    )

    if (!response.ok) {
      console.error('Close API error:', response.status)
      return null
    }

    const data = await response.json()
    const lead = data.data?.[0]

    if (!lead) return null

    return {
      id: lead.id,
      displayName: lead.display_name,
      status: lead.status_label,
      contacts: lead.contacts?.map((c: any) => ({
        id: c.id,
        name: c.name,
        emails: c.emails || [],
        phones: c.phones || [],
      })) || [],
      customFields: lead.custom || {},
    }
  } catch (error) {
    console.error('Close findLeadByPhone error:', error)
    return null
  }
}

/**
 * Sucht einen Lead nach E-Mail
 */
export async function findLeadByEmail(
  config: CloseConfig,
  email: string
): Promise<Lead | null> {
  try {
    const response = await closeRequest(
      config,
      `/lead/?query=email:${encodeURIComponent(email)}`
    )

    if (!response.ok) return null

    const data = await response.json()
    const lead = data.data?.[0]

    if (!lead) return null

    return {
      id: lead.id,
      displayName: lead.display_name,
      status: lead.status_label,
      contacts: lead.contacts?.map((c: any) => ({
        id: c.id,
        name: c.name,
        emails: c.emails || [],
        phones: c.phones || [],
      })) || [],
      customFields: lead.custom || {},
    }
  } catch (error) {
    console.error('Close findLeadByEmail error:', error)
    return null
  }
}

/**
 * Erstellt einen neuen Lead
 */
export async function createLead(
  config: CloseConfig,
  leadData: {
    name: string
    contactName?: string
    email?: string
    phone?: string
    statusId?: string
    customFields?: Record<string, unknown>
  }
): Promise<Lead | null> {
  try {
    const contacts = []
    if (leadData.contactName || leadData.email || leadData.phone) {
      contacts.push({
        name: leadData.contactName || leadData.name,
        emails: leadData.email ? [{ email: leadData.email, type: 'office' }] : [],
        phones: leadData.phone ? [{ phone: leadData.phone, type: 'mobile' }] : [],
      })
    }

    const response = await closeRequest(config, '/lead/', {
      method: 'POST',
      body: JSON.stringify({
        name: leadData.name,
        status_id: leadData.statusId,
        contacts,
        custom: leadData.customFields || {},
      }),
    })

    if (!response.ok) {
      console.error('Close createLead error:', response.status)
      return null
    }

    const lead = await response.json()

    return {
      id: lead.id,
      displayName: lead.display_name,
      status: lead.status_label,
      contacts: lead.contacts?.map((c: any) => ({
        id: c.id,
        name: c.name,
        emails: c.emails || [],
        phones: c.phones || [],
      })) || [],
      customFields: lead.custom || {},
    }
  } catch (error) {
    console.error('Close createLead error:', error)
    return null
  }
}

/**
 * Aktualisiert einen Lead
 */
export async function updateLead(
  config: CloseConfig,
  leadId: string,
  updates: {
    statusId?: string
    customFields?: Record<string, unknown>
  }
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {}

    if (updates.statusId) {
      body.status_id = updates.statusId
    }

    if (updates.customFields) {
      body.custom = updates.customFields
    }

    const response = await closeRequest(config, `/lead/${leadId}/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })

    return response.ok
  } catch (error) {
    console.error('Close updateLead error:', error)
    return false
  }
}

/**
 * Erstellt eine Opportunity für einen Lead
 */
export async function createOpportunity(
  config: CloseConfig,
  opportunityData: {
    leadId: string
    statusId: string
    value?: number
    confidence?: number
    note?: string
  }
): Promise<Opportunity | null> {
  try {
    const response = await closeRequest(config, '/opportunity/', {
      method: 'POST',
      body: JSON.stringify({
        lead_id: opportunityData.leadId,
        status_id: opportunityData.statusId,
        value: opportunityData.value || 0,
        confidence: opportunityData.confidence || 50,
        note: opportunityData.note || '',
      }),
    })

    if (!response.ok) return null

    const opp = await response.json()

    return {
      id: opp.id,
      leadId: opp.lead_id,
      status: opp.status_label,
      value: opp.value,
      confidence: opp.confidence,
      note: opp.note,
    }
  } catch (error) {
    console.error('Close createOpportunity error:', error)
    return null
  }
}

/**
 * Aktualisiert Opportunity Status
 */
export async function updateOpportunityStatus(
  config: CloseConfig,
  opportunityId: string,
  statusId: string
): Promise<boolean> {
  try {
    const response = await closeRequest(config, `/opportunity/${opportunityId}/`, {
      method: 'PUT',
      body: JSON.stringify({
        status_id: statusId,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Close updateOpportunityStatus error:', error)
    return false
  }
}

/**
 * Fügt eine Notiz/Aktivität zu einem Lead hinzu
 */
export async function addNoteToLead(
  config: CloseConfig,
  leadId: string,
  note: string
): Promise<boolean> {
  try {
    const response = await closeRequest(config, '/activity/note/', {
      method: 'POST',
      body: JSON.stringify({
        lead_id: leadId,
        note: note,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Close addNoteToLead error:', error)
    return false
  }
}

/**
 * Holt Lead Statuses
 */
export async function getLeadStatuses(
  config: CloseConfig
): Promise<Array<{ id: string; label: string }>> {
  try {
    const response = await closeRequest(config, '/status/lead/')

    if (!response.ok) return []

    const data = await response.json()

    return data.data?.map((s: any) => ({
      id: s.id,
      label: s.label,
    })) || []
  } catch (error) {
    console.error('Close getLeadStatuses error:', error)
    return []
  }
}

/**
 * Holt Opportunity Statuses
 */
export async function getOpportunityStatuses(
  config: CloseConfig
): Promise<Array<{ id: string; label: string; type: string }>> {
  try {
    const response = await closeRequest(config, '/status/opportunity/')

    if (!response.ok) return []

    const data = await response.json()

    return data.data?.map((s: any) => ({
      id: s.id,
      label: s.label,
      type: s.type, // 'active', 'won', 'lost'
    })) || []
  } catch (error) {
    console.error('Close getOpportunityStatuses error:', error)
    return []
  }
}

/**
 * Testet die Verbindung
 */
export async function testConnection(config: CloseConfig): Promise<boolean> {
  try {
    const response = await closeRequest(config, '/me/')
    return response.ok
  } catch (error) {
    return false
  }
}
