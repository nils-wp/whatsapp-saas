'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import type { Tables, InsertTables, UpdateTables } from '@/types/database'

type Agent = Tables<'agents'> & {
  created_by?: string | null
  updated_by?: string | null
  whatsapp_account_id?: string | null
  whatsapp_accounts?: {
    phone_number: string | null
    instance_name: string | null
  } | null
}
type InsertAgent = InsertTables<'agents'>
type UpdateAgent = UpdateTables<'agents'>

export function useAgents() {
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useQuery({
    queryKey: ['agents', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return []

      const { data, error } = await supabase
        .from('agents')
        .select('*, whatsapp_accounts(phone_number, instance_name)')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Agent[]
    },
    enabled: !!currentTenant,
  })
}

export function useAgent(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*, whatsapp_accounts(phone_number, instance_name)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Agent
    },
    enabled: !!id,
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  const { currentTenant, user } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Omit<InsertAgent, 'tenant_id'> & { whatsapp_account_id?: string | null }): Promise<Agent> => {
      if (!currentTenant) throw new Error('No tenant')

      // Build insert data - only add created_by/updated_by if they're likely to exist
      const insertData: Record<string, unknown> = {
        ...data,
        tenant_id: currentTenant.id,
      }

      // Try to add tracking fields (will be ignored if columns don't exist)
      if (user?.id) {
        insertData.created_by = user.id
        insertData.updated_by = user.id
      }

      const { data: agent, error } = await supabase
        .from('agents')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        // If error is about unknown columns, retry without tracking fields
        if (error.message?.includes('created_by') || error.message?.includes('updated_by')) {
          const { data: agentRetry, error: retryError } = await supabase
            .from('agents')
            .insert({
              ...data,
              tenant_id: currentTenant.id,
            })
            .select()
            .single()

          if (retryError) throw retryError
          if (!agentRetry) throw new Error('Failed to create agent')
          return agentRetry as Agent
        }
        throw error
      }
      if (!agent) throw new Error('Failed to create agent')
      return agent as Agent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  const { user } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAgent & { id: string }) => {
      const updateData: Record<string, unknown> = { ...data }
      if (user?.id) {
        updateData.updated_by = user.id
      }

      const { data: agent, error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        // If error is about unknown column, retry without it
        if (error.message?.includes('updated_by')) {
          const { data: agentRetry, error: retryError } = await supabase
            .from('agents')
            .update(data)
            .eq('id', id)
            .select()
            .single()

          if (retryError) throw retryError
          return agentRetry
        }
        throw error
      }
      return agent
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agent', variables.id] })
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
