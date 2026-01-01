'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import type { Tables, InsertTables, UpdateTables } from '@/types/database'

type Agent = Tables<'agents'>
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
        .select('*')
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
        .select('*')
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
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Omit<InsertAgent, 'tenant_id'>): Promise<Agent> => {
      if (!currentTenant) throw new Error('No tenant')

      const { data: agent, error } = await supabase
        .from('agents')
        .insert({ ...data, tenant_id: currentTenant.id })
        .select()
        .single()

      if (error) throw error
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
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAgent & { id: string }) => {
      const { data: agent, error } = await supabase
        .from('agents')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
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
