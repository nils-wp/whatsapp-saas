'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import { toast } from 'sonner'

// ===========================================
// Types
// ===========================================

export interface TenantIntegrations {
  id: string
  tenant_id: string

  // Close
  close_enabled: boolean
  close_api_key: string | null
  close_status_new: string | null
  close_status_contacted: string | null
  close_status_qualified: string | null
  close_status_booked: string | null
  close_status_not_interested: string | null
  close_opportunity_pipeline_id: string | null

  // ActiveCampaign
  activecampaign_enabled: boolean
  activecampaign_api_url: string | null
  activecampaign_api_key: string | null
  activecampaign_tag_contacted: string | null
  activecampaign_tag_qualified: string | null
  activecampaign_tag_booked: string | null
  activecampaign_tag_not_interested: string | null
  activecampaign_pipeline_id: string | null
  activecampaign_stage_new: string | null
  activecampaign_stage_booked: string | null

  // Pipedrive
  pipedrive_enabled: boolean
  pipedrive_api_token: string | null
  pipedrive_pipeline_id: string | null
  pipedrive_stage_new: string | null
  pipedrive_stage_contacted: string | null
  pipedrive_stage_qualified: string | null
  pipedrive_stage_booked: string | null
  pipedrive_stage_lost: string | null

  // HubSpot
  hubspot_enabled: boolean
  hubspot_access_token: string | null
  hubspot_refresh_token: string | null
  hubspot_portal_id: string | null
  hubspot_pipeline_id: string | null
  hubspot_stage_new: string | null
  hubspot_stage_contacted: string | null
  hubspot_stage_qualified: string | null
  hubspot_stage_booked: string | null
  hubspot_stage_lost: string | null

  // Monday.com
  monday_enabled: boolean
  monday_api_token: string | null
  monday_board_id: string | null
  monday_phone_column_id: string | null
  monday_name_column_id: string | null
  monday_email_column_id: string | null
  monday_status_column_id: string | null
  monday_group_new: string | null
  monday_group_contacted: string | null
  monday_group_qualified: string | null
  monday_group_booked: string | null
  monday_group_lost: string | null

  // Webhooks
  webhook_enabled: boolean
  webhook_url: string | null
  webhook_secret: string | null
  webhook_events: string[] | null

  // Tracking
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null

  created_at: string
  updated_at: string
}

export type CRMType = 'close' | 'activecampaign' | 'pipedrive' | 'hubspot' | 'monday'

export interface CRMTestResult {
  success: boolean
  error?: string
  user?: { name?: string; email?: string }
  portalId?: string
}

// ===========================================
// Main Hooks
// ===========================================

/**
 * Lädt die Integrations-Konfiguration für den aktuellen Tenant
 */
export function useIntegrations() {
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useQuery({
    queryKey: ['integrations', currentTenant?.id],
    queryFn: async (): Promise<TenantIntegrations | null> => {
      if (!currentTenant) return null

      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching integrations:', error)
      }

      return data as TenantIntegrations | null
    },
    enabled: !!currentTenant,
  })
}

/**
 * Speichert die Integrations-Konfiguration
 */
