import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { startNewConversation } from '@/lib/ai/message-handler'
import { EVENT_FILTERS, type TriggerType } from '@/lib/utils/validation'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Get a nested value from an object using dot notation path
function getNestedValue(obj: unknown, path: string): unknown {
  if (!path || typeof obj !== 'object' || obj === null) return undefined

  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

// Check if webhook payload matches the event filters
function checkEventFilters(
  triggerType: TriggerType,
  triggerEvent: string | undefined,
  eventFilters: Record<string, string | string[]> | undefined,
  payload: unknown
): { matches: boolean; reason?: string } {
  // If no event or no filters, allow all
  if (!triggerEvent || !eventFilters || Object.keys(eventFilters).length === 0) {
    return { matches: true }
  }

  // Get filter configuration for this event
  const filterConfig = EVENT_FILTERS[triggerType]?.[triggerEvent]
  if (!filterConfig) {
    return { matches: true } // No filter config = allow all
  }

  // Check each configured filter
  for (const [key, expectedValue] of Object.entries(eventFilters)) {
    // Skip empty filter values
    if (!expectedValue || (Array.isArray(expectedValue) && expectedValue.length === 0)) {
      continue
    }

    // Find the filter field definition
    const filterField = filterConfig.filters.find(f => f.key === key)
    if (!filterField) continue

    // Get actual value from payload
    const actualValue = getNestedValue(payload, filterField.payloadPath)
    const matchMode = filterField.matchMode || 'equals'

    let matches = false

    if (matchMode === 'equals') {
      // Direct equality check
      if (Array.isArray(expectedValue)) {
        matches = expectedValue.includes(String(actualValue))
      } else {
        matches = String(actualValue) === String(expectedValue)
      }
    } else if (matchMode === 'contains') {
      // Check if actual value contains expected (for arrays or strings)
      if (Array.isArray(actualValue)) {
        matches = actualValue.some(v => String(v).includes(String(expectedValue)))
      } else {
        matches = String(actualValue).includes(String(expectedValue))
      }
    } else if (matchMode === 'in') {
      // Check if actual value is in the expected array
      if (Array.isArray(expectedValue)) {
        matches = expectedValue.includes(String(actualValue))
      } else {
        matches = String(actualValue) === String(expectedValue)
      }
    }

    if (!matches) {
      return {
        matches: false,
        reason: `Filter '${filterField.label}' nicht erfüllt: erwartet '${expectedValue}', erhalten '${actualValue}'`,
      }
    }
  }

  return { matches: true }
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

    // Check event filters from external_config
    const externalConfig = trigger.external_config as {
      trigger_event?: string
      event_filters?: Record<string, string | string[]>
    } | null

    const filterResult = checkEventFilters(
      trigger.type as TriggerType,
      externalConfig?.trigger_event,
      externalConfig?.event_filters,
      payload
    )

    if (!filterResult.matches) {
      console.log(`Webhook filtered out: ${filterResult.reason}`)
      return NextResponse.json({
        success: false,
        filtered: true,
        reason: filterResult.reason,
        message: 'Event did not match filter conditions',
      })
    }

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
