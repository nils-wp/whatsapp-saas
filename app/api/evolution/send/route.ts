import { NextResponse } from 'next/server'
import { sendTextMessage } from '@/lib/evolution/client'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const { instanceName, phone, message } = await request.json() as {
      instanceName: string
      phone: string
      message: string
    }

    if (!instanceName || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendTextMessage(instanceName, phone, message)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      )
    }

    // Update message count
    const supabase = getSupabase()
    const { data: account } = await supabase
      .from('whatsapp_accounts')
      .select('messages_sent_today')
      .eq('instance_name', instanceName)
      .single()

    if (account) {
      await supabase
        .from('whatsapp_accounts')
        .update({ messages_sent_today: (account.messages_sent_today || 0) + 1 })
        .eq('instance_name', instanceName)
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in send route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
