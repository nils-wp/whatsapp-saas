import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Check for existing conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenant_id', trigger.tenant_id)
      .eq('contact_phone', phone)
      .eq('status', 'active')
      .single()

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        message: 'Conversation already exists',
        conversation_id: existingConversation.id,
      })
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        tenant_id: trigger.tenant_id,
        whatsapp_account_id: trigger.whatsapp_account_id,
        agent_id: trigger.agent_id,
        trigger_id: trigger.id,
        contact_phone: phone,
        contact_name: payload.name || null,
        external_lead_id: payload.lead_id || null,
        status: 'active',
        current_script_step: 1,
      })
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    // Replace variables in first message
    let firstMessage = trigger.first_message
    firstMessage = firstMessage.replace(/\{\{name\}\}/g, payload.name || 'du')
    firstMessage = firstMessage.replace(/\{\{email\}\}/g, payload.email || '')
    firstMessage = firstMessage.replace(/\{\{phone\}\}/g, phone)

    // Create message record
    const { error: msgError } = await supabase.from('messages').insert({
      tenant_id: trigger.tenant_id,
      conversation_id: conversation.id,
      direction: 'outbound',
      sender_type: 'agent',
      content: firstMessage,
      script_step_used: 0,
      status: 'pending',
    })

    if (msgError) {
      console.error('Error creating message:', msgError)
    }

    // Update trigger stats
    await supabase
      .from('triggers')
      .update({
        total_triggered: trigger.total_triggered + 1,
        total_conversations: trigger.total_conversations + 1,
      })
      .eq('id', trigger.id)

    // Here you would typically trigger the actual message sending
    // directly through Evolution API
    // For now, we'll just mark it as scheduled

    return NextResponse.json({
      success: true,
      conversation_id: conversation.id,
      message: 'Conversation created and first message scheduled',
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
