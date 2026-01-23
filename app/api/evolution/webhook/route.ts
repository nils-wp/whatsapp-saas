import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleIncomingMessage } from '@/lib/ai/message-handler'
import { getProfilePicture } from '@/lib/evolution/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Evolution API Webhook - Empfängt alle WhatsApp Events
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json()

    console.log('Evolution webhook received:', JSON.stringify(payload, null, 2))

    const event = payload.event
    const data = payload.data
    const instanceName = payload.instance

    // ============================================
    // NEUE NACHRICHT EMPFANGEN
    // ============================================
    if (event === 'messages.upsert') {
      const message = data.message

      // Ignoriere eigene Nachrichten
      if (message.key?.fromMe) {
        return NextResponse.json({ success: true, ignored: 'own_message' })
      }

      const supabase = getSupabase()
      const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '')
      const pushName = message.pushName || data.pushName || null
      const content = message.message?.conversation ||
                      message.message?.extendedTextMessage?.text ||
                      message.message?.imageMessage?.caption ||
                      '[Media]'

      // Finde WhatsApp Account
      const { data: account } = await supabase
        .from('whatsapp_accounts')
        .select('id, tenant_id')
        .eq('instance_name', instanceName)
        .single()

      if (!account) {
        console.log('Account not found for instance:', instanceName)
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }

      // Finde aktive Conversation
      let { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('tenant_id', account.tenant_id)
        .eq('contact_phone', phone)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Prüfe auch eskalierte Conversations
      if (!conversation) {
        const { data: escalatedConv } = await supabase
          .from('conversations')
          .select('*')
          .eq('tenant_id', account.tenant_id)
          .eq('contact_phone', phone)
          .eq('status', 'escalated')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (escalatedConv) {
          // Update contact name and push_name if missing
          if (pushName && (!escalatedConv.contact_name || !escalatedConv.contact_push_name)) {
            const updates: Record<string, string> = {}
            if (!escalatedConv.contact_name) updates.contact_name = pushName
            if (!escalatedConv.contact_push_name) updates.contact_push_name = pushName
            await supabase
              .from('conversations')
              .update(updates)
              .eq('id', escalatedConv.id)
          }

          // Bei eskalierten Conversations nur speichern, nicht antworten
          await saveIncomingMessage(supabase, {
            tenantId: account.tenant_id,
            conversationId: escalatedConv.id,
            content,
            whatsappMessageId: message.key?.id,
          })

          return NextResponse.json({
            success: true,
            action: 'saved_to_escalated',
            conversation_id: escalatedConv.id,
          })
        }
      }

      // Keine aktive Conversation? Erstelle eine neue!
      if (!conversation) {
        console.log('Creating new conversation for phone:', phone)

        // Finde einen aktiven Agent für diesen WhatsApp-Account
        // 1. Erst Agent suchen, der spezifisch für diese Nummer ist
        let { data: defaultAgent } = await supabase
          .from('agents')
          .select('id')
          .eq('tenant_id', account.tenant_id)
          .eq('whatsapp_account_id', account.id)
          .eq('is_active', true)
          .limit(1)
          .single()

        // 2. Falls keiner gefunden, Agent ohne spezifische Nummer suchen
        if (!defaultAgent) {
          const { data: fallbackAgent } = await supabase
            .from('agents')
            .select('id')
            .eq('tenant_id', account.tenant_id)
            .is('whatsapp_account_id', null)
            .eq('is_active', true)
            .limit(1)
            .single()
          defaultAgent = fallbackAgent
        }

        // Erstelle neue Conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            tenant_id: account.tenant_id,
            whatsapp_account_id: account.id,
            agent_id: defaultAgent?.id || null,
            contact_phone: phone,
            contact_name: pushName,
            contact_push_name: pushName,
            status: 'active',
            current_script_step: 1,
          })
          .select()
          .single()

        if (convError || !newConversation) {
          console.error('Failed to create conversation:', convError)
          return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
        }

        conversation = newConversation
        console.log('Created new conversation:', conversation.id)

        // Fetch profile picture asynchronously (don't wait)
        fetchAndSaveProfilePicture(supabase, conversation.id, instanceName, phone)
      }

      // Reaktiviere pausierte Conversations und aktualisiere Namen/Profilbild wenn nötig
      const needsUpdate = conversation.status === 'paused' ||
                          (pushName && !conversation.contact_name) ||
                          (pushName && !conversation.contact_push_name) ||
                          !conversation.profile_picture_url

      if (needsUpdate) {
        const updates: Record<string, unknown> = {}
        if (conversation.status === 'paused') {
          updates.status = 'active'
        }
        if (pushName && !conversation.contact_name) {
          updates.contact_name = pushName
          console.log('Updating contact name to:', pushName)
        }
        if (pushName && !conversation.contact_push_name) {
          updates.contact_push_name = pushName
          console.log('Updating contact_push_name to:', pushName)
        }
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('conversations')
            .update(updates)
            .eq('id', conversation.id)
        }

        // Fetch profile picture if missing
        if (!conversation.profile_picture_url) {
          fetchAndSaveProfilePicture(supabase, conversation.id, instanceName, phone)
        }
      }

      // Speichere eingehende Nachricht
      await saveIncomingMessage(supabase, {
        tenantId: account.tenant_id,
        conversationId: conversation.id,
        content,
        whatsappMessageId: message.key?.id,
      })

      // Verarbeite mit AI und antworte
      const result = await handleIncomingMessage({
        conversationId: conversation.id,
        incomingMessage: content,
        tenantId: account.tenant_id,
      })

      return NextResponse.json({
        success: result.success,
        action: result.action,
        conversation_id: conversation.id,
      })
    }

    // ============================================
    // CONNECTION STATUS GEÄNDERT
    // ============================================
    if (event === 'connection.update') {
      const state = data.state
      const supabase = getSupabase()

      const status = state === 'open' ? 'connected' : 'disconnected'

      await supabase
        .from('whatsapp_accounts')
        .update({ status })
        .eq('instance_name', instanceName)

      console.log(`Instance ${instanceName} status updated to: ${status}`)

      return NextResponse.json({ success: true, status_updated: true })
    }

    // ============================================
    // QR CODE AKTUALISIERT
    // ============================================
    if (event === 'qrcode.updated') {
      const qrCode = data.qrcode?.base64
      const supabase = getSupabase()

      if (qrCode) {
        await supabase
          .from('whatsapp_accounts')
          .update({
            qr_code: qrCode,
            qr_expires_at: new Date(Date.now() + 60000).toISOString(),
            status: 'connecting',
          })
          .eq('instance_name', instanceName)
      }

      return NextResponse.json({ success: true, qr_updated: true })
    }

    // ============================================
    // NACHRICHT STATUS (delivered, read)
    // ============================================
    if (event === 'messages.update') {
      const messageId = data.key?.id
      const status = data.update?.status

      if (messageId && status) {
        const supabase = getSupabase()

        const statusMap: Record<number, string> = {
          2: 'sent',
          3: 'delivered',
          4: 'read',
        }

        const newStatus = statusMap[status]
        if (newStatus) {
          await supabase
            .from('messages')
            .update({ status: newStatus })
            .eq('whatsapp_message_id', messageId)
        }
      }

      return NextResponse.json({ success: true, status_updated: true })
    }

    // Unbekannter Event-Typ
    return NextResponse.json({ success: true, event_type: event })

  } catch (error) {
    console.error('Evolution webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Speichert eine eingehende Nachricht
 */
async function saveIncomingMessage(
  supabase: ReturnType<typeof getSupabase>,
  options: {
    tenantId: string
    conversationId: string
    content: string
    whatsappMessageId?: string
  }
) {
  await supabase.from('messages').insert({
    tenant_id: options.tenantId,
    conversation_id: options.conversationId,
    whatsapp_message_id: options.whatsappMessageId,
    direction: 'inbound',
    sender_type: 'contact',
    content: options.content,
    status: 'delivered',
  })

  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_contact_message_at: new Date().toISOString(),
    })
    .eq('id', options.conversationId)
}

/**
 * Holt und speichert das Profilbild für eine Konversation
 */
async function fetchAndSaveProfilePicture(
  supabase: ReturnType<typeof getSupabase>,
  conversationId: string,
  instanceName: string,
  phone: string
) {
  try {
    const result = await getProfilePicture(instanceName, phone)

    if (result.success && result.data) {
      const pictureUrl = (result.data as { profilePictureUrl?: string })?.profilePictureUrl ||
                         (result.data as { url?: string })?.url ||
                         (result.data as { picture?: string })?.picture

      if (pictureUrl) {
        await supabase
          .from('conversations')
          .update({ profile_picture_url: pictureUrl })
          .eq('id', conversationId)

        console.log('Profile picture saved for conversation:', conversationId)
      }
    }
  } catch (error) {
    console.error('Failed to fetch profile picture:', error)
    // Non-critical error, don't throw
  }
}

/**
 * GET für Webhook-Verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Evolution webhook endpoint active',
    version: '2.0',
  })
}
