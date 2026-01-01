'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'

interface TenantIntegrations {
  id: string
  tenant_id: string

  // ActiveCampaign
  activecampaign_enabled: boolean
  activecampaign_api_url: string | null
  activecampaign_api_key: string | null
  activecampaign_tag_booked: string | null
  activecampaign_tag_not_interested: string | null
  activecampaign_pipeline_id: string | null
  activecampaign_stage_new: string | null
  activecampaign_stage_booked: string | null

  // Close
  close_enabled: boolean
  close_api_key: string | null
  close_status_new: string | null
  close_status_contacted: string | null
  close_status_booked: string | null
  close_status_not_interested: string | null
  close_opportunity_pipeline_id: string | null

  // Webhooks
  webhook_enabled: boolean
  webhook_url: string | null
  webhook_secret: string | null
  webhook_events: string[]

  created_at: string
  updated_at: string
}

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
        // PGRST116 = not found, which is okay
        console.error('Error fetching integrations:', error)
      }

      return data as TenantIntegrations | null
    },
    enabled: !!currentTenant,
  })
}

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
        // Update
        const { data, error } = await supabase
          .from('tenant_integrations')
          .update(updates)
          .eq('tenant_id', currentTenant.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert
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
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}

export function useTestActiveCampaign() {
  return useMutation({
    mutationFn: async (config: { apiUrl: string; apiKey: string }) => {
      const response = await fetch('/api/integrations/test/activecampaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Connection failed')
      return data
    },
  })
}

export function useTestClose() {
  return useMutation({
    mutationFn: async (config: { apiKey: string }) => {
      const response = await fetch('/api/integrations/test/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Connection failed')
      return data
    },
  })
}
