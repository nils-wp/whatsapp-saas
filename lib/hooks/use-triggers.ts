'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import type { Tables, InsertTables, UpdateTables } from '@/types/database'

type Trigger = Tables<'triggers'>
type InsertTrigger = InsertTables<'triggers'>
type UpdateTrigger = UpdateTables<'triggers'>

type TriggerWithRelations = Trigger & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string } | null
}

export function useTriggers() {
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useQuery({
    queryKey: ['triggers', currentTenant?.id],
    queryFn: async (): Promise<TriggerWithRelations[]> => {
      if (!currentTenant) return []

      const { data, error } = await supabase
        .from('triggers')
        .select('*, whatsapp_accounts(instance_name, phone_number), agents(name)')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as TriggerWithRelations[]
    },
    enabled: !!currentTenant,
  })
}

export function useTrigger(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['trigger', id],
    queryFn: async (): Promise<TriggerWithRelations> => {
      const { data, error } = await supabase
        .from('triggers')
        .select('*, whatsapp_accounts(instance_name, phone_number), agents(name)')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Trigger not found')
      return data as TriggerWithRelations
    },
    enabled: !!id,
  })
}

export function useCreateTrigger() {
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Omit<InsertTrigger, 'tenant_id'>): Promise<Trigger> => {
      if (!currentTenant) throw new Error('No tenant')

      const { data: trigger, error } = await supabase
        .from('triggers')
        .insert({ ...data, tenant_id: currentTenant.id })
        .select()
        .single()

      if (error) throw error
      if (!trigger) throw new Error('Failed to create trigger')
      return trigger as Trigger
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
    },
  })
}

export function useUpdateTrigger() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateTrigger & { id: string }) => {
      const { data: trigger, error } = await supabase
        .from('triggers')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return trigger
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
      queryClient.invalidateQueries({ queryKey: ['trigger', variables.id] })
    },
  })
}

export function useDeleteTrigger() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('triggers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
    },
  })
}
