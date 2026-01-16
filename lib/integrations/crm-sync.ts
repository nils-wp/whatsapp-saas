/**
 * CRM Sync - Zentrale Orchestrierung für alle CRM-Integrationen
 * Synchronisiert Konversationen und Nachrichten mit allen aktivierten CRMs
 */

import { createClient } from '@supabase/supabase-js'
import * as activecampaign from './activecampaign'
import * as close from './close'
import * as pipedrive from './pipedrive'
import * as hubspot from './hubspot'
import * as monday from './monday'

// Supabase Client für Service-Zugriff
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ===========================================
// Types
// ===========================================

export interface TenantIntegrations {
  id: string
  tenant_id: string

  // Close
  close_enabled: boolean
  close_api_key: string | null
  close_status_new: string | null
  close_status_contacted: string | null
  close_status_qualified: string | null
  close_status_booked: string | null
  close_status_not_interested: string | null
  close_custom_field_whatsapp_status: string | null
  close_custom_field_conversation_id: string | null

  // ActiveCampaign
  activecampaign_enabled: boolean
  activecampaign_api_url: string | null
  activecampaign_api_key: string | null
  activecampaign_tag_contacted: string | null
  activecampaign_tag_qualified: string | null
  activecampaign_tag_booked: string | null
  activecampaign_tag_not_interested: string | null
  activecampaign_pipeline_id: string | null
  activecampaign_stage_new: string | null
  activecampaign_stage_booked: string | null
  activecampaign_field_whatsapp_status: string | null
  activecampaign_field_last_contact: string | null

  // Pipedrive
  pipedrive_enabled: boolean
  pipedrive_api_token: string | null
  pipedrive_pipeline_id: string | null
  pipedrive_stage_new: string | null
  pipedrive_stage_contacted: string | null
  pipedrive_stage_qualified: string | null
  pipedrive_stage_booked: string | null
  pipedrive_stage_lost: string | null

  // HubSpot
  hubspot_enabled: boolean
  hubspot_access_token: string | null
  hubspot_refresh_token: string | null
  hubspot_portal_id: string | null
  hubspot_pipeline_id: string | null
  hubspot_stage_new: string | null
  hubspot_stage_contacted: string | null
  hubspot_stage_qualified: string | null
  hubspot_stage_booked: string | null
  hubspot_stage_lost: string | null

  // Monday.com
  monday_enabled: boolean
  monday_api_token: string | null
  monday_board_id: string | null
  monday_phone_column_id: string | null
  monday_name_column_id: string | null
  monday_email_column_id: string | null
  monday_status_column_id: string | null
  monday_group_new: string | null
  monday_group_contacted: string | null
  monday_group_qualified: string | null
  monday_group_booked: string | null
  monday_group_lost: string | null

  // Webhook
  webhook_enabled: boolean
  webhook_url: string | null
  webhook_secret: string | null
  webhook_events: string[] | null

  // Tracking
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null
}

export type ConversationOutcome = 'contacted' | 'qualified' | 'booked' | 'not_interested' | 'escalated'

interface CRMContact {
  id: string
  source: 'close' | 'activecampaign' | 'pipedrive' | 'hubspot' | 'monday'
  externalId?: string
}

// ===========================================
// Main Functions
// ===========================================

/**
 * Lädt die Integration-Konfiguration für einen Tenant
 */
export async function getTenantIntegrations(tenantId: string): Promise<TenantIntegrations | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    console.error('Error loading tenant integrations:', error)
    return null
  }

  return data as TenantIntegrations
}

/**
 * Loggt eine Nachricht in allen aktivierten CRMs
 */
