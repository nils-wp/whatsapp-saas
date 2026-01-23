import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkWhatsAppNumbers } from '@/lib/evolution/client'

/**
 * POST /api/whatsapp/check-number
 * Interner Endpoint zum Prüfen ob eine Nummer bei WhatsApp registriert ist
 * Erfordert Authentifizierung
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user's tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const { phone, accountId } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Get WhatsApp account - use specified one or find first connected one
    let instanceName: string | null = null

    if (accountId) {
      const { data: account } = await supabase
        .from('whatsapp_accounts')
        .select('instance_name, status')
        .eq('id', accountId)
        .eq('tenant_id', member.tenant_id)
        .single()

      if (!account || account.status !== 'connected') {
        return NextResponse.json(
          { error: 'WhatsApp account not found or not connected' },
          { status: 400 }
        )
      }
      instanceName = account.instance_name
    } else {
      // Find first connected account
      const { data: accounts } = await supabase
        .from('whatsapp_accounts')
        .select('instance_name')
        .eq('tenant_id', member.tenant_id)
        .eq('status', 'connected')
        .limit(1)

      if (!accounts || accounts.length === 0) {
        return NextResponse.json(
          { error: 'No connected WhatsApp account found' },
          { status: 400 }
        )
      }
      instanceName = accounts[0].instance_name
    }

    // Ensure instanceName is valid
    if (!instanceName) {
      return NextResponse.json(
        { error: 'WhatsApp account instance name not configured' },
        { status: 400 }
      )
    }

    // Clean phone number - remove everything except digits
    const cleanPhone = phone.replace(/\D/g, '')

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check if number is on WhatsApp
    const checkResult = await checkWhatsAppNumbers(instanceName, [cleanPhone])

    if (!checkResult.success) {
      return NextResponse.json(
        { error: 'WhatsApp validation service unavailable', details: checkResult.error },
        { status: 503 }
      )
    }

    const numberCheck = checkResult.data?.[0]
    const isValid = numberCheck?.exists ?? false

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      formattedPhone: formatPhoneNumber(cleanPhone),
      hasWhatsApp: isValid,
      jid: isValid ? numberCheck?.jid : null,
    })

  } catch (error) {
    console.error('WhatsApp check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Formats a phone number for display
 */
function formatPhoneNumber(phone: string): string {
  if (phone.length < 10) return phone

  // German numbers
  if (phone.startsWith('49')) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`
  }

  // Other numbers
  return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`
}
