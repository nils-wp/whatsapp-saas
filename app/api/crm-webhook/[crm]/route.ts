/**
 * Unified CRM Webhook Endpoint
 * Ein Endpoint für alle CRM-Webhooks mit CRM-spezifischer Payload-Verarbeitung
 * URL: /api/crm-webhook/pipedrive, /api/crm-webhook/monday, etc.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractContactFromPayload, matchesFilters, getCRMApiConfig, type CRMType } from '@/lib/integrations/crm-polling'
import { startNewConversation } from '@/lib/ai/message-handler'
import * as ac from '@/lib/integrations/activecampaign'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SUPPORTED_CRMS = ['pipedrive', 'hubspot', 'monday', 'close', 'activecampaign']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ crm: string }> }
) {
  const { crm } = await params

  // Validate CRM type
  if (!SUPPORTED_CRMS.includes(crm)) {
    return NextResponse.json({
      error: `Unsupported CRM: ${crm}`,
      supported: SUPPORTED_CRMS,
    }, { status: 400 })
  }

  const crmType = crm as CRMType

  try {
    const contentType = request.headers.get('content-type') || ''
    let payload: Record<string, any>

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      payload = {}
      formData.forEach((value, key) => {
        payload[key] = value
      })
    } else {
      payload = await request.json()
    }

    const url = new URL(request.url)
    const triggerId = url.searchParams.get('triggerId')

    console.log(`[CRM Webhook] Received ${crmType} webhook`, {
      triggerId,
      payloadKeys: Object.keys(payload),
    })

    const supabase = getSupabase()

    // Find trigger by ID or by CRM type
    let trigger: Record<string, unknown> | null = null

    if (triggerId) {
      const { data } = await supabase
        .from('triggers')
        .select('*')
        .eq('id', triggerId)
        .single()
      trigger = data
    } else {
      // Try to find trigger by CRM type and verify it matches the incoming webhook
      // This is for CRMs that don't support passing custom query params
      const { data: triggers } = await supabase
        .from('triggers')
        .select('*')
        .eq('type', crmType)
        .eq('is_active', true)
        .eq('crm_webhook_status', 'active')

      if (triggers?.length === 1) {
        trigger = triggers[0]
      } else if (triggers && triggers.length > 1) {
        // Multiple triggers - try to match by event type
        const eventType = extractEventType(crmType, payload)
        trigger = triggers.find(t => {
          const tEvent = t.trigger_event as string
          if (tEvent === eventType) return true

          // AC Mapping resilience
          if (crmType === 'activecampaign') {
            if (tEvent === 'tag_added' && eventType === 'contact_tag_added') return true
            if (tEvent === 'tag_removed' && eventType === 'contact_tag_removed') return true
            if (tEvent === 'contact_tag_added' && eventType === 'tag_added') return true
            if (tEvent === 'contact_tag_removed' && eventType === 'tag_removed') return true
          }

          return (t.external_config as Record<string, unknown>)?.trigger_event === eventType
        }) || null
      }
    }

    if (!trigger) {
      console.warn(`[CRM Webhook] No trigger found for ${crmType}`, { triggerId })
      return NextResponse.json({
        error: 'Trigger not found',
        crmType,
        triggerId,
      }, { status: 404 })
    }

    if (!trigger.is_active) {
      return NextResponse.json({
        error: 'Trigger is inactive',
        triggerId: trigger.id,
      }, { status: 400 })
    }

    // Extract contact data from payload
    const contact = extractContactFromPayload(crmType, payload)

    console.log(`[CRM Webhook] Extracted contact:`, {
      phone: contact.phone,
      firstName: contact.firstName,
      lastName: contact.lastName,
      externalId: contact.externalId,
    })

    // Check for test mode
    const isTestMode = await checkTestMode(supabase, trigger.id as string)

    if (isTestMode) {
      // Store event for test mode display (n8n-style "Listening for test event")
      await supabase.from('crm_webhook_events').insert({
        trigger_id: trigger.id,
        tenant_id: trigger.tenant_id,
        crm_type: crmType,
        event_type: extractEventType(crmType, payload) || 'unknown',
        raw_payload: payload,
        extracted_data: contact,
        is_test_event: true,
      })

      console.log(`[CRM Webhook] Test event stored for trigger ${trigger.id}`)

      return NextResponse.json({
        success: true,
        mode: 'test',
        message: 'Test event captured',
        extracted: contact,
      })
    }

    // Enrichment & Fallback: Fetch contact from API if data is missing or we need tags
    let integrations: Record<string, any> | null = null

    // 1. Try tenant_integrations (primary for dashboard)
    const { data: tiData } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', trigger.tenant_id)
      .maybeSingle()

    if (tiData) {
      integrations = tiData
    } else {
      // 2. Fallback to tenants.integration_settings
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('integration_settings')
        .eq('id', trigger.tenant_id)
        .maybeSingle()

      if (tenantData?.integration_settings) {
        integrations = tenantData.integration_settings as Record<string, any>
      }
    }

    if (integrations) {
      const config = getCRMApiConfig(crmType, integrations)

      if (crmType === 'activecampaign' && config.apiUrl && config.apiKey) {
        try {
          // 1. Fetch contact details if phone is missing
          if (!contact.phone) {
            console.log(`[CRM Webhook] Phone missing in AC payload, fetching from API for ID: ${contact.externalId}`)
            const acContact = await ac.getContact(config as any, contact.externalId)
            if (acContact?.phone) {
              console.log(`[CRM Webhook] Successfully fetched phone from AC API: ${acContact.phone}`)
              contact.phone = acContact.phone
              if (!contact.firstName) contact.firstName = acContact.firstName || null
              if (!contact.lastName) contact.lastName = acContact.lastName || null
              contact.fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.fullName
            }
          }

          // 2. ALWAYS fetch tags if this trigger depends on tags, to ensure matching works against IDs
          const hasTagFilter = Object.keys(trigger.event_filters || {}).some(k => k.includes('tag'))
          if (hasTagFilter) {
            const acTags = await ac.getContactTags(config as any, contact.externalId)
            if (acTags.length > 0) {
              // Attach tags to payload so matchesFilters can see them
              (payload as any).tags = acTags.map(t => t.id).join(',')
              console.log(`[CRM Webhook] Enrichment: Fetched ${acTags.length} tags for AC ID ${contact.externalId}`)
            }
          }
        } catch (acError) {
          console.error(`[CRM Webhook] Enrichment error for AC:`, acError)
        }
      }
    }

    // Validate phone number
    if (!contact.phone) {
      // Store event but don't start conversation
      await supabase.from('crm_webhook_events').insert({
        trigger_id: trigger.id,
        tenant_id: trigger.tenant_id,
        crm_type: crmType,
        event_type: extractEventType(crmType, payload) || 'unknown',
        raw_payload: payload,
        extracted_data: contact,
        is_test_event: false,
        error_message: 'No phone number in payload (and fallback failed)',
      })

      return NextResponse.json({
        success: false,
        error: 'No phone number found in payload',
        extracted: contact,
      }, { status: 400 })
    }

    // Check event filters
    const externalConfig = (trigger.external_config as Record<string, unknown>) || {}
    // Match filters
    const filters = (trigger.event_filters as Record<string, string | string[]>) || {}
    const event = extractEventType(crmType, payload) || trigger.trigger_event as string

    if (!matchesFilters(crmType, event, payload, filters)) {
      console.log(`[CRM Webhook] Payload does not match filters for ${crmType}`, {
        triggerId: trigger.id,
        filters,
      })
      return NextResponse.json({
        message: 'Payload does not match filters',
        crmType,
        triggerId: trigger.id,
      })
    }

    // Start conversation
    const conversationResult = await startNewConversation({
      tenantId: trigger.tenant_id as string,
      triggerId: trigger.id as string,
      phone: contact.phone,
      contactName: contact.fullName || undefined,
      externalLeadId: contact.externalId,
      triggerData: {
        ...flattenPayload(payload),
        first_name: contact.firstName,
        last_name: contact.lastName,
        vorname: contact.firstName,
        nachname: contact.lastName,
        email: contact.email,
        crm_type: crmType,
        crm_record_id: contact.externalId,
      },
    })

    if (!conversationResult.success) {
      // Store failed event
      await supabase.from('crm_webhook_events').insert({
        trigger_id: trigger.id,
        tenant_id: trigger.tenant_id,
        crm_type: crmType,
        event_type: extractEventType(crmType, payload) || 'unknown',
        raw_payload: payload,
        extracted_data: contact,
        is_test_event: false,
        error_message: conversationResult.error,
      })

      return NextResponse.json({
        success: false,
        error: conversationResult.error,
      }, { status: 500 })
    }

    // Update conversation with extracted name data
    if (conversationResult.conversationId) {
      await supabase.from('conversations').update({
        contact_first_name: contact.firstName,
        contact_last_name: contact.lastName,
        crm_contact_id: contact.externalId,
      }).eq('id', conversationResult.conversationId)
    }

    // Store successful event
    await supabase.from('crm_webhook_events').insert({
      trigger_id: trigger.id,
      tenant_id: trigger.tenant_id,
      crm_type: crmType,
      event_type: extractEventType(crmType, payload) || 'unknown',
      raw_payload: payload,
      extracted_data: contact,
      is_test_event: false,
      processed_at: new Date().toISOString(),
    })

    // Update trigger stats
    await supabase.rpc('increment_trigger_stats', { trigger_id: trigger.id })

    return NextResponse.json({
      success: true,
      conversationId: conversationResult.conversationId,
      extracted: contact,
    })

  } catch (error) {
    console.error(`[CRM Webhook] Error processing ${crmType} webhook:`, error)
    return NextResponse.json({
      error: 'Internal server error',
      message: String(error),
    }, { status: 500 })
  }
}

// Handle GET for webhook verification (some CRMs require this)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ crm: string }> }
) {
  const { crm } = await params
  const url = new URL(request.url)

  // HubSpot verification
  if (crm === 'hubspot') {
    const challenge = url.searchParams.get('challenge')
    if (challenge) {
      return new Response(challenge, { status: 200 })
    }
  }

  // Monday verification
  if (crm === 'monday') {
    const challenge = url.searchParams.get('challenge')
    if (challenge) {
      return NextResponse.json({ challenge })
    }
  }

  return NextResponse.json({
    status: 'ok',
    crm,
    supported: SUPPORTED_CRMS,
  })
}

/**
 * Extract event type from webhook payload
 */
