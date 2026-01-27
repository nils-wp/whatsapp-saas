/**
 * Message Handler - Orchestriert die gesamte Nachrichtenverarbeitung
 * Mit Queue-System für Outside Hours und Escalations (n8n-style)
 */

import { createClient } from '@supabase/supabase-js'
import { processIncomingMessage, generateFirstMessage, generateSuggestedResponse } from './agent-processor'
import { checkWorkingHours, getNextBusinessDay8AM } from './working-hours'
import { sendTextMessage, getProfilePicture } from '@/lib/evolution/client'
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
  action?: 'replied' | 'escalated' | 'queued_outside_hours' | 'disqualified' | 'error'
  outcome?: 'contacted' | 'qualified' | 'booked' | 'not_interested' | 'escalated'
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

    // If no agent is assigned, queue the message for manual handling
    if (!agent) {
      console.log('No agent assigned - queuing for manual response')
      const { data: queueEntry, error: queueError } = await supabase
        .from('message_queue')
        .insert({
          tenant_id: tenantId,
          conversation_id: conversationId,
          queue_type: 'escalated',
          original_message: incomingMessage,
          reason: 'Kein Agent zugewiesen - manuelle Bearbeitung erforderlich',
          status: 'pending',
          priority: 1,
        })
        .select()
        .single()

      if (queueError) {
        console.error('Failed to queue message:', queueError)
      }

      // Update conversation status to escalated
      await supabase
        .from('conversations')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalation_reason: 'Kein Agent zugewiesen',
        })
        .eq('id', conversationId)

      return {
        success: true,
        action: 'escalated',
        queueId: queueEntry?.id,
      }
    }

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

      // No automatic response - human will respond directly from the escalation queue
      return {
        success: true,
        action: 'escalated',
        queueId: queueEntry?.id,
      }
    }

    // 5b. Handle Outcome Detection (disqualification, etc.)
    if (result.outcome && result.outcome !== 'escalated') {
      // Update conversation with outcome
      await supabase
        .from('conversations')
        .update({
          outcome: result.outcome,
          status: result.outcome === 'not_interested' ? 'completed' : 'active',
          completed_at: result.outcome === 'not_interested' ? new Date().toISOString() : null,
        })
        .eq('id', conversationId)

      // Update CRM status based on outcome
      updateCRMStatus({
        tenantId,
        phone: conversation.contact_phone,
        outcome: result.outcome,
        note: result.metadata?.disqualificationReason as string || `Outcome: ${result.outcome}`,
      }).catch(err => console.error('CRM outcome sync error:', err))

      console.log(`Outcome detected: ${result.outcome} - CRM sync triggered`)
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

    // Agent is optional - triggers can work without an agent (just sends first message)
    const agent = trigger.agents
    const instanceName = trigger.whatsapp_accounts?.instance_name

    if (!instanceName) {
      return { success: false, error: 'Missing WhatsApp account' }
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
    // Extract first_name and last_name from trigger_data if provided by CRM
    const triggerData = options.triggerData || {}
    const crmFirstName = triggerData.first_name as string | undefined
    const crmLastName = triggerData.last_name as string | undefined
    const crmContactId = triggerData.crm_record_id as string | undefined

    // Store trigger_data for CRM variable access later
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        tenant_id: options.tenantId,
        whatsapp_account_id: trigger.whatsapp_account_id,
        agent_id: trigger.agent_id,
        trigger_id: trigger.id,
        contact_phone: options.phone,
        contact_name: options.contactName,
        contact_first_name: crmFirstName || null,
        contact_last_name: crmLastName || null,
        crm_contact_id: crmContactId || null,
        external_lead_id: options.externalLeadId,
        trigger_data: triggerData,
        status: 'active',
        current_script_step: 1,
      })
      .select()
      .single()

    if (convError || !conversation) {
      return { success: false, error: 'Failed to create conversation' }
    }

    // 3.5 Fetch profile picture asynchronously (non-blocking)
    fetchAndUpdateProfilePicture(supabase, conversation.id, instanceName, options.phone)
      .catch(err => console.error('Profile picture fetch error:', err))

    // 4. Generiere erste Nachricht
    // If agent exists, use generateFirstMessage (with script steps)
    // Otherwise, use the trigger's first_message directly with variable substitution
    let firstMessage: string
    if (agent) {
      firstMessage = await generateFirstMessage(
        agent,
        options.contactName,
        options.triggerData
      )
    } else {
      // Use trigger's first_message with basic variable substitution
      const { substituteVariables, splitName } = await import('./agent-processor')
      const { firstName, lastName } = splitName(options.contactName)
      const variables = {
        name: options.contactName,
        contact_name: options.contactName,
        first_name: firstName,
        last_name: lastName,
        vorname: firstName,
        nachname: lastName,
        ...(options.triggerData ? Object.fromEntries(
          Object.entries(options.triggerData)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ) : {}),
      }
      firstMessage = substituteVariables(trigger.first_message, variables)
    }

    // 5. Warte konfigurierte Verzögerung (für die allererste Nachricht)
    if (trigger.first_message_delay_seconds > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, trigger.first_message_delay_seconds * 1000)
      )
    }

    // 6. Sende Nachrichten-Sequenz (Outreach - counts toward warm-up limit)
    // Split by "---" on its own line (allowing for multiple dashes)
    const messageParts = firstMessage.split(/\n\s*---+\s*\n/).filter(p => p.trim() !== '')

    for (let i = 0; i < messageParts.length; i++) {
      const partContent = messageParts[i].trim()
      if (!partContent) continue

      // Delay between bubbles in a sequence (except for the very first message which already had its delay)
      if (i > 0) {
        // Small "typing" delay for a natural feel
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      await saveAndSendMessage({
        conversationId: conversation.id,
        tenantId: options.tenantId,
        instanceName,
        phone: options.phone,
        content: partContent,
        senderType: agent ? 'agent' : 'human',
        scriptStep: 1,
        contactName: options.contactName,
        agentName: agent?.agent_name || agent?.name || 'System',
        isOutreach: true, // Counts toward daily limit
      })
    }

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
 * Fetch and update profile picture for a conversation
 * Non-blocking - runs in background
 */
async function fetchAndUpdateProfilePicture(
  supabase: ReturnType<typeof getSupabase>,
  conversationId: string,
  instanceName: string,
  phone: string
): Promise<void> {
  try {
    const result = await getProfilePicture(instanceName, phone)

    if (result.success && result.data) {
      const profileUrl = (result.data as { profilePictureUrl?: string; picture?: string; url?: string })
        .profilePictureUrl ||
        (result.data as { picture?: string }).picture ||
        (result.data as { url?: string }).url

      if (profileUrl) {
        await supabase
          .from('conversations')
          .update({ profile_picture_url: profileUrl })
          .eq('id', conversationId)

        console.log(`[Profile] Updated profile picture for conversation ${conversationId}`)
      }
    }
  } catch (error) {
    console.error(`[Profile] Failed to fetch profile picture for ${phone}:`, error)
  }
}

/**
 * Speichert und sendet eine Nachricht
 * @param isOutreach - If true, applies warm-up limits (only for first messages/outreach)
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
  isOutreach?: boolean
}): Promise<void> {
  const supabase = getSupabase()

  // For outreach messages, check and update warm-up limits
  if (options.isOutreach) {
    const { data: account } = await supabase
      .from('whatsapp_accounts')
      .select('daily_limit, messages_sent_today')
      .eq('instance_name', options.instanceName)
      .single()

    if (account) {
      // Check if daily limit is reached
      if (account.messages_sent_today >= account.daily_limit) {
        console.warn(`Daily limit reached for ${options.instanceName}: ${account.messages_sent_today}/${account.daily_limit}`)
        throw new Error('Daily message limit reached')
      }

      // Increment the counter for outreach messages
      await supabase
        .from('whatsapp_accounts')
        .update({
          messages_sent_today: account.messages_sent_today + 1,
          last_message_at: new Date().toISOString(),
        })
        .eq('instance_name', options.instanceName)
    }
  }

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
