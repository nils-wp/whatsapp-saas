import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Evolution API sends webhooks here when messages are received
export async function POST(request: Request) {
  try {
    const payload = await request.json()

    console.log('Evolution webhook received:', JSON.stringify(payload, null, 2))

    // Evolution API sends different event types
    const event = payload.event
    const data = payload.data

    if (event === 'messages.upsert') {
      // New message received
      const message = data.message
      const instanceName = payload.instance

      // Only process incoming messages (not our own)
      if (message.key?.fromMe) {
        return NextResponse.json({ success: true, ignored: true })
      }

      const supabase = getSupabase()
      const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '')
      const content = message.message?.conversation ||
                      message.message?.extendedTextMessage?.text ||
                      '[Media]'

      // Find the WhatsApp account
      const { data: account } = await supabase
        .from('whatsapp_accounts')
        .select('id, tenant_id')
        .eq('instance_name', instanceName)
        .single()

      if (!account) {
        console.log('Account not found for instance:', instanceName)
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }

      // Find or create conversation
      let { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('tenant_id', account.tenant_id)
        .eq('contact_phone', phone)
        .eq('status', 'active')
        .single()

      if (!conversation) {
        // Check for paused/escalated conversations
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('*')
          .eq('tenant_id', account.tenant_id)
          .eq('contact_phone', phone)
          .in('status', ['paused', 'escalated'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existingConv) {
          conversation = existingConv
          // Reactivate the conversation
          await supabase
            .from('conversations')
            .update({ status: 'active' })
            .eq('id', existingConv.id)
        }
      }

      if (!conversation) {
        console.log('No active conversation for phone:', phone)
        // Could create a new conversation here if needed
        return NextResponse.json({ success: true, no_conversation: true })
      }

      // Save the message
      await supabase.from('messages').insert({
        tenant_id: account.tenant_id,
        conversation_id: conversation.id,
        whatsapp_message_id: message.key?.id,
        direction: 'inbound',
        sender_type: 'contact',
        content,
        status: 'delivered',
      })

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_contact_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)

      // TODO: Here you would trigger the AI agent to respond
      // This could be done via:
      // 1. n8n webhook
      // 2. Direct OpenAI call
      // 3. Background job

      return NextResponse.json({
        success: true,
        conversation_id: conversation.id,
        message_saved: true
      })
    }

    if (event === 'connection.update') {
      // Connection status changed
      const state = data.state
      const instanceName = payload.instance

      const supabase = getSupabase()

      await supabase
        .from('whatsapp_accounts')
        .update({
          status: state === 'open' ? 'connected' : 'disconnected'
        })
        .eq('instance_name', instanceName)

      return NextResponse.json({ success: true, status_updated: true })
    }

    if (event === 'qrcode.updated') {
      // QR code was updated
      const qrCode = data.qrcode?.base64
      const instanceName = payload.instance

      if (qrCode) {
        const supabase = getSupabase()

        await supabase
          .from('whatsapp_accounts')
          .update({
            qr_code: qrCode,
            qr_expires_at: new Date(Date.now() + 60000).toISOString(), // 1 min expiry
            status: 'connecting'
          })
          .eq('instance_name', instanceName)
      }

      return NextResponse.json({ success: true, qr_updated: true })
    }

    // Unknown event type
    return NextResponse.json({ success: true, event_type: event })

  } catch (error) {
    console.error('Evolution webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Evolution webhook endpoint active'
  })
}