function extractEventType(crm: CRMType, payload: Record<string, unknown>): string | null {
  switch (crm) {
    case 'pipedrive':
      return (payload.meta as Record<string, unknown>)?.action as string ||
        (payload.event as string) || null

    case 'hubspot':
      return (payload.subscriptionType as string) ||
        (payload.eventType as string) || null

    case 'monday':
      return (payload.event as Record<string, unknown>)?.type as string ||
        (payload.type as string) || null

    case 'close':
      return (payload.event as string) ||
        (payload.type as string) || null

    case 'activecampaign': {
      const rawType = (payload.type as string) || (payload.action as string) || ''
      // Map AC native webhook types to our internal types if needed
      if (rawType === 'contact_tag_added') return 'contact_tag_added'
      if (rawType === 'contact_tag_removed') return 'contact_tag_removed'
      return rawType || null
    }

    default:
      return null
  }
}

/**
 * Flatten nested payload for variable substitution
 */
function flattenPayload(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key

    if (value === null || value === undefined) {
      continue
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenPayload(value as Record<string, unknown>, newKey))
    } else if (Array.isArray(value)) {
      // For arrays, take first element if it's a simple value
      if (value.length > 0 && typeof value[0] !== 'object') {
        result[newKey] = String(value[0])
      }
    } else {
      result[newKey] = String(value)
    }
  }

  return result
}

/**
 * Check if trigger is in test mode
 */
async function checkTestMode(
  supabase: ReturnType<typeof getSupabase>,
  triggerId: string
): Promise<boolean> {
  // Check for test mode activation via API endpoint
  // The test mode endpoint sets a flag that expires after 30 seconds
  const { data } = await supabase
    .from('triggers')
    .select('external_config')
    .eq('id', triggerId)
    .single()

  const externalConfig = (data?.external_config as Record<string, unknown>) || {}
  const testModeUntil = externalConfig.test_mode_until as string | undefined

  if (testModeUntil) {
    return new Date(testModeUntil) > new Date()
  }

  return false
}
