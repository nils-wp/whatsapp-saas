/**
 * Manual Poll Endpoint for Test Mode
 * Führt sofort ein Polling für einen spezifischen Trigger durch
 * Wird vom Test-Mode Frontend aufgerufen um Events in Echtzeit zu erfassen
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { pollCRMEvents, extractContactFromEvent, getCRMApiConfig, type CRMType } from '@/lib/integrations/crm-polling'

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
      console.warn(`[Poll Now] Trigger ${id} not found for tenant ${member.tenant_id}`)
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

    // Get integration config - try both tables
    let integrations: Record<string, any> | null = null

    // 1. Try tenant_integrations (primary for dashboard)
    const { data: tiData } = await serviceSupabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', member.tenant_id)
      .maybeSingle()

    if (tiData) {
      integrations = tiData
    } else {
      // 2. Fallback to tenants.integration_settings
      const { data: tenantData } = await serviceSupabase
        .from('tenants')
        .select('integration_settings')
        .eq('id', member.tenant_id)
        .maybeSingle()

      if (tenantData?.integration_settings) {
        integrations = tenantData.integration_settings as Record<string, any>
      }
    }

    if (!integrations) {
      console.warn(`[Poll Now] No integration config found for tenant ${member.tenant_id}`)
      return NextResponse.json({
        success: false,
        error: 'No integration config found. Please connect your CRM first.',
      }, { status: 400 })
    }

    // Build polling config
    const crmType = trigger.type as CRMType
    const pollingConfig = getCRMApiConfig(crmType, integrations)

    if (!pollingConfig) {
      return NextResponse.json({
        success: false,
        error: `Invalid config for ${crmType}`,
      }, { status: 400 })
    }

    // Determine last poll time
    // For test mode, we use the recorded test_started_at to be absolutely sure
    const testStartedAtStr = externalConfig.test_started_at as string | undefined
    const testStartedAt = testStartedAtStr ? new Date(testStartedAtStr) : null
    const isValidTestStartedAt = testStartedAt && !isNaN(testStartedAt.getTime())

    let lastPolledAt = trigger.last_polled_at
      ? new Date(trigger.last_polled_at)
      : new Date()

    // Safety check for lastPolledAt
    if (isNaN(lastPolledAt.getTime())) {
      lastPolledAt = new Date()
    }

    // Safety: If testing and we have a start time, ensure we don't look back before it
    // RELAXED: Look back 60 seconds before test start to account for clock drift/delayed indexing
    if (isValidTestStartedAt && lastPolledAt < testStartedAt!) {
      lastPolledAt = new Date(testStartedAt!.getTime() - 60000)
    }

    // Get trigger event
    const triggerEvent = (trigger.trigger_event || externalConfig.trigger_event || 'created') as string
    const filters = (externalConfig.event_filters || {}) as Record<string, string>

    console.log(`[Poll Now] Polling ${crmType} for trigger ${id}`, {
      triggerEvent,
      lastPolledAt: lastPolledAt.toISOString(),
      testStartedAt: isValidTestStartedAt ? testStartedAt!.toISOString() : 'none',
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
        message: `CRM Polling failed: ${pollResult.error}`
      }, { status: 500 })
    }

    console.log(`[Poll Now] Found ${pollResult.events.length} potential events`)

    // Store events as test events - with STRICT manual filter
    let savedCount = 0
    for (const event of pollResult.events) {
      // DEFINITIVE FILTER: Skip anything that happened before or AT the exact start time
      if (isValidTestStartedAt && event.timestamp <= testStartedAt!) {
        console.log(`[Poll Now] Skipping event ${event.id} - too old (${event.timestamp.toISOString()} <= ${testStartedAt!.toISOString()})`)
        continue
      }

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
      savedCount++
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
      debug: pollResult.debugInfo,
    })

  } catch (error: any) {
    console.error('[Poll Now] Critical Exception:', error)
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack, // Include stack temporarily to find this elusive bug on production
    }, { status: 500 })
  }
}