export async function logMessageToCRM(options: {
  tenantId: string
  phone: string
  contactName?: string
  message: string
  direction: 'inbound' | 'outbound'
  agentName?: string
  conversationId?: string
}): Promise<void> {
  const integrations = await getTenantIntegrations(options.tenantId)
  if (!integrations) return

  const promises: Promise<void>[] = []

  // Close CRM
  if (integrations.close_enabled && integrations.close_api_key) {
    promises.push(
      logToClose(integrations, options).catch(err =>
        console.error('Close sync error:', err)
      )
    )
  }

  // ActiveCampaign
  if (integrations.activecampaign_enabled &&
      integrations.activecampaign_api_url &&
      integrations.activecampaign_api_key) {
    promises.push(
      logToActiveCampaign(integrations, options).catch(err =>
        console.error('ActiveCampaign sync error:', err)
      )
    )
  }

  // Pipedrive
  if (integrations.pipedrive_enabled && integrations.pipedrive_api_token) {
    promises.push(
      logToPipedrive(integrations, options).catch(err =>
        console.error('Pipedrive sync error:', err)
      )
    )
  }

  // HubSpot
  if (integrations.hubspot_enabled && integrations.hubspot_access_token) {
    promises.push(
      logToHubSpot(integrations, options).catch(err =>
        console.error('HubSpot sync error:', err)
      )
    )
  }

  // Monday.com
  if (integrations.monday_enabled && integrations.monday_api_token && integrations.monday_board_id) {
    promises.push(
      logToMonday(integrations, options).catch(err =>
        console.error('Monday sync error:', err)
      )
    )
  }

  // Alle parallel ausführen, Fehler werden geloggt aber brechen nicht ab
  await Promise.allSettled(promises)
}

/**
 * Aktualisiert den Lead-Status in allen aktivierten CRMs basierend auf Conversation-Outcome
 */
export async function updateCRMStatus(options: {
  tenantId: string
  phone: string
  outcome: ConversationOutcome
  note?: string
  conversationId?: string
}): Promise<void> {
  const integrations = await getTenantIntegrations(options.tenantId)
  if (!integrations) return

  const promises: Promise<void>[] = []

  // Close CRM
  if (integrations.close_enabled && integrations.close_api_key) {
    promises.push(
      updateCloseStatus(integrations, options).catch(err =>
        console.error('Close status update error:', err)
      )
    )
  }

  // ActiveCampaign
  if (integrations.activecampaign_enabled &&
      integrations.activecampaign_api_url &&
      integrations.activecampaign_api_key) {
    promises.push(
      updateActiveCampaignStatus(integrations, options).catch(err =>
        console.error('ActiveCampaign status update error:', err)
      )
    )
  }

  // Pipedrive
  if (integrations.pipedrive_enabled && integrations.pipedrive_api_token) {
    promises.push(
      updatePipedriveStatus(integrations, options).catch(err =>
        console.error('Pipedrive status update error:', err)
      )
    )
  }

  // HubSpot
  if (integrations.hubspot_enabled && integrations.hubspot_access_token) {
    promises.push(
      updateHubSpotStatus(integrations, options).catch(err =>
        console.error('HubSpot status update error:', err)
      )
    )
  }

  // Monday.com
  if (integrations.monday_enabled && integrations.monday_api_token && integrations.monday_board_id) {
    promises.push(
      updateMondayStatus(integrations, options).catch(err =>
        console.error('Monday status update error:', err)
      )
    )
  }

  await Promise.allSettled(promises)
}

/**
 * Synchronisiert eine komplette Conversation zu allen CRMs
 */
export async function syncConversationToCRM(options: {
  tenantId: string
  conversationId: string
}): Promise<void> {
  const supabase = getSupabase()

  // Lade Conversation mit Messages
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .eq('id', options.conversationId)
    .single()

  if (!conversation) return

  const integrations = await getTenantIntegrations(options.tenantId)
  if (!integrations) return

  const messages = (conversation.messages || []) as Array<{
    direction: string
    content: string
    created_at: string
    sender_type: string
  }>

  // Erstelle Conversation-Zusammenfassung
  const summary = messages
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(m => {
      const prefix = m.direction === 'inbound' ? '👤 Kunde:' : '🤖 Agent:'
      return `${prefix} ${m.content}`
    })
    .join('\n\n')

  const summaryNote = `📱 WhatsApp Conversation (${new Date().toLocaleDateString('de-DE')})\n\nStatus: ${conversation.status}\nOutcome: ${conversation.outcome || 'Offen'}\n\n--- Verlauf ---\n\n${summary}`

  const promises: Promise<void>[] = []

  // Close CRM
  if (integrations.close_enabled && integrations.close_api_key) {
    promises.push(
      syncToClose(integrations, conversation.contact_phone, summaryNote).catch(err =>
        console.error('Close sync error:', err)
      )
    )
  }

  // Pipedrive
  if (integrations.pipedrive_enabled && integrations.pipedrive_api_token) {
    promises.push(
      syncToPipedrive(integrations, conversation.contact_phone, summaryNote).catch(err =>
        console.error('Pipedrive sync error:', err)
      )
    )
  }

  // HubSpot
  if (integrations.hubspot_enabled && integrations.hubspot_access_token) {
    promises.push(
      syncToHubSpot(integrations, conversation.contact_phone, summaryNote).catch(err =>
        console.error('HubSpot sync error:', err)
      )
    )
  }

  // Monday.com
  if (integrations.monday_enabled && integrations.monday_api_token) {
    promises.push(
      syncToMonday(integrations, conversation.contact_phone, summaryNote).catch(err =>
        console.error('Monday sync error:', err)
      )
    )
  }

  await Promise.allSettled(promises)

  // Update sync timestamp
  await supabase
    .from('tenant_integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'success',
      last_sync_error: null,
    })
    .eq('tenant_id', options.tenantId)
}

