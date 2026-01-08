import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Sync all chats from Evolution API to the database
 */
export async function POST(request: Request) {
  try {
    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get WhatsApp account details
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('id, tenant_id, instance_name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL
    const evolutionKey = process.env.EVOLUTION_API_KEY

    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 500 })
    }

    // Fetch all chats from Evolution API
    const chatsResponse = await fetch(
      `${evolutionUrl}/chat/findChats/${account.instance_name}`,
      {
        method: 'POST',
        headers: {
          'apikey': evolutionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    if (!chatsResponse.ok) {
      const errorText = await chatsResponse.text()
      console.error('Failed to fetch chats:', errorText)
      return NextResponse.json({ error: 'Failed to fetch chats from Evolution' }, { status: 500 })
    }

    const chats = await chatsResponse.json()
    console.log(`Found ${chats.length} chats to sync`)

    // Get default agent for this tenant
    const { data: defaultAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('tenant_id', account.tenant_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    let synced = 0
    let skipped = 0

    for (const chat of chats) {
      // Log chat for debugging
      console.log('Processing chat:', chat.id, chat.name || chat.pushName)

      // Get the remoteJid - could be in different places
      const remoteJid = chat.id || chat.remoteJid || chat.jid

      // Skip group chats and status broadcasts
      if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') || remoteJid.includes('status@')) {
        console.log('Skipping (group/broadcast):', remoteJid)
        skipped++
        continue
      }

      // Extract phone number - handle different formats
      const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '')
      if (!phone || phone.length < 5) {
        console.log('Skipping (invalid phone):', phone)
        skipped++
        continue
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', account.tenant_id)
        .eq('contact_phone', phone)
        .limit(1)
        .single()

      let conversationId = existingConv?.id

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            tenant_id: account.tenant_id,
            whatsapp_account_id: account.id,
            agent_id: defaultAgent?.id || null,
            contact_phone: phone,
            contact_name: chat.name || chat.pushName || null,
            contact_push_name: chat.pushName || null,
            status: 'active',
            current_script_step: 1,
          })
          .select('id')
          .single()

        if (convError) {
          console.error('Failed to create conversation:', convError)
          skipped++
          continue
        }

        conversationId = newConv.id
      }

      // Fetch messages for this chat
      try {
        const messagesResponse = await fetch(
          `${evolutionUrl}/chat/findMessages/${account.instance_name}`,
          {
            method: 'POST',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              where: {
                key: {
                  remoteJid: chat.id,
                },
              },
              limit: 100, // Last 100 messages
            }),
          }
        )

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          const messages = messagesData.messages || messagesData || []

          for (const msg of messages) {
            const messageId = msg.key?.id
            const isFromMe = msg.key?.fromMe || false
            const content = msg.message?.conversation ||
                           msg.message?.extendedTextMessage?.text ||
                           msg.message?.imageMessage?.caption ||
                           '[Media]'

            if (!content || content === '[Media]') continue

            // Check if message already exists
            const { data: existingMsg } = await supabase
              .from('messages')
              .select('id')
              .eq('whatsapp_message_id', messageId)
              .limit(1)
              .single()

            if (existingMsg) continue

            // Insert message
            await supabase.from('messages').insert({
              tenant_id: account.tenant_id,
              conversation_id: conversationId,
              whatsapp_message_id: messageId,
              direction: isFromMe ? 'outbound' : 'inbound',
              sender_type: isFromMe ? 'agent' : 'contact',
              content: content,
              status: 'delivered',
              created_at: new Date(msg.messageTimestamp * 1000).toISOString(),
            })
          }
        }
      } catch (msgError) {
        console.error('Failed to fetch messages for chat:', chat.id, msgError)
      }

      synced++
    }

    // Update last sync time
    await supabase
      .from('whatsapp_accounts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', accountId)

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: chats.length,
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
