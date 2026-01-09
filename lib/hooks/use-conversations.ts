'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import type { Tables, UpdateTables } from '@/types/database'

type Conversation = Tables<'conversations'> & {
  updated_by?: string | null
}
type Message = Tables<'messages'> & {
  sent_by?: string | null
}

type ConversationWithRelations = Conversation & {
  whatsapp_accounts?: {
    instance_name: string | null
    phone_number: string | null
  } | null
  agents?: {
    name: string
    agent_name: string | null
  } | null
}

export function useConversations(filters?: {
  status?: string
  agentId?: string
  accountId?: string
}) {
  const { currentTenant } = useTenant()
  const supabase = createClient()

  return useQuery({
    queryKey: ['conversations', currentTenant?.id, filters],
    queryFn: async () => {
      if (!currentTenant) return []

      let query = supabase
        .from('conversations')
        .select('*, whatsapp_accounts(instance_name, phone_number), agents(name)')
        .eq('tenant_id', currentTenant.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId)
      }
      if (filters?.accountId) {
        query = query.eq('whatsapp_account_id', filters.accountId)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      return (data || []) as ConversationWithRelations[]
    },
    enabled: !!currentTenant,
  })
}

export function useConversation(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async (): Promise<ConversationWithRelations> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, whatsapp_accounts(instance_name, phone_number), agents(name, agent_name)')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Conversation not found')
      return data as ConversationWithRelations
    },
    enabled: !!id,
  })
}

export function useMessages(conversationId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Message[]
    },
    enabled: !!conversationId,
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()
  const { user } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UpdateTables<'conversations'> & { id: string }) => {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .update({
          ...data,
          updated_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return conversation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.id] })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete conversation')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useCleanupOrphanedConversations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/conversations/cleanup', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cleanup conversations')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { currentTenant, user } = useTenant()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string
      content: string
    }) => {
      if (!currentTenant) throw new Error('No tenant')

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          tenant_id: currentTenant.id,
          conversation_id: conversationId,
          direction: 'outbound',
          sender_type: 'human',
          content,
          status: 'pending',
          sent_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_agent_message_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', conversationId)

      return message
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
