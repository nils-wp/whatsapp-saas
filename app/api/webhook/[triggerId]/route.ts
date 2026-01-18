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

interface ExtractedName {
  fullName?: string
  firstName?: string
  lastName?: string
}

/**
 * Extract contact name (full, first, last) from CRM-specific webhook payload
 * Each CRM has different field names for contact information
 */
function extractContactNameFromPayload(
  triggerType: TriggerType,
  payload: Record<string, unknown>
): ExtractedName {
  switch (triggerType) {
    case 'close': {
      // Close CRM payload structures
      const data = payload.data as Record<string, unknown> | undefined
      if (!data) {
        return { fullName: payload.name as string | undefined }
      }

      // Lead/Contact name
      if (data.display_name) {
        return { fullName: data.display_name as string }
      }
      if (data.name) {
        return { fullName: data.name as string }
      }

      // If it's a lead event, check for first contact name
      const contacts = data.contacts as Array<{ name?: string }> | undefined
      if (contacts?.[0]?.name) {
        return { fullName: contacts[0].name }
      }

      return { fullName: payload.name as string | undefined }
    }

    case 'activecampaign': {
      // ActiveCampaign puts contact info in 'contact' object
      const contact = payload.contact as Record<string, unknown> | undefined
      if (!contact) {
        return { fullName: payload.name as string | undefined }
      }

      const firstName = contact.firstName as string | undefined
      const lastName = contact.lastName as string | undefined

      if (firstName || lastName) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        return { fullName, firstName, lastName }
      }

      // Fallback to email if no name
      const email = contact.email as string | undefined
      if (email) {
        return { fullName: email.split('@')[0], firstName: email.split('@')[0] }
      }

      return { fullName: payload.name as string | undefined }
    }

    case 'pipedrive': {
      // Pipedrive uses 'current' for the current state of the object
      const current = payload.current as Record<string, unknown> | undefined
      if (!current) {
        return { fullName: payload.name as string | undefined }
      }

      // Check for first_name + last_name first
      const firstName = current.first_name as string | undefined
      const lastName = current.last_name as string | undefined
      if (firstName || lastName) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        return { fullName, firstName, lastName }
      }

      // Person events have name directly
      if (current.name) {
        return { fullName: current.name as string }
      }

      // Deal events have person_name
      if (current.person_name) {
        return { fullName: current.person_name as string }
      }

      // Check for person object in deal
      const person = current.person as Record<string, unknown> | undefined
      if (person?.name) {
        return { fullName: person.name as string }
      }

      return { fullName: payload.name as string | undefined }
    }

    case 'hubspot': {
      // HubSpot uses 'properties' for contact/deal properties
      const properties = payload.properties as Record<string, unknown> | undefined
      if (!properties) {
        return { fullName: payload.name as string | undefined }
      }

      const firstName = properties.firstname as string | undefined
      const lastName = properties.lastname as string | undefined

      if (firstName || lastName) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        return { fullName, firstName, lastName }
      }

      // Company name for company events
      if (properties.name) {
        return { fullName: properties.name as string }
      }

      // Deal name
      if (properties.dealname) {
        return { fullName: properties.dealname as string }
      }

      return { fullName: payload.name as string | undefined }
    }

    case 'monday': {
      // Monday.com uses 'event' object with pulseName (item name)
      const event = payload.event as Record<string, unknown> | undefined
      if (!event) {
        return { fullName: payload.name as string | undefined }
      }

      // Item/pulse name
      if (event.pulseName) {
        return { fullName: event.pulseName as string }
      }

      // Or columnValue with person info
      const value = event.value as Record<string, unknown> | undefined
      if (value?.text) {
        return { fullName: value.text as string }
      }

      return { fullName: payload.name as string | undefined }
    }

    case 'webhook':
    default: {
      // Generic webhook - check for first_name/last_name or just name
      const firstName = payload.first_name as string | undefined
      const lastName = payload.last_name as string | undefined

      if (firstName || lastName) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        return { fullName, firstName, lastName }
      }

      return { fullName: payload.name as string | undefined }
    }
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
    const extractedName = extractContactNameFromPayload(trigger.type as TriggerType, payload)
    const externalLeadId = extractLeadIdFromPayload(trigger.type as TriggerType, payload)

    console.log(`Extracted from ${trigger.type} payload - Name: "${extractedName.fullName}", First: "${extractedName.firstName}", Last: "${extractedName.lastName}", Lead ID: "${externalLeadId}"`)

    // Build trigger data with first/last name for variable substitution
    const triggerDataWithNames = {
      ...payload,
      // Add extracted name fields for variable substitution
      first_name: extractedName.firstName,
      last_name: extractedName.lastName,
      vorname: extractedName.firstName,
      nachname: extractedName.lastName,
    }

    // Use the unified startNewConversation function that handles everything
    const result = await startNewConversation({
      tenantId: trigger.tenant_id,
      triggerId: trigger.id,
      phone,
      contactName: extractedName.fullName,
      externalLeadId,
      triggerData: triggerDataWithNames,
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
