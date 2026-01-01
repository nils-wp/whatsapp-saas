/**
 * CRM Sync - Synchronisiert Conversations mit CRM Systemen
 * Loggt alle Nachrichten und aktualisiert Lead-Status
 */

import { createClient } from '@supabase/supabase-js'
import * as activecampaign from './activecampaign'
import * as close from './close'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface TenantIntegrations {
  // Close
  close_enabled: boolean
  close_api_key: string | null
  close_status_new: string | null
  close_status_contacted: string | null
  close_status_booked: string | null
  close_status_not_interested: string | null

  // ActiveCampaign
  activecampaign_enabled: boolean
  activecampaign_api_url: string | null
  activecampaign_api_key: string | null
  activecampaign_tag_booked: string | null
  activecampaign_tag_not_interested: string | null
}

/**
 * Loggt eine Nachricht im CRM
 */
export async function logMessageToCRM(options: {
  tenantId: string
  phone: string
  contactName?: string
  message: string
  direction: 'inbound' | 'outbound'
  agentName?: string
}): Promise<void> {
  const integrations = await getTenantIntegrations(options.tenantId)
  if (!integrations) return

  // Close CRM
  if (integrations.close_enabled && integrations.close_api_key) {
    await logToClose({
      config: { apiKey: integrations.close_api_key },
      phone: options.phone,
      contactName: options.contactName,
      message: options.message,
      direction: options.direction,
      agentName: options.agentName,
    })
  }

  // ActiveCampaign
  if (integrations.activecampaign_enabled &&
      integrations.activecampaign_api_url &&
      integrations.activecampaign_api_key) {
    await logToActiveCampaign({
      config: {
        apiUrl: integrations.activecampaign_api_url,
        apiKey: integrations.activecampaign_api_key,
      },
      phone: options.phone,
      contactName: options.contactName,
      message: options.message,
      direction: options.direction,
    })
  }
}

/**
 * Aktualisiert den Lead-Status im CRM basierend auf Conversation-Outcome
 */
export async function updateCRMStatus(options: {
  tenantId: string
  phone: string
  outcome: 'contacted' | 'booked' | 'not_interested' | 'escalated'
  note?: string
}): Promise<void> {
  const integrations = await getTenantIntegrations(options.tenantId)
  if (!integrations) return

  // Close CRM
  if (integrations.close_enabled && integrations.close_api_key) {
    const config = { apiKey: integrations.close_api_key }
    const lead = await close.findLeadByPhone(config, options.phone)

    if (lead) {
      // Status updaten
      let statusId: string | null = null
      switch (options.outcome) {
        case 'contacted':
          statusId = integrations.close_status_contacted
          break
        case 'booked':
          statusId = integrations.close_status_booked
          break
        case 'not_interested':
          statusId = integrations.close_status_not_interested
          break
      }

      if (statusId) {
        await close.updateLead(config, lead.id, { statusId })
      }

      // Notiz hinzufügen
      if (options.note) {
        await close.addNoteToLead(config, lead.id, options.note)
      }
    }
  }

  // ActiveCampaign
  if (integrations.activecampaign_enabled &&
      integrations.activecampaign_api_url &&
      integrations.activecampaign_api_key) {
    const config = {
      apiUrl: integrations.activecampaign_api_url,
      apiKey: integrations.activecampaign_api_key,
    }
    const contact = await activecampaign.findContactByPhone(config, options.phone)

    if (contact) {
      // Tags hinzufügen basierend auf Outcome
      if (options.outcome === 'booked' && integrations.activecampaign_tag_booked) {
        await activecampaign.addTagToContact(config, contact.id, integrations.activecampaign_tag_booked)
      }
      if (options.outcome === 'not_interested' && integrations.activecampaign_tag_not_interested) {
        await activecampaign.addTagToContact(config, contact.id, integrations.activecampaign_tag_not_interested)
      }
    }
  }
}

