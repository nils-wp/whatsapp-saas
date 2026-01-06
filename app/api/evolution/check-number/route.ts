import { NextResponse } from 'next/server'
import { checkWhatsAppNumbers } from '@/lib/evolution/client'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const { phone, instanceName } = await request.json() as {
      phone: string
      instanceName?: string
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '')

    // If no instance provided, get the first connected account
    let instance: string = instanceName || ''
    if (!instance) {
      const supabase = getSupabase()
      const { data: account } = await supabase
        .from('whatsapp_accounts')
        .select('instance_name')
        .eq('status', 'connected')
        .limit(1)
        .single()

      if (!account?.instance_name) {
        return NextResponse.json(
          { error: 'No connected WhatsApp account found' },
          { status: 400 }
        )
      }
      instance = account.instance_name
    }

    const result = await checkWhatsAppNumbers(instance, [normalizedPhone])

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to check number' },
        { status: 500 }
      )
    }

    const checkResult = result.data?.[0]

    return NextResponse.json({
      exists: checkResult?.exists ?? false,
      jid: checkResult?.jid ?? null,
      phone: normalizedPhone,
    })
  } catch (error) {
    console.error('Error checking WhatsApp number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
