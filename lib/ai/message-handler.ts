/**
 * Message Handler - Orchestriert die gesamte Nachrichtenverarbeitung
 * Mit Queue-System für Outside Hours und Escalations (n8n-style)
 */

import { createClient } from '@supabase/supabase-js'
import { processIncomingMessage, generateFirstMessage, generateSuggestedResponse } from './agent-processor'
import { checkWorkingHours, getNextBusinessDay8AM } from './working-hours'
import { sendTextMessage } from '@/lib/evolution/client'
import { logMessageToCRM, updateCRMStatus } from '@/lib/integrations/crm-sync'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface HandleMessageOptions {
  conversationId: string
  incomingMessage: string
  tenantId: string
}

interface HandleMessageResult {
  success: boolean
  response?: string
  action?: 'replied' | 'escalated' | 'queued_outside_hours' | 'error'
  error?: string
  queueId?: string
  scheduledFor?: string
}

/**
 * Hauptfunktion: Verarbeitet eine eingehende Nachricht komplett
 */
export async function handleIncomingMessage(
  options: HandleMessageOptions
): Promise<HandleMessageResult> {
  const supabase = getSupabase()
  const { conversationId, incomingMessage, tenantId } = options

  try {
    // 1. Lade Conversation mit Agent
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, agents(*), whatsapp_accounts(instance_name)')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.error('Conversation not found:', convError)
      return { success: false, error: 'Conversation not found', action: 'error' }
    }

    const agent = conversation.agents
    const instanceName = conversation.whatsapp_accounts?.instance_name

    if (!agent) {
      console.error('No agent assigned to conversation')
      return { success: false, error: 'No agent assigned', action: 'error' }
    }

    if (!instanceName) {
      console.error('No WhatsApp instance for conversation')
      return { success: false, error: 'No WhatsApp instance', action: 'error' }
    }

    // Log incoming message to CRM (always do this first)
    logMessageToCRM({
      tenantId,
      phone: conversation.contact_phone,
      contactName: conversation.contact_name || undefined,
      message: incomingMessage,
      direction: 'inbound',
    }).catch(err => console.error('CRM log error:', err))

    // 2. Prüfe Geschäftszeiten
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const officeHours = (agent as any).office_hours
    const workingHours = checkWorkingHours(officeHours ?? null)

    if (!workingHours.isOpen) {
      // Queue message for next business day
      const scheduledFor = getNextBusinessDay8AM(workingHours.timezone)

      const { data: queueEntry, error: queueError } = await supabase
        .from('message_queue')
        .insert({
          tenant_id: tenantId,
          conversation_id: conversationId,
          queue_type: 'outside_hours',
          original_message: incomingMessage,
          reason: `Empfangen außerhalb der Geschäftszeiten (${workingHours.currentTime || 'Unbekannt'})`,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
        })
        .select()
        .single()

      if (queueError) {
        console.error('Failed to queue message:', queueError)
      }

      // Send acknowledgment if configured
      const outsideHoursMessage = (agent as { outside_hours_message?: string }).outside_hours_message
      if (outsideHoursMessage) {
        await saveAndSendMessage({
          conversationId,
          tenantId,
          instanceName,
          phone: conversation.contact_phone,
          content: outsideHoursMessage,
          senderType: 'agent',
          contactName: conversation.contact_name || undefined,
          agentName: agent.agent_name || agent.name,
        })
      }

      return {
        success: true,
        action: 'queued_outside_hours',
        queueId: queueEntry?.id,
        scheduledFor: scheduledFor.toISOString(),
      }
    }

    // 3. Lade Message History
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // 4. Verarbeite mit AI Agent (mit Tools)
    const result = await processIncomingMessage(
      incomingMessage,
      conversation,
      agent,
      messageHistory || [],
      { tenantId, useTools: true }
    )

    // 5. Handle Eskalation
    if (result.shouldEscalate) {
      // Generate suggested response for human reviewer
      const suggestedResponse = await generateSuggestedResponse(
        incomingMessage,
        agent,
        messageHistory || []
      )

      // Add to escalation queue
      const { data: queueEntry, error: queueError } = await supabase
        .from('message_queue')
        .insert({
          tenant_id: tenantId,
          conversation_id: conversationId,
          queue_type: 'escalated',
          original_message: incomingMessage,
          reason: result.escalationReason,
          suggested_response: suggestedResponse,
          status: 'pending',
          priority: 1, // Higher priority for escalations
        })
        .select()
        .single()

      if (queueError) {
        console.error('Failed to queue escalation:', queueError)
      }

      // Update conversation status
      await supabase
        .from('conversations')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalation_reason: result.escalationReason,
        })
        .eq('id', conversationId)

      // Update CRM status to escalated
      updateCRMStatus({
        tenantId,
        phone: conversation.contact_phone,
        outcome: 'escalated',
        note: `Eskaliert: ${result.escalationReason}`,
      }).catch(err => console.error('CRM status error:', err))

      // Send escalation response to customer
      await saveAndSendMessage({
        conversationId,
        tenantId,
        instanceName,
        phone: conversation.contact_phone,
        content: result.response,
        senderType: 'agent',
        contactName: conversation.contact_name || undefined,
        agentName: agent.agent_name || agent.name,
      })

      return {
        success: true,
        response: result.response,
        action: 'escalated',
        queueId: queueEntry?.id,
      }
    }

    // 6. Update Script Step wenn nötig
    if (result.nextScriptStep && result.nextScriptStep !== conversation.current_script_step) {
      await supabase
        .from('conversations')
        .update({ current_script_step: result.nextScriptStep })
        .eq('id', conversationId)
    }

    // 7. Sende Antwort
    await saveAndSendMessage({
      conversationId,
      tenantId,
      instanceName,
      phone: conversation.contact_phone,
      content: result.response,
      senderType: 'agent',
      scriptStep: conversation.current_script_step,
      contactName: conversation.contact_name || undefined,
      agentName: agent.agent_name || agent.name,
    })

    return {
      success: true,
      response: result.response,
      action: 'replied',
    }

  } catch (error) {
    console.error('Error handling message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'error',
    }
  }
}

