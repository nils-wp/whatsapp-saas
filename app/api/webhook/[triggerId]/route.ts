import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { startNewConversation } from '@/lib/ai/message-handler'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ triggerId: string }> }
) {
  try {
    const supabase = getSupabase()
    const { triggerId } = await params
    const webhookSecret = request.headers.get('X-Webhook-Secret')

    // Find trigger by webhook_id
    const { data: trigger, error: triggerError } = await supabase
      .from('triggers')
      .select('*, whatsapp_accounts(instance_name), agents(*)')
      .eq('webhook_id', triggerId)
      .single()

    if (triggerError || !trigger) {
      return NextResponse.json(
        { error: 'Trigger not found' },
        { status: 404 }
      )
    }

    // Verify secret
    if (trigger.webhook_secret !== webhookSecret) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    // Check if trigger is active
    if (!trigger.is_active) {
      return NextResponse.json(
        { error: 'Trigger is inactive' },
        { status: 400 }
      )
    }

    const payload = await request.json()

    // Validate required fields
    if (!payload.phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Clean phone number
    const phone = payload.phone.replace(/\D/g, '')

    // Use the unified startNewConversation function that handles everything
    const result = await startNewConversation({
      tenantId: trigger.tenant_id,
      triggerId: trigger.id,
      phone,
      contactName: payload.name,
      externalLeadId: payload.lead_id,
      triggerData: payload,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to start conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation_id: result.conversationId,
      message: 'Conversation created and first message sent',
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET for testing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ triggerId: string }> }
) {
  const { triggerId } = await params

  return NextResponse.json({
    message: 'Webhook endpoint is active',
    webhook_id: triggerId,
    method: 'POST required',
  })
}
