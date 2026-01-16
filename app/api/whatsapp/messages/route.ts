import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendTextMessage,
  sendImageMessage,
  sendVideoMessage,
  sendAudioMessage,
  sendDocumentMessage,
  sendLocationMessage,
  sendContactMessage,
  sendReaction,
  sendTextWithQuote,
  sendTyping,
} from '@/lib/evolution/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SendMessageRequest {
  accountId: string
  phone: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'reaction'
  content: string
  // Optional fields based on type
  caption?: string
  fileName?: string
  latitude?: number
  longitude?: number
  locationName?: string
  address?: string
  contacts?: Array<{ fullName: string; phoneNumber: string; organization?: string }>
  messageId?: string // for reactions
  quotedMessageId?: string // for replies
  showTyping?: boolean
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SendMessageRequest
    const { accountId, phone, type, content } = body

    if (!accountId || !phone || !type) {
      return NextResponse.json(
        { error: 'accountId, phone, and type are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Get WhatsApp account
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('instance_name, tenant_id')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const { instance_name: instanceName } = account

    // Show typing indicator if requested
    if (body.showTyping) {
      await sendTyping(instanceName, phone, 2000)
    }

    let result

    switch (type) {
      case 'text':
        if (body.quotedMessageId) {
          result = await sendTextWithQuote(instanceName, phone, content, body.quotedMessageId)
        } else {
          result = await sendTextMessage(instanceName, phone, content)
        }
        break

      case 'image':
        result = await sendImageMessage(instanceName, phone, content, body.caption)
        break

      case 'video':
        result = await sendVideoMessage(instanceName, phone, content, body.caption)
        break

      case 'audio':
        result = await sendAudioMessage(instanceName, phone, content)
        break

      case 'document':
        if (!body.fileName) {
          return NextResponse.json({ error: 'fileName required for documents' }, { status: 400 })
        }
        result = await sendDocumentMessage(instanceName, phone, content, body.fileName, body.caption)
        break

      case 'location':
        if (body.latitude === undefined || body.longitude === undefined) {
          return NextResponse.json({ error: 'latitude and longitude required' }, { status: 400 })
        }
        result = await sendLocationMessage(
          instanceName,
          phone,
          body.latitude,
          body.longitude,
          body.locationName,
          body.address
        )
        break

      case 'contact':
        if (!body.contacts || body.contacts.length === 0) {
          return NextResponse.json({ error: 'contacts array required' }, { status: 400 })
        }
        result = await sendContactMessage(instanceName, phone, body.contacts)
        break

      case 'reaction':
        if (!body.messageId) {
          return NextResponse.json({ error: 'messageId required for reactions' }, { status: 400 })
        }
        result = await sendReaction(instanceName, body.messageId, phone, content)
        break

      default:
        return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