/**
 * Findet oder erstellt einen Kontakt in allen aktivierten CRMs
 */
export async function findOrCreateCRMContact(options: {
  tenantId: string
  phone: string
  name?: string
  email?: string
}): Promise<CRMContact[]> {
  const integrations = await getTenantIntegrations(options.tenantId)
  if (!integrations) return []

  const contacts: CRMContact[] = []

  // Close
  if (integrations.close_enabled && integrations.close_api_key) {
    const config = { apiKey: integrations.close_api_key }
    let lead = await close.findLeadByPhone(config, options.phone)
    if (!lead && options.name) {
      lead = await close.createLead(config, {
        name: options.name,
        phone: options.phone,
        email: options.email,
      })
    }
    if (lead) {
      contacts.push({ id: lead.id, source: 'close' })
    }
  }

  // Pipedrive
  if (integrations.pipedrive_enabled && integrations.pipedrive_api_token) {
    const config: pipedrive.PipedriveConfig = { apiToken: integrations.pipedrive_api_token }
    let person = await pipedrive.findPersonByPhone(config, options.phone)
    if (!person && options.name) {
      person = await pipedrive.createPerson(config, {
        name: options.name,
        phone: options.phone,
        email: options.email,
      })
    }
    if (person) {
      contacts.push({ id: person.id.toString(), source: 'pipedrive' })
    }
  }

  // HubSpot
  if (integrations.hubspot_enabled && integrations.hubspot_access_token) {
    const config: hubspot.HubSpotConfig = { accessToken: integrations.hubspot_access_token }
    let contact = await hubspot.findContactByPhone(config, options.phone)
    if (!contact && options.name) {
      contact = await hubspot.createContact(config, {
        name: options.name,
        phone: options.phone,
        email: options.email,
      })
    }
    if (contact) {
      contacts.push({ id: contact.id, source: 'hubspot' })
    }
  }

  // Monday
  if (integrations.monday_enabled && integrations.monday_api_token && integrations.monday_board_id) {
    const config: monday.MondayConfig = {
      apiToken: integrations.monday_api_token,
      boardId: integrations.monday_board_id,
      phoneColumnId: integrations.monday_phone_column_id || undefined,
      emailColumnId: integrations.monday_email_column_id || undefined,
      groupNew: integrations.monday_group_new || undefined,
    }
    let item = await monday.findItemByPhone(config, options.phone)
    if (!item && options.name) {
      item = await monday.createItem(config, {
        name: options.name,
        phone: options.phone,
        email: options.email,
      })
    }
    if (item) {
      contacts.push({ id: item.id, source: 'monday' })
    }
  }

  return contacts
}

// ===========================================
// Private Helper Functions - Close
// ===========================================

