'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Send, Pause, Play, Flag, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './message-bubble'
import { createClient } from '@/lib/supabase/client'
import { useMessages, useSendMessage, useUpdateConversation } from '@/lib/hooks/use-conversations'
import { useUserNames, getUserDisplayName } from '@/lib/hooks/use-user-names'
import type { Tables } from '@/types/database'
import { toast } from 'sonner'

type Conversation = Tables<'conversations'> & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string; agent_name: string | null } | null
  profile_picture_url?: string | null
}

interface ConversationDetailProps {
  conversation: Conversation
}

export function ConversationDetail({ conversation }: ConversationDetailProps) {
  const { data: messages, refetch } = useMessages(conversation.id)
  const sendMessage = useSendMessage()
  const updateConversation = useUpdateConversation()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Collect all user IDs for name lookup
  const userIds = useMemo(() => {
    if (!messages) return []
    const ids: string[] = []
    messages.forEach(msg => {
      if (msg.sent_by) ids.push(msg.sent_by)
    })
    return [...new Set(ids)]
  }, [messages])

  const { data: userNames } = useUserNames(userIds)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, refetch])

  async function handleSend() {
    if (!input.trim()) return

    try {
      await sendMessage.mutateAsync({
        conversationId: conversation.id,
        content: input.trim(),
      })
      setInput('')
    } catch (error) {
      toast.error('Fehler beim Senden')
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await updateConversation.mutateAsync({
        id: conversation.id,
        status,
        ...(status === 'escalated' && {
          escalated_at: new Date().toISOString(),
        }),
      })
      toast.success(`Status geändert: ${status}`)
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={conversation.profile_picture_url || undefined}
              alt={conversation.contact_name || conversation.contact_phone}
            />
            <AvatarFallback>
              {conversation.contact_name?.[0] ||
                conversation.contact_phone.slice(-2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {conversation.contact_name || conversation.contact_phone}
            </h3>
            <p className="text-sm text-muted-foreground">
              {conversation.contact_phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Schritt {conversation.current_script_step}
          </Badge>

          {conversation.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('paused')}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pausieren
            </Button>
          )}

          {conversation.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('active')}
            >
              <Play className="h-4 w-4 mr-1" />
              Fortsetzen
            </Button>
          )}

          {conversation.status !== 'escalated' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('escalated')}
            >
              <Flag className="h-4 w-4 mr-1" />
              Eskalieren
            </Button>
          )}

          {conversation.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('completed')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Abschließen
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages?.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            sentByName={getUserDisplayName(userNames, message.sent_by)}
          />
        ))}

        {(!messages || messages.length === 0) && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Keine Nachrichten
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht eingeben..."
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            disabled={sendMessage.isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