export function useUpdateIntegrations() {
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (updates: Partial<TenantIntegrations>) => {
      if (!currentTenant) throw new Error('No tenant')

      // Prüfe ob Eintrag existiert
      const { data: existing } = await supabase
        .from('tenant_integrations')
        .select('id')
        .eq('tenant_id', currentTenant.id)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('tenant_integrations')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('tenant_id', currentTenant.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('tenant_integrations')
          .insert({ ...updates, tenant_id: currentTenant.id })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', currentTenant?.id] })
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`)
    },
  })
}

// ===========================================
// CRM Test Hooks
// ===========================================

/**
 * Testet die Close CRM Verbindung
 */
export function useTestClose() {
  return useMutation({
    mutationFn: async (config: { apiKey: string }): Promise<CRMTestResult> => {
      const response = await fetch('/api/integrations/test/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'Verbindung fehlgeschlagen' }
      }
      return data
    },
  })
}

/**
 * Testet die ActiveCampaign Verbindung
 */
export function useTestActiveCampaign() {
  return useMutation({
    mutationFn: async (config: { apiUrl: string; apiKey: string }): Promise<CRMTestResult> => {
      const response = await fetch('/api/integrations/test/activecampaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'Verbindung fehlgeschlagen' }
      }
      return data
    },
  })
}

/**
 * Testet die Pipedrive Verbindung
 */
export function useTestPipedrive() {
  return useMutation({
    mutationFn: async (config: { apiToken: string }): Promise<CRMTestResult> => {
      const response = await fetch('/api/integrations/test/pipedrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'Verbindung fehlgeschlagen' }
      }
      return data
    },
  })
}

/**
 * Testet die HubSpot Verbindung
 */
export function useTestHubSpot() {
  return useMutation({
    mutationFn: async (config: { accessToken: string }): Promise<CRMTestResult> => {
      const response = await fetch('/api/integrations/test/hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'Verbindung fehlgeschlagen' }
      }
      return data
    },
  })
}

/**
 * Testet die Monday.com Verbindung
 */
export function useTestMonday() {
  return useMutation({
    mutationFn: async (config: { apiToken: string }): Promise<CRMTestResult> => {
      const response = await fetch('/api/integrations/test/monday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'Verbindung fehlgeschlagen' }
      }
      return data
    },
  })
}

// ===========================================
// CRM Metadata Hooks (Pipelines, Stages, etc.)
// ===========================================

/**
 * Lädt Close Lead Statuses, Opportunity Statuses, Custom Activity Types und Pipelines
 */
export function useCloseStatuses(apiKey: string | null) {
  return useQuery({
    queryKey: ['close-statuses', apiKey],
    queryFn: async () => {
      if (!apiKey) return { leadStatuses: [], opportunityStatuses: [], customActivityTypes: [], pipelines: [] }

      const response = await fetch('/api/integrations/close/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) return { leadStatuses: [], opportunityStatuses: [], customActivityTypes: [], pipelines: [] }

      return response.json() as Promise<{
        leadStatuses: Array<{ id: string; label: string }>
        opportunityStatuses: Array<{ id: string; label: string; type: string }>
        customActivityTypes: Array<{ id: string; name: string }>
        pipelines: Array<{ id: string; name: string }>
      }>
    },
    enabled: !!apiKey,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Lädt Pipedrive Pipelines und Stages
 */
export function usePipedrivePipelines(apiToken: string | null) {
  return useQuery({
    queryKey: ['pipedrive-pipelines', apiToken],
    queryFn: async () => {
      if (!apiToken) return { pipelines: [], stages: [] }

      const response = await fetch('/api/integrations/pipedrive/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken }),
      })

      if (!response.ok) return { pipelines: [], stages: [] }

      return response.json() as Promise<{
        pipelines: Array<{ id: string; name: string }>
        stages: Array<{ id: string; name: string; pipeline_id: string }>
      }>
    },
    enabled: !!apiToken,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Lädt HubSpot Pipelines und Stages
 */
export function useHubSpotPipelines(accessToken: string | null) {
  return useQuery({
    queryKey: ['hubspot-pipelines', accessToken],
    queryFn: async () => {
      if (!accessToken) return { pipelines: [], stages: [] }

      const response = await fetch('/api/integrations/hubspot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })

      if (!response.ok) return { pipelines: [], stages: [] }

      return response.json() as Promise<{
        pipelines: Array<{ id: string; label: string }>
        stages: Array<{ id: string; label: string; pipeline_id: string }>
      }>
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Lädt Monday.com Boards, Gruppen und Spalten
 */
export function useMondayBoards(apiToken: string | null) {
  return useQuery({
    queryKey: ['monday-boards', apiToken],
    queryFn: async () => {
      if (!apiToken) return { boards: [] }

      const response = await fetch('/api/integrations/monday/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken }),
      })

      if (!response.ok) return { boards: [] }

      return response.json() as Promise<{
        boards: Array<{ id: string; name: string }>
      }>
    },
    enabled: !!apiToken,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Lädt Monday.com Gruppen und Spalten für ein Board
 */
export function useMondayBoardDetails(apiToken: string | null, boardId: string | null) {
  return useQuery({
    queryKey: ['monday-board-details', apiToken, boardId],
    queryFn: async () => {
      if (!apiToken || !boardId) return { groups: [], columns: [] }

      const response = await fetch('/api/integrations/monday/board-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken, boardId }),
      })

      if (!response.ok) return { groups: [], columns: [] }

      return response.json() as Promise<{
        groups: Array<{ id: string; title: string }>
        columns: Array<{ id: string; title: string; type: string }>
      }>
    },
    enabled: !!apiToken && !!boardId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Lädt ActiveCampaign Metadata (Listen, Pipelines, Stages, Forms, Automations, Campaigns, Tags)
 */
export function useActiveCampaignMetadata(apiUrl: string | null, apiKey: string | null) {
  return useQuery({
    queryKey: ['activecampaign-metadata', apiUrl, apiKey],
    queryFn: async () => {
      if (!apiUrl || !apiKey) return null

      const response = await fetch('/api/integrations/activecampaign/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl, apiKey }),
      })

      if (!response.ok) return null

      return response.json() as Promise<{
        lists: Array<{ id: string; name: string }>
        pipelines: Array<{ id: string; title: string }>
        stages: Array<{ id: string; title: string; groupId: string }>
        forms: Array<{ id: string; name: string }>
        automations: Array<{ id: string; name: string }>
        campaigns: Array<{ id: string; name: string }>
        tags: Array<{ id: string; tag: string }>
      }>
    },
    enabled: !!apiUrl && !!apiKey,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Lädt HubSpot Metadata (Pipelines, Stages, Forms, Contact Properties, Ticket Pipelines)
 */
export function useHubSpotMetadata(accessToken: string | null) {
  return useQuery({
    queryKey: ['hubspot-metadata', accessToken],
    queryFn: async () => {
      if (!accessToken) return null

      const response = await fetch('/api/integrations/hubspot/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })

      if (!response.ok) return null

      return response.json() as Promise<{
        pipelines: Array<{ id: string; label: string }>
        stages: Array<{ id: string; label: string; pipelineId: string; pipelineLabel: string }>
        forms: Array<{ id: string; name: string }>
        contactProperties: Array<{ name: string; label: string; type: string }>
        ticketPipelines: Array<{ id: string; label: string }>
        ticketStages: Array<{ id: string; label: string; pipelineId: string; pipelineLabel: string }>
      }>
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })
}

// ===========================================
// Helper Hook für einzelne CRM-Verbindung
// ===========================================

export function useCRMConnection(crm: CRMType) {
  const { data: integrations, isLoading } = useIntegrations()
  const updateIntegrations = useUpdateIntegrations()

  // Test hooks
  const testClose = useTestClose()
  const testActiveCampaign = useTestActiveCampaign()
  const testPipedrive = useTestPipedrive()
  const testHubSpot = useTestHubSpot()
  const testMonday = useTestMonday()

  const testHooks = {
    close: testClose,
    activecampaign: testActiveCampaign,
    pipedrive: testPipedrive,
    hubspot: testHubSpot,
    monday: testMonday,
  } as const

  const enabledKey = `${crm}_enabled` as keyof TenantIntegrations
  const isEnabled = (integrations?.[enabledKey] as boolean) ?? false

  const connect = async (config: Record<string, string>): Promise<CRMTestResult> => {
    const testHook = testHooks[crm]

    // Erst testen
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await testHook.mutateAsync(config as any)

    if (result.success) {
      // Dann speichern
      const updates: Partial<TenantIntegrations> = {
        [enabledKey]: true,
      }

      // Config-Felder mit crm_ Prefix speichern
      Object.entries(config).forEach(([key, value]) => {
        const dbKey = `${crm}_${key}` as keyof TenantIntegrations
        ;(updates as Record<string, unknown>)[dbKey] = value
      })

      // HubSpot Portal ID speichern
      if (crm === 'hubspot' && result.portalId) {
        updates.hubspot_portal_id = result.portalId
      }

      await updateIntegrations.mutateAsync(updates)
      toast.success(`${crm.charAt(0).toUpperCase() + crm.slice(1)} erfolgreich verbunden`)
    }

    return result
  }

  const disconnect = async () => {
    const updates: Partial<TenantIntegrations> = {
      [enabledKey]: false,
    }
    await updateIntegrations.mutateAsync(updates)
    toast.success(`${crm.charAt(0).toUpperCase() + crm.slice(1)} getrennt`)
  }

  const saveSettings = async (settings: Record<string, string | null>) => {
    const updates: Partial<TenantIntegrations> = {}

    Object.entries(settings).forEach(([key, value]) => {
      const dbKey = `${crm}_${key}` as keyof TenantIntegrations
      ;(updates as Record<string, unknown>)[dbKey] = value
    })

    await updateIntegrations.mutateAsync(updates)
    toast.success('Einstellungen gespeichert')
  }

  return {
    isEnabled,
    isLoading,
    integrations,
    connect,
    disconnect,
    saveSettings,
    updateIntegrations,
    testMutation: testHooks[crm],
  }
}
