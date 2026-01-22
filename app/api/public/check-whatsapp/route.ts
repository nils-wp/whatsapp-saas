import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkWhatsAppNumbers } from '@/lib/evolution/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Public API endpoint for WhatsApp number validation
 * Used by Chatsetter embed forms to validate phone numbers before submission
 *
 * POST /api/public/check-whatsapp
 * Body: { phone: string, apiKey: string }
 *
 * The apiKey is the tenant's public API key (webhook_id from a trigger)
 */
export async function POST(request: Request) {
  try {
    // Handle CORS for embed forms
    const origin = request.headers.get('origin')

    const { phone, apiKey } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { valid: false, error: 'Phone number is required' },
        {
          status: 400,
          headers: corsHeaders(origin),
        }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'API key is required' },
        {
          status: 400,
          headers: corsHeaders(origin),
        }
      )
    }

    const supabase = getSupabase()

    // Find trigger by webhook_id (used as public API key)
    const { data: trigger, error: triggerError } = await supabase
      .from('triggers')
      .select('tenant_id, whatsapp_accounts(instance_name)')
      .eq('webhook_id', apiKey)
      .eq('is_active', true)
      .single()

    if (triggerError || !trigger) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API key' },
        {
          status: 401,
          headers: corsHeaders(origin),
        }
      )
    }

    // whatsapp_accounts is an array from the join, get the first one
    const whatsappAccount = Array.isArray(trigger.whatsapp_accounts)
      ? trigger.whatsapp_accounts[0]
      : trigger.whatsapp_accounts
    const instanceName = whatsappAccount?.instance_name
    if (!instanceName) {
      return NextResponse.json(
        { valid: false, error: 'No WhatsApp account configured' },
        {
          status: 400,
          headers: corsHeaders(origin),
        }
      )
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '')

    // Check if number is on WhatsApp
    const checkResult = await checkWhatsAppNumbers(instanceName, [cleanPhone])

    if (!checkResult.success) {
      return NextResponse.json(
        { valid: false, error: 'Validation service unavailable' },
        {
          status: 503,
          headers: corsHeaders(origin),
        }
      )
    }

    const numberCheck = checkResult.data?.[0]
    const isValid = numberCheck?.exists ?? false

    return NextResponse.json(
      {
        valid: isValid,
        phone: cleanPhone,
        jid: isValid ? numberCheck?.jid : null,
      },
      { headers: corsHeaders(origin) }
    )

  } catch (error) {
    console.error('WhatsApp check error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  })
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}