/**
 * Synchronisiert eine komplette Conversation zum CRM
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

  // Close CRM - Erstelle zusammenfassende Notiz
  if (integrations.close_enabled && integrations.close_api_key) {
    const config = { apiKey: integrations.close_api_key }
    const lead = await close.findLeadByPhone(config, conversation.contact_phone)

    if (lead) {
      const messages = (conversation.messages || []) as Array<{
        direction: string
        content: string
        created_at: string
      }>

      // Erstelle Conversation-Zusammenfassung
      const summary = messages
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(m => {
          const prefix = m.direction === 'inbound' ? '👤 Kunde:' : '🤖 Agent:'
          return `${prefix} ${m.content}`
        })
        .join('\n\n')

      const note = `📱 WhatsApp Conversation (${new Date().toLocaleDateString('de-DE')})\n\n${summary}`

      await close.addNoteToLead(config, lead.id, note)
    }
  }
}

/**
 * Lädt die SMS/WhatsApp-Historie aus Close für einen Kontakt
 */
export async function getMessageHistoryFromCRM(options: {
  tenantId: string
  phone: string
  limit?: number
}): Promise<Array<{
  text: string
  direction: 'inbound' | 'outbound'
  createdAt: string
}>> {
  const integrations = await getTenantIntegrations(options.tenantId)
  if (!integrations) return []

  // Close CRM
  if (integrations.close_enabled && integrations.close_api_key) {
    const config = { apiKey: integrations.close_api_key }
    const lead = await close.findLeadByPhone(config, options.phone)

    if (lead) {
      const smsHistory = await close.getSmsActivities(config, lead.id, options.limit || 50)
      return smsHistory.map(sms => ({
        text: sms.text,
        direction: sms.direction,
        createdAt: sms.createdAt,
      }))
    }
  }

  return []
}

// ============================================
// Private Helper Functions
// ============================================

async function getTenantIntegrations(tenantId: string): Promise<TenantIntegrations | null> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  return data as TenantIntegrations | null
}

async function logToClose(options: {
  config: { apiKey: string }
  phone: string
  contactName?: string
  message: string
  direction: 'inbound' | 'outbound'
  agentName?: string
}): Promise<void> {
  try {
    // Finde Lead
    let lead = await close.findLeadByPhone(options.config, options.phone)

    // Erstelle Lead falls nicht vorhanden
    if (!lead) {
      lead = await close.createLead(options.config, {
        name: options.contactName || `WhatsApp ${options.phone}`,
        phone: options.phone,
      })
    }

    if (!lead) return

    // Finde Contact ID für die Telefonnummer
    const contact = lead.contacts?.find(c =>
      c.phones?.some(p => p.phone.replace(/\D/g, '').includes(options.phone.replace(/\D/g, '')))
    )

    // Logge als SMS-Aktivität (erscheint im Chat-Verlauf in Close)
    await close.logSmsActivity(options.config, {
      leadId: lead.id,
      contactId: contact?.id,
      remotePhone: options.phone,
      localPhone: options.agentName ? `WhatsApp (${options.agentName})` : 'WhatsApp',
      text: options.message,
      direction: options.direction,
    })

  } catch (error) {
    console.error('Error logging to Close:', error)
  }
}

async function logToActiveCampaign(options: {
  config: { apiUrl: string; apiKey: string }
  phone: string
  contactName?: string
  message: string
  direction: 'inbound' | 'outbound'
}): Promise<void> {
  try {
    // Finde oder erstelle Kontakt
    let contact = await activecampaign.findContactByPhone(options.config, options.phone)

    if (!contact && options.contactName) {
      contact = await activecampaign.upsertContact(options.config, {
        email: `${options.phone}@whatsapp.placeholder`,
        firstName: options.contactName,
        phone: options.phone,
      })
    }

    // ActiveCampaign hat keine direkte "Note" API wie Close
    // Hier könnte man Custom Fields updaten oder Deal Notes nutzen

  } catch (error) {
    console.error('Error logging to ActiveCampaign:', error)
  }
}
