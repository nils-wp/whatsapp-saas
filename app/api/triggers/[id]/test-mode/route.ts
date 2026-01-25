import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Test mode duration: 5 minutes
const TEST_MODE_DURATION_MS = 5 * 60 * 1000

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/triggers/[id]/test-mode
 * Start or stop test mode for a trigger
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verify user has access to this trigger
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

    // Get trigger and verify ownership
    const { data: trigger } = await supabase
      .from('triggers')
      .select('id, tenant_id, webhook_id, webhook_secret')
      .eq('id', id)
      .eq('tenant_id', member.tenant_id)
      .single()

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action } = body // 'start' or 'stop'

    const serviceSupabase = getServiceSupabase()

    if (action === 'start') {
      // Start test mode - store expiry in external_config
      const expiryTime = Date.now() + TEST_MODE_DURATION_MS

      // Update trigger with test mode flag
      await serviceSupabase.from('triggers').update({
        external_config: {
          ...((trigger as Record<string, unknown>).external_config as Record<string, unknown> || {}),
          test_mode_until: new Date(expiryTime).toISOString(),
        }
      }).eq('id', trigger.id)

      // Clear any previous test events
      await serviceSupabase.from('crm_webhook_events')
        .delete()
        .eq('trigger_id', trigger.id)
        .eq('is_test_event', true)

      // Determine webhook URL based on trigger type
      const isCRMTrigger = ['pipedrive', 'hubspot', 'monday', 'close', 'activecampaign'].includes((trigger as Record<string, unknown>).type as string)
      const webhookUrl = isCRMTrigger
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/crm-webhook/${(trigger as Record<string, unknown>).type}?triggerId=${trigger.id}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/${trigger.webhook_id}`

      return NextResponse.json({
        success: true,
        testMode: true,
        expiresAt: new Date(expiryTime).toISOString(),
        webhookUrl,
        webhookSecret: trigger.webhook_secret,
        isCRMTrigger,
        message: isCRMTrigger
          ? 'Test mode started. Events from your CRM will be captured.'
          : 'Test mode started. Trigger a webhook event from your CRM.',
      })
    } else if (action === 'stop') {
      // Stop test mode - clear flag from external_config
      const currentConfig = ((trigger as Record<string, unknown>).external_config as Record<string, unknown>) || {}
      const { test_mode_until: _, ...restConfig } = currentConfig

      await serviceSupabase.from('triggers').update({
        external_config: restConfig
      }).eq('id', trigger.id)

      // Clear test events
      await serviceSupabase.from('crm_webhook_events')
        .delete()
        .eq('trigger_id', trigger.id)
        .eq('is_test_event', true)

      return NextResponse.json({
        success: true,
        testMode: false,
        message: 'Test mode stopped.',
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Test mode error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/triggers/[id]/test-mode
 * Poll for test events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
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

    // Verify trigger ownership
    const { data: trigger } = await supabase
      .from('triggers')
      .select('id, tenant_id')
      .eq('id', id)
      .eq('tenant_id', member.tenant_id)
      .single()

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    const serviceSupabase = getServiceSupabase()

    // Check if test mode is active from external_config
    const { data: triggerData } = await serviceSupabase
      .from('triggers')
      .select('external_config, type')
      .eq('id', trigger.id)
      .single()

    const externalConfig = (triggerData?.external_config as Record<string, unknown>) || {}
    const testModeUntil = externalConfig.test_mode_until as string | undefined
    const expiry = testModeUntil ? new Date(testModeUntil).getTime() : 0
    const isTestModeActive = expiry > Date.now()

    if (!isTestModeActive) {
      return NextResponse.json({
        testMode: false,
        hasEvent: false,
      })
    }

    // Check for test events in database
    const { data: testEvents } = await serviceSupabase
      .from('crm_webhook_events')
      .select('*')
      .eq('trigger_id', trigger.id)
      .eq('is_test_event', true)
      .order('created_at', { ascending: false })
      .limit(5)

    const latestEvent = testEvents?.[0]

    return NextResponse.json({
      testMode: true,
      expiresAt: new Date(expiry).toISOString(),
      remainingSeconds: Math.round((expiry - Date.now()) / 1000),
      hasEvent: !!latestEvent,
      event: latestEvent ? {
        timestamp: new Date(latestEvent.created_at).getTime(),
        payload: latestEvent.raw_payload,
        extractedVariables: latestEvent.extracted_data,
        crmType: latestEvent.crm_type,
        eventType: latestEvent.event_type,
      } : null,
      allEvents: testEvents?.map(e => ({
        id: e.id,
        timestamp: new Date(e.created_at).getTime(),
        crmType: e.crm_type,
        eventType: e.event_type,
        extractedData: e.extracted_data,
      })) || [],
    })
  } catch (error) {
    console.error('Test mode poll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Store a test event (called from webhook handler)
 * Now uses database instead of in-memory store
 */
export async function storeTestEvent(
  triggerId: string,
  tenantId: string,
  crmType: string,
  eventType: string,
  payload: Record<string, unknown>,
  extractedVariables: Record<string, string | null>
): Promise<boolean> {
  const supabase = getServiceSupabase()

  // Store the event in database
  const { error } = await supabase.from('crm_webhook_events').insert({
    trigger_id: triggerId,
    tenant_id: tenantId,
    crm_type: crmType,
    event_type: eventType,
    raw_payload: payload,
    extracted_data: extractedVariables,
    is_test_event: true,
  })

  return !error
}

/**
 * Check if trigger is in test mode
 * Now checks database instead of in-memory store
 */
export async function isInTestMode(triggerId: string): Promise<boolean> {
  const supabase = getServiceSupabase()

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
