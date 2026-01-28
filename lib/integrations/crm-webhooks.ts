/**
 * CRM Webhook Registration Library
 * Native Webhook-Registrierung für CRMs mit Webhook-API-Unterstützung
 * - Pipedrive: POST /webhooks
 * - Monday: GraphQL create_webhook mutation
 */

export interface CRMWebhookResult {
  success: boolean
  webhookId?: string
  error?: string
  requiresPolling?: boolean
}

export type CRMType = 'pipedrive' | 'hubspot' | 'monday' | 'close' | 'activecampaign'

// ===========================================
// Pipedrive Webhook Registration
// Docs: https://developers.pipedrive.com/docs/api/v1/Webhooks
// ===========================================

export async function registerPipedriveWebhook(
  apiToken: string,
  targetUrl: string,
  eventAction: string,
  eventObject: string
): Promise<CRMWebhookResult> {
  try {
    const response = await fetch(
      `https://api.pipedrive.com/v1/webhooks?api_token=${apiToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_url: targetUrl,
          event_action: eventAction, // 'added', 'updated', 'deleted', '*'
          event_object: eventObject, // 'deal', 'person', 'activity', 'organization', etc.
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Pipedrive API error: ${response.status}`,
      }
    }

    return {
      success: true,
      webhookId: String(data.data?.id),
    }
  } catch (error) {
    console.error('[CRM Webhooks] Pipedrive registration error:', error)
    return {
      success: false,
      error: String(error),
    }
  }
}