async function logToClose(
  integrations: TenantIntegrations,
  options: {
    phone: string
    contactName?: string
    message: string
    direction: 'inbound' | 'outbound'
    agentName?: string
  }
): Promise<void> {
  const config = { apiKey: integrations.close_api_key! }

  // Finde oder erstelle Lead
  let lead = await close.findLeadByPhone(config, options.phone)
  if (!lead) {
    lead = await close.createLead(config, {
      name: options.contactName || `WhatsApp ${options.phone}`,
      phone: options.phone,
    })
  }
  if (!lead) return

  // Finde Contact für die Telefonnummer
  const contact = lead.contacts?.find(c =>
    c.phones?.some(p => p.phone.replace(/\D/g, '').includes(options.phone.replace(/\D/g, '')))
  )

  // Logge als SMS-Aktivität
  await close.logSmsActivity(config, {
    leadId: lead.id,
    contactId: contact?.id,
    remotePhone: options.phone,
    localPhone: options.agentName ? `WhatsApp (${options.agentName})` : 'WhatsApp',
    text: options.message,
    direction: options.direction,
  })
}

async function updateCloseStatus(
  integrations: TenantIntegrations,
  options: { phone: string; outcome: ConversationOutcome; note?: string }
): Promise<void> {
  const config = { apiKey: integrations.close_api_key! }
  const lead = await close.findLeadByPhone(config, options.phone)
  if (!lead) return

  // Status-Mapping
  const statusMap: Record<ConversationOutcome, string | null> = {
    contacted: integrations.close_status_contacted,
    qualified: integrations.close_status_qualified,
    booked: integrations.close_status_booked,
    not_interested: integrations.close_status_not_interested,
    escalated: null,
  }

  const statusId = statusMap[options.outcome]
  if (statusId) {
    await close.updateLead(config, lead.id, { statusId })
  }

  if (options.note) {
    await close.addNoteToLead(config, lead.id, options.note)
  }
}

async function syncToClose(
  integrations: TenantIntegrations,
  phone: string,
  note: string
): Promise<void> {
  const config = { apiKey: integrations.close_api_key! }
  const lead = await close.findLeadByPhone(config, phone)
  if (lead) {
    await close.addNoteToLead(config, lead.id, note)
  }
}

// ===========================================
// Private Helper Functions - ActiveCampaign
// ===========================================

async function logToActiveCampaign(
  integrations: TenantIntegrations,
  options: {
    phone: string
    contactName?: string
    message: string
    direction: 'inbound' | 'outbound'
  }
): Promise<void> {
  const config = {
    apiUrl: integrations.activecampaign_api_url!,
    apiKey: integrations.activecampaign_api_key!,
  }

  // Finde oder erstelle Kontakt
  let contact = await activecampaign.findContactByPhone(config, options.phone)
  if (!contact && options.contactName) {
    contact = await activecampaign.upsertContact(config, {
      email: `${options.phone.replace(/\D/g, '')}@whatsapp.placeholder`,
      firstName: options.contactName,
      phone: options.phone,
    })
  }

  // ActiveCampaign hat keine native SMS/Note API
  // Hier könnte man Custom Fields updaten
  if (contact && integrations.activecampaign_field_last_contact) {
    await activecampaign.updateCustomField(
      config,
      contact.id,
      integrations.activecampaign_field_last_contact,
      new Date().toISOString()
    )
  }
}

async function updateActiveCampaignStatus(
  integrations: TenantIntegrations,
  options: { phone: string; outcome: ConversationOutcome }
): Promise<void> {
  const config = {
    apiUrl: integrations.activecampaign_api_url!,
    apiKey: integrations.activecampaign_api_key!,
  }

  const contact = await activecampaign.findContactByPhone(config, options.phone)
  if (!contact) return

  // Tag-Mapping
  const tagMap: Record<ConversationOutcome, string | null> = {
    contacted: integrations.activecampaign_tag_contacted,
    qualified: integrations.activecampaign_tag_qualified,
    booked: integrations.activecampaign_tag_booked,
    not_interested: integrations.activecampaign_tag_not_interested,
    escalated: null,
  }

  const tagId = tagMap[options.outcome]
  if (tagId) {
    await activecampaign.addTagToContact(config, contact.id, tagId)
  }

  // Update WhatsApp Status Custom Field
  if (integrations.activecampaign_field_whatsapp_status) {
    await activecampaign.updateCustomField(
      config,
      contact.id,
      integrations.activecampaign_field_whatsapp_status,
      options.outcome
    )
  }
}

// ===========================================
// Private Helper Functions - Pipedrive
// ===========================================

