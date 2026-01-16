/**
 * Pipedrive CRM Integration
 * Production-ready client für Pipedrive API
 */

const PIPEDRIVE_API_BASE = 'https://api.pipedrive.com/v1'

export interface PipedriveConfig {
  apiToken: string
  pipelineId?: string
  stageNew?: string
  stageContacted?: string
  stageQualified?: string
  stageBooked?: string
  stageLost?: string
}

export interface PipedrivePerson {
  id: number
  name: string
  email: Array<{ value: string; primary: boolean }>
  phone: Array<{ value: string; primary: boolean }>
  org_id?: number
}

export interface PipedriveDeal {
  id: number
  title: string
  value: number
  currency: string
  status: 'open' | 'won' | 'lost' | 'deleted'
  stage_id: number
  person_id: number
}

interface PipedriveResponse<T> {
  success: boolean
  data: T
  error?: string
}

/**
 * Macht einen API Request zu Pipedrive
 */
async function pipedriveRequest<T>(
  config: PipedriveConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<PipedriveResponse<T>> {
  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${PIPEDRIVE_API_BASE}${endpoint}${separator}api_token=${config.apiToken}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      console.error('Pipedrive API error:', data.error || response.status)
      return { success: false, data: null as T, error: data.error }
    }

    return { success: true, data: data.data }
  } catch (error) {
    console.error('Pipedrive request error:', error)
    return { success: false, data: null as T, error: String(error) }
  }
}

/**
 * Sucht eine Person nach Telefonnummer
 */
export async function findPersonByPhone(
  config: PipedriveConfig,
  phone: string
): Promise<PipedrivePerson | null> {
  const normalizedPhone = phone.replace(/\D/g, '')

  const result = await pipedriveRequest<{ items: Array<{ item: PipedrivePerson }> }>(
    config,
    `/persons/search?term=${encodeURIComponent(normalizedPhone)}&fields=phone&limit=1`
  )

  if (!result.success || !result.data?.items?.length) {
    return null
  }

  return result.data.items[0].item
}

/**
 * Sucht eine Person nach E-Mail
 */
export async function findPersonByEmail(
  config: PipedriveConfig,
  email: string
): Promise<PipedrivePerson | null> {
  const result = await pipedriveRequest<{ items: Array<{ item: PipedrivePerson }> }>(
    config,
    `/persons/search?term=${encodeURIComponent(email)}&fields=email&limit=1`
  )

  if (!result.success || !result.data?.items?.length) {
    return null
  }

  return result.data.items[0].item
}

/**
 * Erstellt eine neue Person
 */
export async function createPerson(
  config: PipedriveConfig,
  data: {
    name: string
    phone?: string
    email?: string
  }
): Promise<PipedrivePerson | null> {
  const result = await pipedriveRequest<PipedrivePerson>(
    config,
    '/persons',
    {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        phone: data.phone ? [{ value: data.phone, primary: true, label: 'mobile' }] : undefined,
        email: data.email ? [{ value: data.email, primary: true, label: 'work' }] : undefined,
      }),
    }
  )

  return result.success ? result.data : null
}

/**
 * Aktualisiert eine Person
 */
export async function updatePerson(
  config: PipedriveConfig,
  personId: number,
  data: Partial<{
    name: string
    phone: string
    email: string
  }>
): Promise<boolean> {
  const updates: Record<string, unknown> = {}

  if (data.name) updates.name = data.name
  if (data.phone) updates.phone = [{ value: data.phone, primary: true }]
  if (data.email) updates.email = [{ value: data.email, primary: true }]

  const result = await pipedriveRequest(
    config,
    `/persons/${personId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    }
  )

  return result.success
}

/**
 * Sucht Deals für eine Person
 */
export async function getDealsForPerson(
  config: PipedriveConfig,
  personId: number
): Promise<PipedriveDeal[]> {
  const result = await pipedriveRequest<PipedriveDeal[]>(
    config,
    `/persons/${personId}/deals?status=open`
  )

  return result.success ? result.data || [] : []
}

/**
 * Erstellt einen Deal
 */
export async function createDeal(
  config: PipedriveConfig,
  data: {
    title: string
    personId: number
    value?: number
    currency?: string
    stageId?: string
  }
): Promise<PipedriveDeal | null> {
  const result = await pipedriveRequest<PipedriveDeal>(
    config,
    '/deals',
    {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        person_id: data.personId,
        value: data.value || 0,
        currency: data.currency || 'EUR',
        stage_id: data.stageId ? parseInt(data.stageId) : undefined,
        pipeline_id: config.pipelineId ? parseInt(config.pipelineId) : undefined,
      }),
    }
  )

  return result.success ? result.data : null
}

/**
 * Aktualisiert Deal Stage
 */
export async function updateDealStage(
  config: PipedriveConfig,
  dealId: number,
  stageId: string
): Promise<boolean> {
  const result = await pipedriveRequest(
    config,
    `/deals/${dealId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ stage_id: parseInt(stageId) }),
    }
  )

  return result.success
}

