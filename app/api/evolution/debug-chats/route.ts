import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Debug endpoint to see raw chat data from Evolution API
 */
export async function POST(request: Request) {
  try {
    const { accountId } = await request.json()

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

    // Try POST first
    let response = await fetch(
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

    // Fallback to GET
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await fetch(
        `${evolutionUrl}/chat/findChats/${account.instance_name}`,
        {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          },
        }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'Evolution API error',
        status: response.status,
        details: errorText
      }, { status: 500 })
    }

    const data = await response.json()

    // Return first 5 chats for debugging
    const chats = Array.isArray(data) ? data : (data.chats || data || [])
    const sample = chats.slice(0, 10)

    // Analyze chat types
    let groups = 0
    let broadcasts = 0
    let individual = 0
    let unknown = 0
    const examples: { type: string; remoteJid: string; keys: string[] }[] = []

    for (const chat of chats) {
      const remoteJid = chat.remoteJid || chat.id || chat.jid || ''

      if (remoteJid.includes('@g.us')) {
        groups++
        if (examples.filter(e => e.type === 'group').length < 2) {
          examples.push({ type: 'group', remoteJid, keys: Object.keys(chat) })
        }
      } else if (remoteJid.includes('@broadcast') || remoteJid.includes('status@')) {
        broadcasts++
        if (examples.filter(e => e.type === 'broadcast').length < 2) {
          examples.push({ type: 'broadcast', remoteJid, keys: Object.keys(chat) })
        }
      } else if (remoteJid.includes('@s.whatsapp.net') || remoteJid.includes('@c.us')) {
        individual++
        if (examples.filter(e => e.type === 'individual').length < 2) {
          examples.push({ type: 'individual', remoteJid, keys: Object.keys(chat) })
        }
      } else {
        unknown++
        if (examples.filter(e => e.type === 'unknown').length < 3) {
          examples.push({ type: 'unknown', remoteJid, keys: Object.keys(chat) })
        }
      }
    }

    return NextResponse.json({
      total: chats.length,
      breakdown: { groups, broadcasts, individual, unknown },
      examples,
      sample,
      firstChatKeys: chats[0] ? Object.keys(chats[0]) : [],
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
