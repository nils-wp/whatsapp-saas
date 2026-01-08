import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Fetch profile picture URL from Evolution API
 */
async function fetchProfilePicture(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  phone: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'apikey': evolutionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: phone }),
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.profilePictureUrl || null
    }
  } catch (error) {
    console.log('Failed to fetch profile picture for:', phone)
  }
  return null
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

    const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '') // Remove trailing slash
    const evolutionKey = process.env.EVOLUTION_API_KEY

    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 500 })
    }

    console.log(`[Sync] Fetching chats for instance: ${account.instance_name}`)
    console.log(`[Sync] Evolution URL: ${evolutionUrl}`)

    // Fetch all chats from Evolution API
    // Try POST first (some Evolution API versions require POST)
    let chatsResponse = await fetch(
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

    // If POST fails with 404/405, try GET
    if (!chatsResponse.ok && (chatsResponse.status === 404 || chatsResponse.status === 405)) {
      console.log('POST failed, trying GET...')
      chatsResponse = await fetch(
        `${evolutionUrl}/chat/findChats/${account.instance_name}`,
        {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          },
        }
      )
    }

    if (!chatsResponse.ok) {
      const errorText = await chatsResponse.text()
      console.error('Failed to fetch chats:', chatsResponse.status, errorText)
      return NextResponse.json({
        error: 'Failed to fetch chats from Evolution',
        details: errorText,
        status: chatsResponse.status
      }, { status: 500 })
    }

    const chatsData = await chatsResponse.json()
    console.log('Chats response:', JSON.stringify(chatsData).substring(0, 500))

    // Handle both array response and { chats: [...] } format
    const chats = Array.isArray(chatsData) ? chatsData : (chatsData.chats || chatsData || [])
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
      // Log full chat object for first few to debug
      if (synced + skipped < 5) {
        console.log('Full chat object:', JSON.stringify(chat, null, 2))
      }

      // Get the remoteJid - could be in different places depending on Evolution API version
      const remoteJid = chat.remoteJid || chat.id || chat.jid || chat.owner

      // Log what we found
      console.log('Processing chat:', remoteJid, chat.name || chat.pushName)

      // Skip if no valid remoteJid with @ symbol (WhatsApp format)
      if (!remoteJid || !remoteJid.includes('@')) {
        console.log('Skipping (not WhatsApp format):', remoteJid)
        skipped++
        continue
      }

      // Skip group chats and status broadcasts
      if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') || remoteJid.includes('status@')) {
        console.log('Skipping (group/broadcast):', remoteJid)
        skipped++
        continue
      }

      // Extract phone number - handle different formats (@c.us or @s.whatsapp.net)
      const phone = remoteJid.split('@')[0]
      if (!phone || phone.length < 5) {
        console.log('Skipping (invalid phone):', phone)
        skipped++
        continue
      }

      // Fetch profile picture for this contact
      const profilePictureUrl = await fetchProfilePicture(
        evolutionUrl,
        evolutionKey,
        account.instance_name,
        phone
      )

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id, profile_picture_url')
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
            profile_picture_url: profilePictureUrl,
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
      } else if (existingConv && profilePictureUrl && !existingConv.profile_picture_url) {
        // Update existing conversation with profile picture if missing
        await supabase
          .from('conversations')
          .update({
            profile_picture_url: profilePictureUrl,
            contact_name: chat.name || chat.pushName || undefined,
          })
          .eq('id', existingConv.id)
      }

      // Fetch messages for this chat using the remoteJid
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
                  remoteJid: remoteJid,
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
