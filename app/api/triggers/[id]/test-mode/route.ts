import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory store for test events (per trigger)
// In production, use Redis or a database table
const testEvents = new Map<string, {
  timestamp: number
  payload: Record<string, unknown>
  extractedVariables: Record<string, string | null>
}>()

// Test mode expiry times (per trigger)
const testModeExpiry = new Map<string, number>()

// Test mode duration: 5 minutes
const TEST_MODE_DURATION_MS = 5 * 60 * 1000

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

    if (action === 'start') {
      // Start test mode
      const expiryTime = Date.now() + TEST_MODE_DURATION_MS
      testModeExpiry.set(trigger.id, expiryTime)

      // Clear any previous test event
      testEvents.delete(trigger.id)

      return NextResponse.json({
        success: true,
        testMode: true,
        expiresAt: new Date(expiryTime).toISOString(),
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/${trigger.webhook_id}`,
        webhookSecret: trigger.webhook_secret,
        message: 'Test mode started. Trigger a webhook event from your CRM.',
      })
    } else if (action === 'stop') {
      // Stop test mode
      testModeExpiry.delete(trigger.id)
      testEvents.delete(trigger.id)

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

    // Check if test mode is active
    const expiry = testModeExpiry.get(trigger.id)
    const isTestModeActive = expiry && expiry > Date.now()

    if (!isTestModeActive) {
      // Clean up expired test mode
      testModeExpiry.delete(trigger.id)
      testEvents.delete(trigger.id)

      return NextResponse.json({
        testMode: false,
        hasEvent: false,
      })
    }

    // Check if we have a test event
    const testEvent = testEvents.get(trigger.id)

    return NextResponse.json({
      testMode: true,
      expiresAt: new Date(expiry).toISOString(),
      remainingSeconds: Math.round((expiry - Date.now()) / 1000),
      hasEvent: !!testEvent,
      event: testEvent || null,
    })
  } catch (error) {
    console.error('Test mode poll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Store a test event (called from webhook handler)
 */
export function storeTestEvent(
  triggerId: string,
  payload: Record<string, unknown>,
  extractedVariables: Record<string, string | null>
) {
  // Check if test mode is active for this trigger
  const expiry = testModeExpiry.get(triggerId)
  if (!expiry || expiry < Date.now()) {
    return false // Not in test mode
  }

  // Store the event
  testEvents.set(triggerId, {
    timestamp: Date.now(),
    payload,
    extractedVariables,
  })

  return true
}

/**
 * Check if trigger is in test mode
 */
export function isInTestMode(triggerId: string): boolean {
  const expiry = testModeExpiry.get(triggerId)
  return !!(expiry && expiry > Date.now())
}
