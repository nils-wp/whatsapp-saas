/**
 * Cron Endpoint: Poll CRM Triggers
 * Ruft periodisch CRM-APIs ab für Trigger ohne native Webhook-Unterstützung
 * Wie n8n: Polling alle 30-60 Sekunden für neue Events
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pollCRMEvents, extractContactFromEvent, getCRMApiConfig, matchesFilters as crmMatchesFilters, type CRMType, type CRMEvent } from '@/lib/integrations/crm-polling'
import { startNewConversation } from '@/lib/ai/message-handler'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Validate cron secret
function validateCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow if no secret configured (development)
  if (!cronSecret) {
    console.warn('[Cron] No CRON_SECRET configured - allowing request')
    return true
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  // Validate authorization
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const startTime = Date.now()
  const results: {
    triggerId: string
    triggerName: string
    eventsFound: number
    conversationsStarted: number
    errors: string[]
  }[] = []

  try {
    // Load all active triggers with polling enabled
    const { data: triggers, error: triggersError } = await supabase
      .from('triggers')
      .select(`
        *,
        tenant_integrations:tenants!inner(
          id,
          tenant_integrations(*)
        )
      `)
      .eq('is_active', true)
      .or('polling_enabled.eq.true,crm_webhook_status.is.null')
      .in('type', ['pipedrive', 'hubspot', 'monday', 'close', 'activecampaign'])

    if (triggersError) {
      console.error('[Cron] Failed to load triggers:', triggersError)
      return NextResponse.json({ error: 'Failed to load triggers' }, { status: 500 })
    }

    if (!triggers?.length) {
      return NextResponse.json({
        success: true,
        message: 'No polling triggers found',
        duration: Date.now() - startTime,
      })
    }

    console.log(`[Cron] Processing ${triggers.length} polling triggers`)

    // Process each trigger
    for (const trigger of triggers) {
      const triggerResult = {
        triggerId: trigger.id,
        triggerName: trigger.name,
        eventsFound: 0,
        conversationsStarted: 0,
        errors: [] as string[],
      }

      try {
        // Get integration config
        const tenantIntegrations = trigger.tenant_integrations?.tenant_integrations?.[0]
        if (!tenantIntegrations) {
          triggerResult.errors.push('No integration config found')
          results.push(triggerResult)
          continue
        }

        // Build polling config based on CRM type (use shared getCRMApiConfig for consistency)
        const crmType = trigger.type as CRMType
        const pollingConfig = getCRMApiConfig(crmType, tenantIntegrations)

        // Check if required config is present
        const hasRequiredConfig = (() => {
          switch (crmType) {
            case 'pipedrive': return !!pollingConfig.apiToken
            case 'hubspot': return !!pollingConfig.accessToken
            case 'close': return !!pollingConfig.apiKey
            case 'activecampaign': return !!pollingConfig.apiKey && !!pollingConfig.apiUrl
            case 'monday': return !!pollingConfig.apiToken && !!pollingConfig.boardId
            default: return false
          }
        })()

        if (!hasRequiredConfig) {
          triggerResult.errors.push(`Invalid or incomplete config for ${crmType}`)
          results.push(triggerResult)
          continue
        }

        // Determine last poll time (default: 2 minutes ago)
        const lastPolledAt = trigger.last_polled_at
          ? new Date(trigger.last_polled_at)
          : new Date(Date.now() - 2 * 60 * 1000)

        // Get trigger event and filters from external_config
        const externalConfig = (trigger.external_config as Record<string, unknown>) || {}
        const triggerEvent = (trigger.trigger_event || externalConfig.trigger_event || 'created') as string
        const filters = (externalConfig.event_filters || {}) as Record<string, string>

        // Poll for events
        const pollResult = await pollCRMEvents(
          crmType,
          pollingConfig,
          triggerEvent,
          lastPolledAt,
          filters
        )

        if (pollResult.error) {
          triggerResult.errors.push(pollResult.error)
        }

        triggerResult.eventsFound = pollResult.events.length

        // Process each event
        for (const event of pollResult.events) {
          try {
            const contact = extractContactFromEvent(event)

            // Skip if no phone number
            if (!contact.phone) {
              console.log(`[Cron] Skipping event ${event.id} - no phone number`)
              continue
            }

            // Check if event matches filters (use shared robust filter logic)
            if (!crmMatchesFilters(crmType, triggerEvent, event.data, filters)) {
              console.log(`[Cron] Skipping event ${event.id} - filter mismatch`)
              continue
            }

            // Check for test mode
            const isTestMode = await checkTestMode(supabase, trigger.id)

            if (isTestMode) {
              // Store event for test mode display
              await supabase.from('crm_webhook_events').insert({
                trigger_id: trigger.id,
                tenant_id: trigger.tenant_id,
                crm_type: crmType,
                event_type: triggerEvent,
                raw_payload: event.data,
                extracted_data: contact,
                is_test_event: true,
              })
              console.log(`[Cron] Test event stored for trigger ${trigger.id}`)
              continue
            }

            // Start conversation
            const conversationResult = await startNewConversation({
              tenantId: trigger.tenant_id,
              triggerId: trigger.id,
              phone: contact.phone,
              contactName: contact.fullName || undefined,
              externalLeadId: contact.externalId,
              triggerData: {
                ...event.data,
                first_name: contact.firstName,
                last_name: contact.lastName,
                vorname: contact.firstName,
                nachname: contact.lastName,
                email: contact.email,
                crm_type: crmType,
                crm_record_id: event.recordId,
              },
            })

            if (conversationResult.success) {
              triggerResult.conversationsStarted++

              // Update conversation with extracted name data
              if (conversationResult.conversationId) {
                await supabase.from('conversations').update({
                  contact_first_name: contact.firstName,
                  contact_last_name: contact.lastName,
                  crm_contact_id: contact.externalId,
                }).eq('id', conversationResult.conversationId)
              }

              // Store processed event
              await supabase.from('crm_webhook_events').insert({
                trigger_id: trigger.id,
                tenant_id: trigger.tenant_id,
                crm_type: crmType,
                event_type: triggerEvent,
                raw_payload: event.data,
                extracted_data: contact,
                is_test_event: false,
                processed_at: new Date().toISOString(),
              })
            } else {
              triggerResult.errors.push(`Failed to start conversation: ${conversationResult.error}`)
            }
          } catch (eventError) {
            triggerResult.errors.push(`Event processing error: ${String(eventError)}`)
          }
        }

        // Update last_polled_at
        await supabase.from('triggers').update({
          last_polled_at: new Date().toISOString(),
          polling_cursor: pollResult.newCursor,
        }).eq('id', trigger.id)

      } catch (triggerError) {
        triggerResult.errors.push(`Trigger error: ${String(triggerError)}`)
      }

      results.push(triggerResult)
    }

    const duration = Date.now() - startTime
    const totalEvents = results.reduce((sum, r) => sum + r.eventsFound, 0)
    const totalConversations = results.reduce((sum, r) => sum + r.conversationsStarted, 0)

    console.log(`[Cron] Completed in ${duration}ms: ${totalEvents} events, ${totalConversations} conversations`)

    return NextResponse.json({
      success: true,
      duration,
      triggersProcessed: results.length,
      totalEvents,
      totalConversations,
      results,
    })

  } catch (error) {
    console.error('[Cron] Polling error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      duration: Date.now() - startTime,
    }, { status: 500 })
  }
}

// Also allow POST for Vercel Cron
export async function POST(request: Request) {
  return GET(request)
}

/**
 * Check if trigger is in test mode
 */
async function checkTestMode(
  supabase: ReturnType<typeof getSupabase>,
  triggerId: string
): Promise<boolean> {
  // Check for recent test mode activation (within last 30 seconds)
  const { data } = await supabase
    .from('crm_webhook_events')
    .select('id')
    .eq('trigger_id', triggerId)
    .eq('is_test_event', true)
    .gte('created_at', new Date(Date.now() - 30 * 1000).toISOString())
    .limit(1)

  // If there's a recent test event, we're in test mode
  // This is a simple heuristic - could be improved with a dedicated flag
  return (data?.length || 0) > 0
}