/**
 * Startet eine neue Conversation und sendet die erste Nachricht
 */
export async function startNewConversation(options: {
  tenantId: string
  triggerId: string
  phone: string
  contactName?: string
  externalLeadId?: string
  triggerData?: Record<string, unknown>
}): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  const supabase = getSupabase()

  try {
    // 1. Lade Trigger mit Agent und Account
    const { data: trigger, error: triggerError } = await supabase
      .from('triggers')
      .select('*, agents(*), whatsapp_accounts(instance_name)')
      .eq('id', options.triggerId)
      .single()

    if (triggerError || !trigger) {
      return { success: false, error: 'Trigger not found' }
    }

    if (!trigger.is_active) {
      return { success: false, error: 'Trigger is inactive' }
    }

    const agent = trigger.agents
    const instanceName = trigger.whatsapp_accounts?.instance_name

    if (!agent || !instanceName) {
      return { success: false, error: 'Missing agent or WhatsApp account' }
    }

    // 2. Prüfe auf existierende aktive Conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenant_id', options.tenantId)
      .eq('contact_phone', options.phone)
      .eq('status', 'active')
      .single()

    if (existing) {
      return { success: true, conversationId: existing.id }
    }

    // 3. Erstelle neue Conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        tenant_id: options.tenantId,
        whatsapp_account_id: trigger.whatsapp_account_id,
        agent_id: trigger.agent_id,
        trigger_id: trigger.id,
        contact_phone: options.phone,
        contact_name: options.contactName,
        external_lead_id: options.externalLeadId,
        status: 'active',
        current_script_step: 1,
      })
      .select()
      .single()

    if (convError || !conversation) {
      return { success: false, error: 'Failed to create conversation' }
    }

    // 4. Generiere erste Nachricht
    const firstMessage = await generateFirstMessage(
      agent,
      options.contactName,
      options.triggerData
    )

    // 5. Warte konfigurierte Verzögerung
    if (trigger.first_message_delay_seconds > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, trigger.first_message_delay_seconds * 1000)
      )
    }

    // 6. Sende erste Nachricht
    await saveAndSendMessage({
      conversationId: conversation.id,
      tenantId: options.tenantId,
      instanceName,
      phone: options.phone,
      content: firstMessage,
      senderType: 'agent',
      scriptStep: 1,
      contactName: options.contactName,
      agentName: agent.agent_name || agent.name,
    })

    // 7. Update CRM status to contacted
    updateCRMStatus({
      tenantId: options.tenantId,
      phone: options.phone,
      outcome: 'contacted',
      note: `Neue Conversation gestartet via Trigger`,
    }).catch(err => console.error('CRM status error:', err))

    // 8. Update Trigger Stats
    await supabase
      .from('triggers')
      .update({
        total_triggered: trigger.total_triggered + 1,
        total_conversations: trigger.total_conversations + 1,
      })
      .eq('id', trigger.id)

    return { success: true, conversationId: conversation.id }

  } catch (error) {
    console.error('Error starting conversation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Speichert und sendet eine Nachricht
 */
async function saveAndSendMessage(options: {
  conversationId: string
  tenantId: string
  instanceName: string
  phone: string
  content: string
  senderType: 'agent' | 'human'
  scriptStep?: number
  contactName?: string
  agentName?: string
}): Promise<void> {
  const supabase = getSupabase()

  // 1. Speichere in DB
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      tenant_id: options.tenantId,
      conversation_id: options.conversationId,
      direction: 'outbound',
      sender_type: options.senderType,
      content: options.content,
      script_step_used: options.scriptStep,
      status: 'pending',
    })
    .select()
    .single()

  if (msgError) {
    console.error('Failed to save message:', msgError)
    throw new Error('Failed to save message')
  }

  // 2. Sende via Evolution API
  const sendResult = await sendTextMessage(
    options.instanceName,
    options.phone,
    options.content
  )

  // 3. Update Message Status
  const whatsappMessageId = (sendResult.data as { key?: { id?: string } })?.key?.id
  await supabase
    .from('messages')
    .update({
      status: sendResult.success ? 'sent' : 'failed',
      whatsapp_message_id: whatsappMessageId,
      error_message: sendResult.error,
    })
    .eq('id', message.id)

  // 4. Update Conversation
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_agent_message_at: new Date().toISOString(),
    })
    .eq('id', options.conversationId)

  // 5. Update Daily Analytics (optional - ignore errors)
  try {
    const today = new Date().toISOString().split('T')[0]
    await supabase.rpc('increment_daily_messages_sent', {
      p_tenant_id: options.tenantId,
      p_date: today,
    })
  } catch {
    // Ignore if RPC doesn't exist yet
  }

  // 6. Log to CRM (async, don't block)
  logMessageToCRM({
    tenantId: options.tenantId,
    phone: options.phone,
    contactName: options.contactName,
    message: options.content,
    direction: 'outbound',
    agentName: options.agentName,
  }).catch(err => console.error('CRM log error:', err))
}

