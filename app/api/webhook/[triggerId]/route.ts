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

/**
 * Extract contact name from CRM-specific webhook payload
 * Each CRM has different field names for contact information
 */
function extractContactNameFromPayload(
  triggerType: TriggerType,
  payload: Record<string, unknown>
): string | undefined {
  switch (triggerType) {
    case 'close': {
      // Close CRM payload structures
      const data = payload.data as Record<string, unknown> | undefined
      if (!data) return payload.name as string | undefined

      // Lead/Contact name
      if (data.display_name) return data.display_name as string
      if (data.name) return data.name as string

      // If it's a lead event, check for first contact name
      const contacts = data.contacts as Array<{ name?: string }> | undefined
      if (contacts?.[0]?.name) return contacts[0].name

      // Fallback to top-level name
      return payload.name as string | undefined
    }

    case 'activecampaign': {
      // ActiveCampaign puts contact info in 'contact' object
      const contact = payload.contact as Record<string, unknown> | undefined
      if (!contact) return payload.name as string | undefined

      const firstName = contact.firstName as string | undefined
      const lastName = contact.lastName as string | undefined

      if (firstName && lastName) return `${firstName} ${lastName}`.trim()
      if (firstName) return firstName
      if (lastName) return lastName

      // Fallback to email if no name
      const email = contact.email as string | undefined
      if (email) return email.split('@')[0] // Use email prefix as name

      return payload.name as string | undefined
    }

    case 'pipedrive': {
      // Pipedrive uses 'current' for the current state of the object
      const current = payload.current as Record<string, unknown> | undefined
      if (!current) return payload.name as string | undefined

      // Person events have name directly
      if (current.name) return current.name as string

      // Or first_name + last_name
      const firstName = current.first_name as string | undefined
      const lastName = current.last_name as string | undefined
      if (firstName && lastName) return `${firstName} ${lastName}`.trim()
      if (firstName) return firstName
      if (lastName) return lastName

      // Deal events have person_name
      if (current.person_name) return current.person_name as string

      // Check for person object in deal
      const person = current.person as Record<string, unknown> | undefined
      if (person?.name) return person.name as string

      return payload.name as string | undefined
    }

    case 'hubspot': {
      // HubSpot uses 'properties' for contact/deal properties
      const properties = payload.properties as Record<string, unknown> | undefined
      if (!properties) return payload.name as string | undefined

      const firstName = properties.firstname as string | undefined
      const lastName = properties.lastname as string | undefined

      if (firstName && lastName) return `${firstName} ${lastName}`.trim()
      if (firstName) return firstName
      if (lastName) return lastName

      // Company name for company events
      if (properties.name) return properties.name as string

      // Deal name
      if (properties.dealname) return properties.dealname as string

      return payload.name as string | undefined
    }

    case 'monday': {
      // Monday.com uses 'event' object with pulseName (item name)
      const event = payload.event as Record<string, unknown> | undefined
      if (!event) return payload.name as string | undefined

      // Item/pulse name
      if (event.pulseName) return event.pulseName as string

      // Or columnValue with person info
      const value = event.value as Record<string, unknown> | undefined
      if (value?.text) return value.text as string

      return payload.name as string | undefined
    }

    case 'webhook':
    default:
      // Generic webhook - just use 'name' field
      return payload.name as string | undefined
  }
}

/**
 * Extract lead/contact ID from CRM-specific webhook payload
 * Used for linking conversations back to CRM records
 */
function extractLeadIdFromPayload(
  triggerType: TriggerType,
  payload: Record<string, unknown>
): string | undefined {
  switch (triggerType) {
    case 'close': {
      const data = payload.data as Record<string, unknown> | undefined
      // Lead ID or contact ID
      return (data?.id as string) || (payload.lead_id as string) || (payload.id as string)
    }

    case 'activecampaign': {
      const contact = payload.contact as Record<string, unknown> | undefined
      return (contact?.id as string) || (payload.contact_id as string) || (payload.id as string)
    }

    case 'pipedrive': {
      const current = payload.current as Record<string, unknown> | undefined
      // Person ID or deal ID
      return (current?.id as string)?.toString() ||
             (current?.person_id as string)?.toString() ||
             (payload.id as string)?.toString()
    }

    case 'hubspot': {
      // HubSpot object ID
      return (payload.objectId as string)?.toString() ||
             (payload.vid as string)?.toString() ||
             (payload.id as string)?.toString()
    }

    case 'monday': {
      const event = payload.event as Record<string, unknown> | undefined
      // Pulse/item ID
      return (event?.pulseId as string)?.toString() ||
             (event?.itemId as string)?.toString() ||
             (payload.id as string)?.toString()
    }

    case 'webhook':
    default:
      return payload.lead_id as string | undefined
  }
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

    // Extract contact name and lead ID from CRM-specific payload structure
    const contactName = extractContactNameFromPayload(trigger.type as TriggerType, payload)
    const externalLeadId = extractLeadIdFromPayload(trigger.type as TriggerType, payload)

    console.log(`Extracted from ${trigger.type} payload - Name: "${contactName}", Lead ID: "${externalLeadId}"`)

    // Use the unified startNewConversation function that handles everything
    const result = await startNewConversation({
      tenantId: trigger.tenant_id,
      triggerId: trigger.id,
      phone,
      contactName,
      externalLeadId,
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