async function logToPipedrive(
  integrations: TenantIntegrations,
  options: {
    phone: string
    contactName?: string
    message: string
    direction: 'inbound' | 'outbound'
  }
): Promise<void> {
  const config: pipedrive.PipedriveConfig = {
    apiToken: integrations.pipedrive_api_token!,
    pipelineId: integrations.pipedrive_pipeline_id || undefined,
    stageNew: integrations.pipedrive_stage_new || undefined,
  }

  // Finde oder erstelle Person
  let person = await pipedrive.findPersonByPhone(config, options.phone)
  if (!person && options.contactName) {
    person = await pipedrive.createPerson(config, {
      name: options.contactName,
      phone: options.phone,
    })
  }
  if (!person) return

  // Logge als Aktivität
  await pipedrive.logWhatsAppMessage(config, {
    personId: person.id,
    message: options.message,
    direction: options.direction,
  })
}

async function updatePipedriveStatus(
  integrations: TenantIntegrations,
  options: { phone: string; outcome: ConversationOutcome; note?: string }
): Promise<void> {
  const config: pipedrive.PipedriveConfig = {
    apiToken: integrations.pipedrive_api_token!,
    pipelineId: integrations.pipedrive_pipeline_id || undefined,
  }

  const person = await pipedrive.findPersonByPhone(config, options.phone)
  if (!person) return

  // Finde Deal für Person
  const deals = await pipedrive.getDealsForPerson(config, person.id)
  const deal = deals[0]

  if (deal) {
    // Stage-Mapping
    const stageMap: Record<ConversationOutcome, string | null> = {
      contacted: integrations.pipedrive_stage_contacted,
      qualified: integrations.pipedrive_stage_qualified,
      booked: integrations.pipedrive_stage_booked,
      not_interested: integrations.pipedrive_stage_lost,
      escalated: null,
    }

    const stageId = stageMap[options.outcome]
    if (stageId) {
      if (options.outcome === 'booked') {
        await pipedrive.markDealWon(config, deal.id)
      } else if (options.outcome === 'not_interested') {
        await pipedrive.markDealLost(config, deal.id, 'Kein Interesse')
      } else {
        await pipedrive.updateDealStage(config, deal.id, stageId)
      }
    }

    if (options.note) {
      await pipedrive.addNoteToDeal(config, deal.id, options.note)
    }
  } else if (options.note) {
    await pipedrive.addNoteToPerson(config, person.id, options.note)
  }
}

async function syncToPipedrive(
  integrations: TenantIntegrations,
  phone: string,
  note: string
): Promise<void> {
  const config: pipedrive.PipedriveConfig = {
    apiToken: integrations.pipedrive_api_token!,
  }

  const person = await pipedrive.findPersonByPhone(config, phone)
  if (person) {
    const deals = await pipedrive.getDealsForPerson(config, person.id)
    if (deals[0]) {
      await pipedrive.addNoteToDeal(config, deals[0].id, note)
    } else {
      await pipedrive.addNoteToPerson(config, person.id, note)
    }
  }
}

// ===========================================
// Private Helper Functions - HubSpot
// ===========================================

async function logToHubSpot(
  integrations: TenantIntegrations,
  options: {
    phone: string
    contactName?: string
    message: string
    direction: 'inbound' | 'outbound'
  }
): Promise<void> {
  const config: hubspot.HubSpotConfig = {
    accessToken: integrations.hubspot_access_token!,
    pipelineId: integrations.hubspot_pipeline_id || undefined,
  }

  // Finde oder erstelle Kontakt
  let contact = await hubspot.findContactByPhone(config, options.phone)
  if (!contact && options.contactName) {
    contact = await hubspot.createContact(config, {
      name: options.contactName,
      phone: options.phone,
    })
  }
  if (!contact) return

  // Logge als Note
  await hubspot.logWhatsAppMessage(config, {
    contactId: contact.id,
    message: options.message,
    direction: options.direction,
  })
}

