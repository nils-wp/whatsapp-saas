import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendTextStatus,
  sendImageStatus,
  sendVideoStatus,
  sendAudioStatus,
} from '@/lib/evolution/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface StatusRequest {
  accountId: string
  type: 'text' | 'image' | 'video' | 'audio'
  content: string
  caption?: string
  backgroundColor?: string
  font?: number
}

// POST /api/whatsapp/status - Post a status/story
export async function POST(request: Request) {
  try {
    const body = await request.json() as StatusRequest
    const { accountId, type, content } = body

    if (!accountId || !type || !content) {
      return NextResponse.json(
        { error: 'accountId, type, and content are required' },
        { status: 400 }
      )
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

    switch (type) {
      case 'text':
        result = await sendTextStatus(instanceName, content, body.backgroundColor, body.font)
        break

      case 'image':
        result = await sendImageStatus(instanceName, content, body.caption)
        break

      case 'video':
        result = await sendVideoStatus(instanceName, content, body.caption)
        break

      case 'audio':
        result = await sendAudioStatus(instanceName, content)
        break

      default:
        return NextResponse.json({ error: 'Invalid status type' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Status post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
