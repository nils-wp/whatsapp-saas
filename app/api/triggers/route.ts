/**
 * Triggers API Route
 * Erstellt Trigger mit automatischer Webhook-Registrierung für native CRMs
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import {
  registerCRMWebhook,
  deleteCRMWebhook,
  getCRMCapabilities,
  type CRMType
} from '@/lib/integrations/crm-webhooks'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

const CRM_TYPES = ['pipedrive', 'hubspot', 'monday', 'close', 'activecampaign']

export async function POST(request: Request) {
  try {
    const authSupabase = await getAuthSupabase()
    const serviceSupabase = getServiceSupabase()

    // Get current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenant_id, type, trigger_event, external_config, ...triggerData } = body

    // Validate tenant access
    const { data: membership } = await serviceSupabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Tenant access denied' }, { status: 403 })
    }

    const isCRMType = CRM_TYPES.includes(type)

    // Create trigger
    const { data: trigger, error: createError } = await serviceSupabase
      .from('triggers')
      .insert({
        ...triggerData,
        tenant_id,
        type,
        trigger_event: isCRMType ? trigger_event : null,
        external_config: external_config || {},
        crm_webhook_status: isCRMType ? 'pending' : null,
        polling_enabled: false,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (createError || !trigger) {
      console.error('Failed to create trigger:', createError)
      return NextResponse.json({
        error: 'Failed to create trigger',
        details: createError?.message
      }, { status: 500 })
    }

    // For CRM types, register webhook or enable polling
    if (isCRMType) {
      const crmType = type as CRMType
      const capabilities = getCRMCapabilities(crmType)

      // Get integration config
      const { data: integrations } = await serviceSupabase
        .from('tenant_integrations')
        .select('*')
        .eq('tenant_id', tenant_id)
        .single()

      if (!integrations) {
        // Update trigger status - no integration configured
        await serviceSupabase.from('triggers').update({
          crm_webhook_status: 'failed',
          crm_webhook_error: 'CRM integration not configured',
        }).eq('id', trigger.id)

        return NextResponse.json({
          ...trigger,
          crm_webhook_status: 'failed',
          crm_webhook_error: 'CRM integration not configured',
        })
      }

      // Get API credentials based on CRM type
      const apiConfig = getCRMApiConfig(crmType, integrations)

      if (capabilities.supportsNativeWebhooks && apiConfig.apiToken) {
        // Try native webhook registration
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'

        const result = await registerCRMWebhook(
          {
            crmType,
            triggerId: trigger.id,
            triggerEvent: trigger_event || 'created',
            apiToken: apiConfig.apiToken,
            boardId: apiConfig.boardId,
          },
          appUrl
        )

        if (result.success && !result.requiresPolling) {
          await serviceSupabase.from('triggers').update({
            crm_webhook_id: result.webhookId,
            crm_webhook_status: 'active',
            crm_webhook_registered_at: new Date().toISOString(),
            polling_enabled: false,
          }).eq('id', trigger.id)

          return NextResponse.json({
            ...trigger,
            crm_webhook_id: result.webhookId,
            crm_webhook_status: 'active',
          })
        } else if (result.requiresPolling) {
          // Fallback to polling
          await serviceSupabase.from('triggers').update({
            crm_webhook_status: 'not_supported',
            polling_enabled: true,
            last_polled_at: new Date().toISOString(),
          }).eq('id', trigger.id)

          return NextResponse.json({
            ...trigger,
            crm_webhook_status: 'not_supported',
            polling_enabled: true,
          })
        } else {
          // Registration failed
          await serviceSupabase.from('triggers').update({
            crm_webhook_status: 'failed',
            crm_webhook_error: result.error,
            polling_enabled: true, // Fallback to polling
          }).eq('id', trigger.id)

          return NextResponse.json({
            ...trigger,
            crm_webhook_status: 'failed',
            crm_webhook_error: result.error,
            polling_enabled: true,
          })
        }
      } else {
        // No native webhook support - use polling
        await serviceSupabase.from('triggers').update({
          crm_webhook_status: 'not_supported',
          polling_enabled: true,
          last_polled_at: new Date().toISOString(),
        }).eq('id', trigger.id)

        return NextResponse.json({
          ...trigger,
          crm_webhook_status: 'not_supported',
          polling_enabled: true,
        })
      }
    }

    return NextResponse.json(trigger)

  } catch (error) {
    console.error('Trigger creation error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: String(error)
    }, { status: 500 })
  }
}

// Delete trigger and unregister webhook
export async function DELETE(request: Request) {
  try {
    const authSupabase = await getAuthSupabase()
    const serviceSupabase = getServiceSupabase()

    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const triggerId = searchParams.get('id')

    if (!triggerId) {
      return NextResponse.json({ error: 'Trigger ID required' }, { status: 400 })
    }

    // Get trigger
    const { data: trigger } = await serviceSupabase
      .from('triggers')
      .select('*, tenants!inner(id)')
      .eq('id', triggerId)
      .single()

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    // Verify access
    const { data: membership } = await serviceSupabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('tenant_id', trigger.tenant_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If CRM trigger with registered webhook, unregister it
    if (trigger.crm_webhook_id && CRM_TYPES.includes(trigger.type)) {
      const crmType = trigger.type as CRMType

      const { data: integrations } = await serviceSupabase
        .from('tenant_integrations')
        .select('*')
        .eq('tenant_id', trigger.tenant_id)
        .single()

      if (integrations) {
        const apiConfig = getCRMApiConfig(crmType, integrations)
        if (apiConfig.apiToken) {
          await deleteCRMWebhook(crmType, trigger.crm_webhook_id, apiConfig.apiToken)
        }
      }
    }

    // Delete trigger
    const { error: deleteError } = await serviceSupabase
      .from('triggers')
      .delete()
      .eq('id', triggerId)

    if (deleteError) {
      return NextResponse.json({
        error: 'Failed to delete trigger',
        details: deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Trigger deletion error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: String(error)
    }, { status: 500 })
  }
}

/**
 * Get CRM API config from integration settings
 */
function getCRMApiConfig(
  crmType: CRMType,
  integrations: Record<string, unknown>
): { apiToken?: string; boardId?: string } {
  switch (crmType) {
    case 'pipedrive':
      return {
        apiToken: integrations.pipedrive_api_token as string | undefined,
      }

    case 'monday':
      return {
        apiToken: integrations.monday_api_token as string | undefined,
        boardId: integrations.monday_board_id as string | undefined,
      }

    case 'hubspot':
      return {
        apiToken: integrations.hubspot_access_token as string | undefined,
      }

    case 'close':
      return {
        apiToken: integrations.close_api_key as string | undefined,
      }

    case 'activecampaign':
      return {
        apiToken: integrations.activecampaign_api_key as string | undefined,
      }

    default:
      return {}
  }
}