async function updateHubSpotStatus(
  integrations: TenantIntegrations,
  options: { phone: string; outcome: ConversationOutcome; note?: string }
): Promise<void> {
  const config: hubspot.HubSpotConfig = {
    accessToken: integrations.hubspot_access_token!,
    pipelineId: integrations.hubspot_pipeline_id || undefined,
  }

  const contact = await hubspot.findContactByPhone(config, options.phone)
  if (!contact) return

  // Status am Kontakt updaten
  const statusMap: Record<ConversationOutcome, 'new' | 'contacted' | 'qualified' | 'booked' | 'not_interested'> = {
    contacted: 'contacted',
    qualified: 'qualified',
    booked: 'booked',
    not_interested: 'not_interested',
    escalated: 'contacted',
  }

  await hubspot.updateWhatsAppStatus(config, contact.id, statusMap[options.outcome])

  // Deal Stage updaten falls Deal existiert
  const deals = await hubspot.getDealsForContact(config, contact.id)
  if (deals[0]) {
    const stageMap: Record<ConversationOutcome, string | null> = {
      contacted: integrations.hubspot_stage_contacted,
      qualified: integrations.hubspot_stage_qualified,
      booked: integrations.hubspot_stage_booked,
      not_interested: integrations.hubspot_stage_lost,
      escalated: null,
    }

    const stageId = stageMap[options.outcome]
    if (stageId) {
      await hubspot.updateDealStage(config, deals[0].id, stageId)
    }
  }

  if (options.note) {
    await hubspot.createNote(config, {
      content: options.note,
      contactId: contact.id,
      dealId: deals[0]?.id,
    })
  }
}

async function syncToHubSpot(
  integrations: TenantIntegrations,
  phone: string,
  note: string
): Promise<void> {
  const config: hubspot.HubSpotConfig = {
    accessToken: integrations.hubspot_access_token!,
  }

  const contact = await hubspot.findContactByPhone(config, phone)
  if (contact) {
    const deals = await hubspot.getDealsForContact(config, contact.id)
    await hubspot.createNote(config, {
      content: note,
      contactId: contact.id,
      dealId: deals[0]?.id,
    })
  }
}

// ===========================================
// Private Helper Functions - Monday.com
// ===========================================

async function logToMonday(
  integrations: TenantIntegrations,
  options: {
    phone: string
    contactName?: string
    message: string
    direction: 'inbound' | 'outbound'
  }
): Promise<void> {
  const config: monday.MondayConfig = {
    apiToken: integrations.monday_api_token!,
    boardId: integrations.monday_board_id!,
    phoneColumnId: integrations.monday_phone_column_id || undefined,
    emailColumnId: integrations.monday_email_column_id || undefined,
    groupNew: integrations.monday_group_new || undefined,
  }

  // Finde oder erstelle Item
  let item = await monday.findItemByPhone(config, options.phone)
  if (!item && options.contactName) {
    item = await monday.createItem(config, {
      name: options.contactName,
      phone: options.phone,
    })
  }
  if (!item) return

  // Logge als Update
  await monday.logWhatsAppMessage(config, {
    itemId: item.id,
    message: options.message,
    direction: options.direction,
  })
}

async function updateMondayStatus(
  integrations: TenantIntegrations,
  options: { phone: string; outcome: ConversationOutcome; note?: string }
): Promise<void> {
  const config: monday.MondayConfig = {
    apiToken: integrations.monday_api_token!,
    boardId: integrations.monday_board_id!,
    phoneColumnId: integrations.monday_phone_column_id || undefined,
    statusColumnId: integrations.monday_status_column_id || undefined,
    groupContacted: integrations.monday_group_contacted || undefined,
    groupQualified: integrations.monday_group_qualified || undefined,
    groupBooked: integrations.monday_group_booked || undefined,
    groupLost: integrations.monday_group_lost || undefined,
  }

  const item = await monday.findItemByPhone(config, options.phone)
  if (!item) return

  // Verschiebe in entsprechende Gruppe
  await monday.updateWhatsAppStatus(config, item.id, options.outcome as 'contacted' | 'qualified' | 'booked' | 'not_interested')

  if (options.note) {
    await monday.addUpdate(config, item.id, options.note)
  }
}

async function syncToMonday(
  integrations: TenantIntegrations,
  phone: string,
  note: string
): Promise<void> {
  const config: monday.MondayConfig = {
    apiToken: integrations.monday_api_token!,
    boardId: integrations.monday_board_id!,
    phoneColumnId: integrations.monday_phone_column_id || undefined,
  }

  const item = await monday.findItemByPhone(config, phone)
  if (item) {
    await monday.addUpdate(config, item.id, note)
  }
}