/**
 * Verarbeitet eine aus der Queue kommende Nachricht
 * (Wird vom Queue Processor aufgerufen)
 */
export async function processQueuedMessage(queueId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = getSupabase()

  try {
    // Get queue entry
    const { data: queueEntry, error: fetchError } = await supabase
      .from('message_queue')
      .select('*, conversations(*, agents(*), whatsapp_accounts(instance_name))')
      .eq('id', queueId)
      .single()

    if (fetchError || !queueEntry) {
      return { success: false, error: 'Queue entry not found' }
    }

    if (queueEntry.status !== 'pending') {
      return { success: false, error: 'Queue entry already processed' }
    }

    const conversation = queueEntry.conversations
    if (!conversation) {
      await supabase
        .from('message_queue')
        .update({ status: 'dismissed' })
        .eq('id', queueId)
      return { success: false, error: 'Conversation not found' }
    }

    const agent = conversation.agents
    const instanceName = conversation.whatsapp_accounts?.instance_name

    if (!agent || !instanceName) {
      return { success: false, error: 'Missing agent or WhatsApp account' }
    }

    // Get message history
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Process with AI agent
    const result = await processIncomingMessage(
      queueEntry.original_message,
      conversation,
      agent,
      messageHistory || [],
      { tenantId: queueEntry.tenant_id, useTools: true }
    )

    // Handle response
    if (result.shouldEscalate) {
      // Convert to escalation queue entry
      await supabase
        .from('message_queue')
        .update({
          queue_type: 'escalated',
          reason: result.escalationReason,
          suggested_response: result.response,
          status: 'pending',
          priority: 1,
        })
        .eq('id', queueId)

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalation_reason: result.escalationReason,
        })
        .eq('id', conversation.id)

      return { success: true }
    }

    // Send response
    await saveAndSendMessage({
      conversationId: conversation.id,
      tenantId: queueEntry.tenant_id,
      instanceName,
      phone: conversation.contact_phone,
      content: result.response,
      senderType: 'agent',
      scriptStep: conversation.current_script_step,
      contactName: conversation.contact_name || undefined,
      agentName: agent.agent_name || agent.name,
    })

    // Mark queue entry as resolved
    await supabase
      .from('message_queue')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_message: result.response,
      })
      .eq('id', queueId)

    return { success: true }

  } catch (error) {
    console.error('Error processing queued message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
