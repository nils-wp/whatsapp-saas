'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Send, Pause, Play, Flag, CheckCircle, MoreVertical, Search, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './message-bubble'
import { createClient } from '@/lib/supabase/client'
import { useMessages, useSendMessage, useUpdateConversation } from '@/lib/hooks/use-conversations'
import { useUserNames, getUserDisplayName } from '@/lib/hooks/use-user-names'
import type { Tables } from '@/types/database'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Conversation = Tables<'conversations'> & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string; agent_name: string | null } | null
  profile_picture_url?: string | null
}

interface ConversationDetailProps {
  conversation: Conversation
}

const statusLabels: Record<string, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  escalated: 'Eskaliert',
  completed: 'Abgeschlossen',
  disqualified: 'Disqualifiziert',
}

export function ConversationDetail({ conversation }: ConversationDetailProps) {
  const { data: messages, refetch } = useMessages(conversation.id)
  const sendMessage = useSendMessage()
  const updateConversation = useUpdateConversation()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const userIds = useMemo(() => {
    if (!messages) return []
    const ids: string[] = []
    messages.forEach(msg => {
      if (msg.sent_by) ids.push(msg.sent_by)
    })
    return [...new Set(ids)]
  }, [messages])

  const { data: userNames } = useUserNames(userIds)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
      toast.success(`Status geändert: ${statusLabels[status] || status}`)
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  const getInitials = (name: string | null, phone: string) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    return phone.slice(-2)
  }

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#202c33] border-b border-[#222d34]">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={conversation.profile_picture_url || undefined}
              alt={conversation.contact_name || conversation.contact_phone}
            />
            <AvatarFallback className="bg-[#6b7c85] text-[#e9edef] font-medium">
              {getInitials(conversation.contact_name, conversation.contact_phone)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-[#e9edef] text-base">
              {conversation.contact_name || conversation.contact_phone}
            </h3>
            <p className="text-xs text-[#8696a0]">
              Schritt {conversation.current_script_step} · {statusLabels[conversation.status] || conversation.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#aebac1] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10"
          >
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#aebac1] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#233138] border-[#233138] shadow-xl w-48">
              {conversation.status === 'active' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('paused')}
                  className="text-[#e9edef] focus:text-[#e9edef] focus:bg-[#2a3942]"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausieren
                </DropdownMenuItem>
              )}

              {conversation.status === 'paused' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('active')}
                  className="text-[#e9edef] focus:text-[#e9edef] focus:bg-[#2a3942]"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Fortsetzen
                </DropdownMenuItem>
              )}

              {conversation.status !== 'escalated' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('escalated')}
                  className="text-[#f7c948] focus:text-[#f7c948] focus:bg-[#2a3942]"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Eskalieren
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-[#2f3b44]" />

              {conversation.status !== 'completed' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('completed')}
                  className="text-[#00a884] focus:text-[#00a884] focus:bg-[#2a3942]"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Abschließen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages - with chat pattern background */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 px-4 py-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#0b141a',
        }}
      >
        <div className="space-y-1 py-2">
          {messages?.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              sentByName={getUserDisplayName(userNames, message.sent_by)}
            />
          ))}

          {(!messages || messages.length === 0) && (
            <div className="flex items-center justify-center h-32 text-[#8696a0]">
              Keine Nachrichten
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 bg-[#202c33] border-t border-[#222d34]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10 shrink-0"
          >
            <Smile className="h-6 w-6" />
          </Button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht eingeben..."
            disabled={sendMessage.isPending}
            className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0] rounded-lg px-4 py-2.5 text-[15px] border-0 outline-none focus:ring-1 focus:ring-[#00a884]/30"
          />

          <Button
            type="submit"
            size="icon"
            disabled={sendMessage.isPending || !input.trim()}
            className="bg-[#00a884] hover:bg-[#02735e] text-white rounded-full h-10 w-10 shrink-0 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
