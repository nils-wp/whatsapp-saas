import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getChats,
  getMessages,
  markAsRead,
  archiveChat,
  deleteMessage,
  getLabels,
  addLabelToChat,
  removeLabelFromChat,
} from '@/lib/evolution/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/whatsapp/chats?accountId=xxx - List chats or get messages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const phone = searchParams.get('phone')
    const type = searchParams.get('type') || 'chats'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('instance_name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const instanceName = account.instance_name
    let result

    if (type === 'labels') {
      result = await getLabels(instanceName)
    } else if (phone) {
      result = await getMessages(instanceName, phone, limit)
    } else {
      result = await getChats(instanceName)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Get chats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/whatsapp/chats - Chat actions
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accountId, action, phone, messageId, labelId, archive } = body

    if (!accountId || !action) {
      return NextResponse.json({ error: 'accountId and action required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('instance_name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const instanceName = account.instance_name
    let result

    switch (action) {
      case 'markAsRead':
        if (!phone) {
          return NextResponse.json({ error: 'phone required' }, { status: 400 })
        }
        result = await markAsRead(instanceName, phone)
        break

      case 'archive':
        if (!phone) {
          return NextResponse.json({ error: 'phone required' }, { status: 400 })
        }
        result = await archiveChat(instanceName, phone, archive !== false)
        break

      case 'deleteMessage':
        if (!phone || !messageId) {
          return NextResponse.json({ error: 'phone and messageId required' }, { status: 400 })
        }
        result = await deleteMessage(instanceName, phone, messageId, body.forEveryone)
        break

      case 'addLabel':
        if (!phone || !labelId) {
          return NextResponse.json({ error: 'phone and labelId required' }, { status: 400 })
        }
        result = await addLabelToChat(instanceName, phone, labelId)
        break

      case 'removeLabel':
        if (!phone || !labelId) {
          return NextResponse.json({ error: 'phone and labelId required' }, { status: 400 })
        }
        result = await removeLabelFromChat(instanceName, phone, labelId)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Chat action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
