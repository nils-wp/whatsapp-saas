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
 * Tries multiple number formats
 */
async function fetchProfilePicture(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  phone: string,
  originalRemoteJid?: string
): Promise<string | null> {
  // Try multiple number formats
  const numbersToTry = [phone]

  // If we have the original LID JID, also try that
  if (originalRemoteJid && originalRemoteJid.includes('@lid')) {
    numbersToTry.push(originalRemoteJid.split('@')[0])
  }

  for (const number of numbersToTry) {
    try {
      const response = await fetch(
        `${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ number }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const url = data.profilePictureUrl || data.picture || data.url || data.profilePicUrl || null
        if (url) {
          console.log(`[Sync] Got profile picture for ${number}:`, url.substring(0, 60))
          return url
        }
      }
    } catch (error) {
      console.log(`[Sync] Profile picture fetch error for ${number}:`, error)
    }
  }

  return null
}

/**
 * Fetch contact info (name) from Evolution API
 * Tries multiple JID formats to find the contact
 */
async function fetchContactInfo(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  phone: string,
  originalRemoteJid?: string
): Promise<{ name: string | null; profilePicture: string | null }> {
  // Try multiple JID formats
  const jidsToTry = [
    `${phone}@s.whatsapp.net`,
    `${phone}@c.us`,
  ]

  // If we have the original LID JID, also try that
  if (originalRemoteJid && originalRemoteJid.includes('@lid')) {
    jidsToTry.unshift(originalRemoteJid) // Try LID first
  }

  for (const jid of jidsToTry) {
    try {
      const response = await fetch(
        `${evolutionUrl}/chat/findContacts/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            where: { id: jid }
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const contacts = Array.isArray(data) ? data : (data.contacts || [])
        const contact = contacts[0]

        if (contact) {
          const name = contact.pushName || contact.name || contact.notify || null
          const pic = contact.profilePictureUrl || contact.imgUrl || contact.profilePicUrl || null
          if (name || pic) {
            console.log(`[Sync] Contact info for ${jid}: name="${name}", hasPic=${!!pic}`)
            return { name, profilePicture: pic }
          }
        }
      }
    } catch (error) {
      console.log(`[Sync] Contact info fetch error for ${jid}:`, error)
    }
  }

  return { name: null, profilePicture: null }
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

    // Pre-analyze chats
    let preGroups = 0, preIndividual = 0, preLid = 0, preOther = 0
    for (const c of chats) {
      const rid = c.remoteJid || c.id || c.jid || ''
      if (rid.includes('@g.us')) preGroups++
      else if (rid.includes('@lid')) preLid++
      else if (rid.includes('@s.whatsapp.net') || rid.includes('@c.us')) preIndividual++
      else preOther++
    }
    console.log(`Pre-analysis: ${preGroups} groups, ${preIndividual} individual, ${preLid} LID, ${preOther} other`)

    // Build LID -> Phone mapping by fetching all contacts first
    const lidToPhoneMap = new Map<string, string>()
    if (preLid > 0) {
      console.log('[Sync] Fetching all contacts to build LID->Phone mapping...')
      try {
        const allContactsResponse = await fetch(
          `${evolutionUrl}/chat/findContacts/${account.instance_name}`,
          {
            method: 'POST',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // Empty query = all contacts
          }
        )
        if (allContactsResponse.ok) {
          const allContactsData = await allContactsResponse.json()
          const allContacts = Array.isArray(allContactsData) ? allContactsData : (allContactsData.contacts || [])
          console.log(`[Sync] Found ${allContacts.length} total contacts`)

          // Log first few contacts for debugging
          for (let i = 0; i < Math.min(3, allContacts.length); i++) {
            console.log(`[Sync] Contact ${i}:`, JSON.stringify(allContacts[i], null, 2))
          }

          // Build mapping from any ID format to phone
          for (const contact of allContacts) {
            const id = contact.id || contact.remoteJid || ''
            const phone = id.includes('@s.whatsapp.net')
              ? id.replace('@s.whatsapp.net', '').replace(/\D/g, '')
              : (contact.number || contact.phone || '').replace(/\D/g, '')

            if (phone && phone.length >= 8 && phone.length <= 15) {
              // Store under multiple possible keys
              if (contact.lid) lidToPhoneMap.set(contact.lid, phone)
              if (contact.lidJid) lidToPhoneMap.set(contact.lidJid, phone)
              // Also check if there's a lid field anywhere
              const lidMatch = JSON.stringify(contact).match(/"lid[^"]*":\s*"([^"]+@lid)"/i)
              if (lidMatch) lidToPhoneMap.set(lidMatch[1], phone)
            }
          }
          console.log(`[Sync] Built LID->Phone mapping with ${lidToPhoneMap.size} entries`)
          if (lidToPhoneMap.size > 0) {
            console.log('[Sync] Sample mappings:', Array.from(lidToPhoneMap.entries()).slice(0, 3))
          }
        }
      } catch (err) {
        console.error('[Sync] Failed to fetch contacts for LID mapping:', err)
      }
    }

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
    const skippedReasons: string[] = []

    for (const chat of chats) {
      // Log full chat object for first few to debug
      if (synced + skipped < 5) {
        console.log('Full chat object:', JSON.stringify(chat, null, 2))
      }

      // Try multiple fields to find phone/remoteJid
      const remoteJid = chat.remoteJid || chat.id || chat.jid || chat.owner || ''
      let phone = ''
      const contactName = chat.name || chat.pushName || chat.contact?.name || null

      // Skip groups and broadcasts first
      if (remoteJid.includes('@g.us')) {
        skippedReasons.push(`Group: ${remoteJid}`)
        skipped++
        continue
      }
      if (remoteJid.includes('@broadcast') || remoteJid.includes('status@')) {
        skippedReasons.push(`Broadcast/Status: ${remoteJid}`)
        skipped++
        continue
      }

      // Try to extract phone from multiple sources (including for @lid chats)
      // 1. Check direct phone fields first
      phone = chat.phone || chat.number || chat.contact?.phone || chat.participant || ''

      // 2. If @lid format and no phone yet, check for phone in nested structures
      if (remoteJid.includes('@lid') && !phone) {
        // Some Evolution versions store phone in different places for LID chats
        phone = chat.contact?.number ||
                chat.contact?.id?.replace?.('@s.whatsapp.net', '') ||
                chat.lid?.phone ||
                chat.phoneNumber ||
                ''
        if (phone) {
          console.log(`[Sync] Found phone for LID chat: ${phone}`)
        }
      }

      // 3. If still no phone, try extracting from remoteJid
      if (!phone && remoteJid.includes('@')) {
        phone = remoteJid.split('@')[0]
      }

      // 4. If still no phone, use remoteJid directly
      if (!phone) {
        phone = remoteJid
      }

      // Clean phone number - remove non-digits
      phone = phone.replace(/\D/g, '')

      // Skip if completely empty
      if (!phone) {
        skippedReasons.push(`Empty phone: ${remoteJid}`)
        skipped++
        continue
      }

      // Skip obvious invalid entries like "0"
      if (phone === '0') {
        skippedReasons.push(`Invalid phone "0": ${remoteJid}`)
        skipped++
        continue
      }

      // Fetch contact info (name + picture) from Evolution API
      let finalContactName = contactName
      let profilePictureUrl: string | null = null
      const isLidContact = remoteJid.includes('@lid')

      // If no name from chat object, try to fetch from contacts API
      if (!finalContactName) {
        const contactInfo = await fetchContactInfo(
          evolutionUrl,
          evolutionKey,
          account.instance_name,
          phone,
          isLidContact ? remoteJid : undefined
        )
        finalContactName = contactInfo.name
        profilePictureUrl = contactInfo.profilePicture
      }

      // If still no profile picture, try dedicated endpoint
      if (!profilePictureUrl) {
        profilePictureUrl = await fetchProfilePicture(
          evolutionUrl,
          evolutionKey,
          account.instance_name,
          phone,
          isLidContact ? remoteJid : undefined
        )
      }

      console.log('Processing:', phone, finalContactName, '| pic:', !!profilePictureUrl)

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id, profile_picture_url, contact_name')
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
            contact_name: finalContactName,
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
      } else if (existingConv && (profilePictureUrl || finalContactName)) {
        // Update existing conversation with profile picture or name if missing
        const updates: Record<string, string> = {}
        if (profilePictureUrl && !existingConv.profile_picture_url) {
          updates.profile_picture_url = profilePictureUrl
        }
        if (finalContactName && !existingConv.contact_name) {
          updates.contact_name = finalContactName
        }
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('conversations')
            .update(updates)
            .eq('id', existingConv.id)
        }
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

          // Try to extract pushName from incoming messages if we don't have a name yet
          let extractedPushName: string | null = null
          if (!finalContactName) {
            for (const msg of messages) {
              const isFromMe = msg.key?.fromMe || false
              if (!isFromMe && msg.pushName) {
                extractedPushName = msg.pushName
                console.log('Found pushName in message:', extractedPushName)
                break
              }
            }

            // Update conversation with extracted name
            if (extractedPushName && conversationId) {
              await supabase
                .from('conversations')
                .update({ contact_name: extractedPushName })
                .eq('id', conversationId)
              finalContactName = extractedPushName
            }
          }

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
      skippedReasons: skippedReasons.slice(0, 10), // Show first 10 reasons
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