/**
 * Markiert Deal als gewonnen
 */
export async function markDealWon(
  config: PipedriveConfig,
  dealId: number
): Promise<boolean> {
  const result = await pipedriveRequest(
    config,
    `/deals/${dealId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status: 'won' }),
    }
  )

  return result.success
}

/**
 * Markiert Deal als verloren
 */
export async function markDealLost(
  config: PipedriveConfig,
  dealId: number,
  lostReason?: string
): Promise<boolean> {
  const result = await pipedriveRequest(
    config,
    `/deals/${dealId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        status: 'lost',
        lost_reason: lostReason,
      }),
    }
  )

  return result.success
}

/**
 * Fügt eine Notiz zu einem Deal hinzu
 */
export async function addNoteToDeal(
  config: PipedriveConfig,
  dealId: number,
  content: string
): Promise<boolean> {
  const result = await pipedriveRequest(
    config,
    '/notes',
    {
      method: 'POST',
      body: JSON.stringify({
        deal_id: dealId,
        content,
        pinned_to_deal_flag: 0,
      }),
    }
  )

  return result.success
}

/**
 * Fügt eine Notiz zu einer Person hinzu
 */
export async function addNoteToPerson(
  config: PipedriveConfig,
  personId: number,
  content: string
): Promise<boolean> {
  const result = await pipedriveRequest(
    config,
    '/notes',
    {
      method: 'POST',
      body: JSON.stringify({
        person_id: personId,
        content,
      }),
    }
  )

  return result.success
}

/**
 * Erstellt eine Aktivität (für Activity Log)
 */
export async function createActivity(
  config: PipedriveConfig,
  data: {
    subject: string
    note?: string
    type?: string
    personId?: number
    dealId?: number
    done?: boolean
  }
): Promise<boolean> {
  const result = await pipedriveRequest(
    config,
    '/activities',
    {
      method: 'POST',
      body: JSON.stringify({
        subject: data.subject,
        note: data.note,
        type: data.type || 'sms',
        person_id: data.personId,
        deal_id: data.dealId,
        done: data.done ? 1 : 0,
        due_date: new Date().toISOString().split('T')[0],
        due_time: new Date().toTimeString().slice(0, 5),
      }),
    }
  )

  return result.success
}

/**
 * Holt Pipeline Stages
 */
export async function getPipelineStages(
  config: PipedriveConfig,
  pipelineId?: string
): Promise<Array<{ id: number; name: string; order_nr: number }>> {
  const pid = pipelineId || config.pipelineId
  if (!pid) return []

  const result = await pipedriveRequest<Array<{ id: number; name: string; order_nr: number }>>(
    config,
    `/stages?pipeline_id=${pid}`
  )

  return result.success ? result.data || [] : []
}

/**
 * Holt alle Pipelines
 */
export async function getPipelines(
  config: PipedriveConfig
): Promise<Array<{ id: number; name: string }>> {
  const result = await pipedriveRequest<Array<{ id: number; name: string }>>(
    config,
    '/pipelines'
  )

  return result.success ? result.data || [] : []
}

/**
 * Testet die Verbindung
 */
export async function testConnection(config: PipedriveConfig): Promise<{
  success: boolean
  error?: string
  user?: { name: string; email: string }
}> {
  try {
    const result = await pipedriveRequest<{ name: string; email: string }>(
      config,
      '/users/me'
    )

    if (result.success) {
      return { success: true, user: result.data }
    }

    return { success: false, error: result.error || 'Verbindung fehlgeschlagen' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Loggt eine WhatsApp Nachricht als Aktivität
 */
export async function logWhatsAppMessage(
  config: PipedriveConfig,
  options: {
    personId: number
    dealId?: number
    message: string
    direction: 'inbound' | 'outbound'
  }
): Promise<boolean> {
  const directionLabel = options.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'

  return createActivity(config, {
    subject: `WhatsApp: ${directionLabel}`,
    note: options.message,
    type: 'sms',
    personId: options.personId,
    dealId: options.dealId,
    done: true,
  })
}
