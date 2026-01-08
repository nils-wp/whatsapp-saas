'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import type { Tables } from '@/types/database'

type MessageQueue = Tables<'message_queue'>
type Conversation = Tables<'conversations'>

interface QueueItemWithConversation extends MessageQueue {
  conversation: Pick<Conversation, 'id' | 'contact_name' | 'contact_phone'> | null
}

export function useMessageQueue(type?: 'escalated' | 'outside_hours') {
  const { currentTenant } = useTenant()

  return useQuery({
    queryKey: ['message-queue', currentTenant?.id, type],
    queryFn: async () => {
      if (!currentTenant) return []

      const supabase = createClient()
      let query = supabase
        .from('message_queue')
        .select(`
          *,
          conversation:conversations(id, contact_name, contact_phone)
        `)
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('queue_type', type)
      }

      const { data, error } = await query

      if (error) throw error
      return data as QueueItemWithConversation[]
    },
    enabled: !!currentTenant,
  })
}

export function useResolveQueueItem() {
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()

  return useMutation({
    mutationFn: async ({
      id,
      resolution_message,
      status = 'resolved'
    }: {
      id: string
      resolution_message?: string
      status?: 'resolved' | 'dismissed'
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('message_queue')
        .update({
          status,
          resolution_message,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-queue', currentTenant?.id] })
    },
  })
}

export function useSendQueueResponse() {
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()

  return useMutation({
    mutationFn: async ({
      queueItem,
      message
    }: {
      queueItem: QueueItemWithConversation
      message: string
    }) => {
      if (!queueItem.conversation_id) {
        throw new Error('No conversation associated with this queue item')
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Create the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          tenant_id: currentTenant!.id,
          conversation_id: queueItem.conversation_id,
          direction: 'outbound',
          sender_type: 'human',
          content: message,
        })

      if (messageError) throw messageError

      // Mark queue item as resolved
      const { error: queueError } = await supabase
        .from('message_queue')
        .update({
          status: 'resolved',
          resolution_message: message,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', queueItem.id)

      if (queueError) throw queueError

      // TODO: Actually send the message via WhatsApp API
      // This would call the Evolution API to send the message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-queue', currentTenant?.id] })
    },
  })
}
