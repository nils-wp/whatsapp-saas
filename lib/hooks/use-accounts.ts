'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import type { Tables, InsertTables, UpdateTables } from '@/types/database'

type WhatsAppAccount = Tables<'whatsapp_accounts'>
type InsertAccount = InsertTables<'whatsapp_accounts'>
type UpdateAccount = UpdateTables<'whatsapp_accounts'>

export function useAccounts() {
  const { currentTenant } = useTenant()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const hasSynced = useRef(false)

  const query = useQuery({
    queryKey: ['accounts', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return []

      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as WhatsAppAccount[]
    },
    enabled: !!currentTenant,
  })

  // Sync status from Evolution API when accounts are loaded (only once per mount)
  useEffect(() => {
    async function syncStatuses() {
      if (!query.data || query.data.length === 0 || hasSynced.current) return

      hasSynced.current = true
      const accountIds = query.data.map(a => a.id)

      try {
        const response = await fetch('/api/accounts/sync-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountIds }),
        })

        const result = await response.json()

        // If any statuses were updated, refetch accounts
        if (result.updates && result.updates.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['accounts'] })
        }
      } catch (err) {
        console.error('Error syncing account statuses:', err)
      }
    }

    syncStatuses()
  }, [query.data, queryClient])

  return query
}

export function useAccount(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as WhatsAppAccount
    },
    enabled: !!id,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Omit<InsertAccount, 'tenant_id'>): Promise<WhatsAppAccount> => {
      if (!currentTenant) throw new Error('No tenant')

      const { data: account, error } = await supabase
        .from('whatsapp_accounts')
        .insert({ ...data, tenant_id: currentTenant.id })
        .select()
        .single()

      if (error) throw error
      if (!account) throw new Error('Failed to create account')
      return account as WhatsAppAccount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAccount & { id: string }) => {
      const { data: account, error } = await supabase
        .from('whatsapp_accounts')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return account
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] })
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Use API route to delete both from Evolution API and database
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useSyncAccountStatuses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (accountIds: string[]) => {
      const response = await fetch('/api/accounts/sync-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sync statuses')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