export async function deletePipedriveWebhook(
  apiToken: string,
  webhookId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.pipedrive.com/v1/webhooks/${webhookId}?api_token=${apiToken}`,
      { method: 'DELETE' }
    )

    return response.ok
  } catch (error) {
    console.error('[CRM Webhooks] Pipedrive delete error:', error)
    return false
  }
}

// Map trigger events to Pipedrive webhook params
export function mapPipedriveTriggerEvent(triggerEvent: string): {
  eventAction: string
  eventObject: string
} {
  const mapping: Record<string, { eventAction: string; eventObject: string }> = {
    'deal_created': { eventAction: 'added', eventObject: 'deal' },
    'deal_updated': { eventAction: 'updated', eventObject: 'deal' },
    'deal_stage_changed': { eventAction: 'updated', eventObject: 'deal' },
    'deal_deleted': { eventAction: 'deleted', eventObject: 'deal' },
    'person_created': { eventAction: 'added', eventObject: 'person' },
    'person_updated': { eventAction: 'updated', eventObject: 'person' },
    'activity_created': { eventAction: 'added', eventObject: 'activity' },
    'activity_updated': { eventAction: 'updated', eventObject: 'activity' },
    'activity_completed': { eventAction: 'updated', eventObject: 'activity' },
    'note_created': { eventAction: 'added', eventObject: 'note' },
  }

  return mapping[triggerEvent] || { eventAction: '*', eventObject: 'deal' }
}

// ===========================================
// Monday.com Webhook Registration
// Docs: https://developer.monday.com/api-reference/reference/webhooks
// ===========================================

export async function registerMondayWebhook(
  apiToken: string,
  boardId: string,
  targetUrl: string,
  event: string
): Promise<CRMWebhookResult> {
  try {
    const query = `
      mutation {
        create_webhook(
          board_id: ${boardId}
          url: "${targetUrl}"
          event: ${event}
        ) {
          id
          board_id
        }
      }
    `

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()

    if (data.errors?.length) {
      return {
        success: false,
        error: data.errors[0]?.message || 'Monday.com GraphQL error',
      }
    }

    const webhookId = data.data?.create_webhook?.id
    if (!webhookId) {
      return {
        success: false,
        error: 'No webhook ID returned',
      }
    }

    return {
      success: true,
      webhookId: String(webhookId),
    }
  } catch (error) {
    console.error('[CRM Webhooks] Monday registration error:', error)
    return {
      success: false,
      error: String(error),
    }
  }
}

export async function deleteMondayWebhook(
  apiToken: string,
  webhookId: string
): Promise<boolean> {
  try {
    const query = `
      mutation {
        delete_webhook(id: ${webhookId}) {
          id
        }
      }
    `

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()
    return !data.errors?.length
  } catch (error) {
    console.error('[CRM Webhooks] Monday delete error:', error)
    return false
  }
}

// Map trigger events to Monday webhook event types
export function mapMondayTriggerEvent(triggerEvent: string): string {
  const mapping: Record<string, string> = {
    'item_created': 'create_item',
    'item_updated': 'change_column_value',
    'item_moved_to_group': 'move_item_to_group',
    'column_changed': 'change_column_value',
    'status_changed': 'change_status_column_value',
    'subitem_created': 'create_subitem',
    'item_deleted': 'delete_item',
  }

  return mapping[triggerEvent] || 'change_column_value'
}

// ===========================================
// Unified Registration Function
// ===========================================

export interface WebhookRegistrationConfig {
  crmType: CRMType
  triggerId: string
  triggerEvent: string
  // CRM-specific config
  apiToken?: string
  boardId?: string
  pipelineId?: string
}

export async function registerCRMWebhook(
  config: WebhookRegistrationConfig,
  targetBaseUrl: string
): Promise<CRMWebhookResult> {
  const webhookUrl = `${targetBaseUrl}/api/crm-webhook/${config.crmType}?triggerId=${config.triggerId}`

  switch (config.crmType) {
    case 'pipedrive': {
      if (!config.apiToken) {
        return { success: false, error: 'Pipedrive API token required' }
      }
      const { eventAction, eventObject } = mapPipedriveTriggerEvent(config.triggerEvent)
      return registerPipedriveWebhook(config.apiToken, webhookUrl, eventAction, eventObject)
    }

    case 'monday': {
      if (!config.apiToken || !config.boardId) {
        return { success: false, error: 'Monday.com API token and board ID required' }
      }
      const mondayEvent = mapMondayTriggerEvent(config.triggerEvent)
      return registerMondayWebhook(config.apiToken, config.boardId, webhookUrl, mondayEvent)
    }

    // These CRMs don't support native webhooks - use polling
    case 'hubspot':
    case 'close':
    case 'activecampaign':
      return {
        success: true,
        requiresPolling: true,
      }

    default:
      return {
        success: false,
        error: `Unsupported CRM type: ${config.crmType}`,
      }
  }
}

export async function deleteCRMWebhook(
  crmType: CRMType,
  webhookId: string,
  apiToken: string
): Promise<boolean> {
  switch (crmType) {
    case 'pipedrive':
      return deletePipedriveWebhook(apiToken, webhookId)

    case 'monday':
      return deleteMondayWebhook(apiToken, webhookId)

    default:
      return true // No webhook to delete for polling-based CRMs
  }
}

// ===========================================
// CRM Capability Check
// ===========================================

export interface CRMCapabilities {
  supportsNativeWebhooks: boolean
  supportsPolling: boolean
  webhookEvents: string[]
  requiredConfig: string[]
}

export function getCRMCapabilities(crmType: CRMType): CRMCapabilities {
  switch (crmType) {
    case 'pipedrive':
      return {
        supportsNativeWebhooks: true,
        supportsPolling: true,
        webhookEvents: [
          'deal_created',
          'deal_updated',
          'deal_stage_changed',
          'person_created',
          'person_updated',
          'activity_created',
          'activity_completed',
        ],
        requiredConfig: ['apiToken'],
      }

    case 'monday':
      return {
        supportsNativeWebhooks: true,
        supportsPolling: true,
        webhookEvents: [
          'item_created',
          'item_updated',
          'item_moved_to_group',
          'status_changed',
          'column_changed',
        ],
        requiredConfig: ['apiToken', 'boardId'],
      }

    case 'hubspot':
      return {
        supportsNativeWebhooks: false, // Requires app marketplace registration
        supportsPolling: true,
        webhookEvents: [
          'contact_created',
          'contact_updated',
          'deal_created',
          'deal_updated',
          'deal_stage_changed',
          'form_submitted',
        ],
        requiredConfig: ['accessToken'],
      }

    case 'close':
      return {
        supportsNativeWebhooks: false, // Webhooks require enterprise plan
        supportsPolling: true,
        webhookEvents: [
          'lead_created',
          'lead_updated',
          'lead_status_changed',
          'opportunity_created',
          'opportunity_updated',
        ],
        requiredConfig: ['apiKey'],
      }

    case 'activecampaign':
      return {
        supportsNativeWebhooks: false, // Webhooks are limited and require setup in AC
        supportsPolling: true,
        webhookEvents: [
          'contact_created',
          'contact_updated',
          'deal_created',
          'deal_updated',
          'deal_stage_changed',
          'contact_tag_added',
          'contact_tag_removed',
        ],
        requiredConfig: ['apiKey', 'apiUrl'],
      }

    default:
      return {
        supportsNativeWebhooks: false,
        supportsPolling: false,
        webhookEvents: [],
        requiredConfig: [],
      }
  }
}

// ===========================================
// Helper: Get available trigger events for UI
// ===========================================

export interface TriggerEventOption {
  value: string
  label: string
  description: string
}

export function getCRMTriggerEvents(crmType: CRMType): TriggerEventOption[] {
  switch (crmType) {
    case 'pipedrive':
      return [
        { value: 'deal_created', label: 'Deal Created', description: 'Wenn ein neuer Deal erstellt wird' },
        { value: 'deal_updated', label: 'Deal Updated', description: 'Wenn ein Deal aktualisiert wird' },
        { value: 'deal_stage_changed', label: 'Deal Stage Changed', description: 'Wenn ein Deal die Stage wechselt' },
        { value: 'person_created', label: 'Person Created', description: 'Wenn ein neuer Kontakt erstellt wird' },
        { value: 'person_updated', label: 'Person Updated', description: 'Wenn ein Kontakt aktualisiert wird' },
        { value: 'activity_completed', label: 'Activity Completed', description: 'Wenn eine Aktivität abgeschlossen wird' },
      ]

    case 'monday':
      return [
        { value: 'item_created', label: 'Item Created', description: 'Wenn ein neues Item erstellt wird' },
        { value: 'item_updated', label: 'Item Updated', description: 'Wenn ein Item aktualisiert wird' },
        { value: 'item_moved_to_group', label: 'Item Moved to Group', description: 'Wenn ein Item in eine andere Gruppe verschoben wird' },
        { value: 'status_changed', label: 'Status Changed', description: 'Wenn sich der Status ändert' },
        { value: 'column_changed', label: 'Column Changed', description: 'Wenn sich ein Spaltenwert ändert' },
      ]

    case 'hubspot':
      return [
        { value: 'contact_created', label: 'Contact Created', description: 'Wenn ein neuer Kontakt erstellt wird' },
        { value: 'contact_updated', label: 'Contact Updated', description: 'Wenn ein Kontakt aktualisiert wird' },
        { value: 'deal_created', label: 'Deal Created', description: 'Wenn ein neuer Deal erstellt wird' },
        { value: 'deal_stage_changed', label: 'Deal Stage Changed', description: 'Wenn ein Deal die Stage wechselt' },
        { value: 'form_submitted', label: 'Form Submitted', description: 'Wenn ein Formular ausgefüllt wird' },
      ]

    case 'close':
      return [
        { value: 'lead_created', label: 'Lead Created', description: 'Wenn ein neuer Lead erstellt wird' },
        { value: 'lead_updated', label: 'Lead Updated', description: 'Wenn ein Lead aktualisiert wird' },
        { value: 'lead_status_changed', label: 'Lead Status Changed', description: 'Wenn sich der Lead-Status ändert' },
        { value: 'opportunity_created', label: 'Opportunity Created', description: 'Wenn eine neue Opportunity erstellt wird' },
      ]

    case 'activecampaign':
      return [
        { value: 'contact_created', label: 'Contact Created', description: 'Wenn ein neuer Kontakt erstellt wird' },
        { value: 'contact_updated', label: 'Contact Updated', description: 'Wenn ein Kontakt aktualisiert wird' },
        { value: 'deal_created', label: 'Deal Created', description: 'Wenn ein neuer Deal erstellt wird' },
        { value: 'deal_stage_changed', label: 'Deal Stage Changed', description: 'Wenn ein Deal die Stage wechselt' },
        { value: 'contact_tag_added', label: 'Tag Added', description: 'Wenn ein Tag hinzugefügt wird' },
        { value: 'contact_tag_removed', label: 'Tag Removed', description: 'Wenn ein Tag entfernt wird' },
      ]

    default:
      return []
  }
}
