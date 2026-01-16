import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Debug endpoint to see contact data from Evolution API
 */
export async function POST(request: Request) {
  try {
    const { accountId, phone } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('id, tenant_id, instance_name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '')
    const evolutionKey = process.env.EVOLUTION_API_KEY

    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 500 })
    }

    const results: Record<string, unknown> = {}

    // 1. Try findContacts endpoint
    try {
      const contactsRes = await fetch(
        `${evolutionUrl}/chat/findContacts/${account.instance_name}`,
        {
          method: 'POST',
          headers: {
            'apikey': evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(phone ? { where: { id: `${phone}@s.whatsapp.net` } } : {}),
        }
      )
      results.findContacts = {
        status: contactsRes.status,
        data: contactsRes.ok ? await contactsRes.json() : await contactsRes.text()
      }
    } catch (e) {
      results.findContacts = { error: e instanceof Error ? e.message : 'Unknown error' }
    }

    // 2. Try fetchProfilePictureUrl endpoint
    if (phone) {
      try {
        const picRes = await fetch(
          `${evolutionUrl}/chat/fetchProfilePictureUrl/${account.instance_name}`,
          {
            method: 'POST',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number: phone }),
          }
        )
        results.profilePicture = {
          status: picRes.status,
          data: picRes.ok ? await picRes.json() : await picRes.text()
        }
      } catch (e) {
        results.profilePicture = { error: e instanceof Error ? e.message : 'Unknown error' }
      }
    }

    // 3. Try getProfile endpoint (alternative)
    if (phone) {
      try {
        const profileRes = await fetch(
          `${evolutionUrl}/chat/getProfile/${account.instance_name}`,
          {
            method: 'POST',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number: phone }),
          }
        )
        results.getProfile = {
          status: profileRes.status,
          data: profileRes.ok ? await profileRes.json() : await profileRes.text()
        }
      } catch (e) {
        results.getProfile = { error: e instanceof Error ? e.message : 'Unknown error' }
      }
    }

    // 4. Check one chat to see what fields are available
    try {
      const chatsRes = await fetch(
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
      if (chatsRes.ok) {
        const data = await chatsRes.json()
        const chats = Array.isArray(data) ? data : (data.chats || [])
        // Find first individual chat
        const individualChat = chats.find((c: { remoteJid?: string; id?: string }) => {
          const rid = c.remoteJid || c.id || ''
          return rid.includes('@s.whatsapp.net')
        })
        results.sampleIndividualChat = individualChat || 'No individual chat found'
      }
    } catch (e) {
      results.sampleChat = { error: e instanceof Error ? e.message : 'Unknown error' }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
