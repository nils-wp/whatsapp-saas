/**
 * Manual Poll Endpoint for Test Mode
 * Führt sofort ein Polling für einen spezifischen Trigger durch
 * Wird vom Test-Mode Frontend aufgerufen um Events in Echtzeit zu erfassen
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { pollCRMEvents, extractContactFromEvent, type CRMType } from '@/lib/integrations/crm-polling'

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// CRMs that require polling (no native webhooks)
const POLLING_CRMS = ['hubspot', 'close', 'activecampaign']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()
    const { id } = await params

    // Verify user has access
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

    // Get trigger
    const { data: trigger } = await serviceSupabase
      .from('triggers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', member.tenant_id)
      .single()

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    // Check if this is a polling CRM
    if (!POLLING_CRMS.includes(trigger.type)) {
      return NextResponse.json({
        success: true,
        message: 'Native webhook CRM - no polling needed',
        crmType: trigger.type,
      })
    }

    // Check if test mode is active
    const externalConfig = (trigger.external_config as Record<string, unknown>) || {}
    const testModeUntil = externalConfig.test_mode_until as string | undefined
    const isTestMode = testModeUntil ? new Date(testModeUntil) > new Date() : false

    if (!isTestMode) {
      return NextResponse.json({
        success: false,
        error: 'Test mode not active',
      }, { status: 400 })
    }

    // Get integration config
    const { data: integrations } = await serviceSupabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', member.tenant_id)
      .single()

    if (!integrations) {
      return NextResponse.json({
        success: false,
        error: 'No integration config found',
      }, { status: 400 })
    }

    // Build polling config
    const crmType = trigger.type as CRMType
    const pollingConfig = buildPollingConfig(crmType, integrations)

    if (!pollingConfig) {
      return NextResponse.json({
        success: false,
        error: `Invalid config for ${crmType}`,
      }, { status: 400 })
    }

    // Determine last poll time
    // For test mode, if last_polled_at is missing or very old, use Now
    let lastPolledAt = trigger.last_polled_at
      ? new Date(trigger.last_polled_at)
      : new Date()

    // If test mode JUST started and last_polled_at is older than 30 seconds ago,
    // it might be a legacy value. Re-anchor to now.
    const testModeStartedAt = testModeUntil ? new Date(new Date(testModeUntil).getTime() - 5 * 60 * 1000) : new Date()
    if (lastPolledAt < testModeStartedAt) {
      lastPolledAt = testModeStartedAt
    }

    // Get trigger event
    const triggerEvent = (trigger.trigger_event || externalConfig.trigger_event || 'created') as string
    const filters = (externalConfig.event_filters || {}) as Record<string, string>

    console.log(`[Poll Now] Polling ${crmType} for trigger ${id}`, {
      triggerEvent,
      lastPolledAt: lastPolledAt.toISOString(),
    })

    // Poll for events
    const pollResult = await pollCRMEvents(
      crmType,
      pollingConfig,
      triggerEvent,
      lastPolledAt,
      filters
    )

    if (pollResult.error) {
      console.error(`[Poll Now] Error polling ${crmType}:`, pollResult.error)
      return NextResponse.json({
        success: false,
        error: pollResult.error,
      }, { status: 500 })
    }

    console.log(`[Poll Now] Found ${pollResult.events.length} events`)

    // Store events as test events
    for (const event of pollResult.events) {
      const contact = extractContactFromEvent(event)

      await serviceSupabase.from('crm_webhook_events').insert({
        trigger_id: trigger.id,
        tenant_id: trigger.tenant_id,
        crm_type: crmType,
        event_type: triggerEvent,
        raw_payload: event.data,
        extracted_data: contact,
        is_test_event: true,
      })
    }

    // Update last_polled_at
    await serviceSupabase.from('triggers').update({
      last_polled_at: new Date().toISOString(),
    }).eq('id', trigger.id)

    return NextResponse.json({
      success: true,
      eventsFound: pollResult.events.length,
      events: pollResult.events.map(e => ({
        id: e.id,
        recordId: e.recordId,
        phone: e.phone,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
      })),
    })

  } catch (error) {
    console.error('[Poll Now] Error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}

/**
 * Build polling config from tenant integrations
 */
function buildPollingConfig(
  crmType: CRMType,
  integrations: Record<string, unknown>
): Record<string, string | undefined> | null {
  switch (crmType) {
    case 'hubspot':
      if (!integrations.hubspot_access_token) return null
      return { accessToken: integrations.hubspot_access_token as string }

    case 'close':
      if (!integrations.close_api_key) return null
      return { apiKey: integrations.close_api_key as string }

    case 'activecampaign':
      if (!integrations.activecampaign_api_key || !integrations.activecampaign_api_url) return null
      return {
        apiKey: integrations.activecampaign_api_key as string,
        apiUrl: integrations.activecampaign_api_url as string,
      }

    default:
      return null
  }
}
