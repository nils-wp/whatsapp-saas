'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'> & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string; agent_name?: string | null } | null
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'bg-green-500' },
  paused: { label: 'Pausiert', color: 'bg-yellow-500' },
  escalated: { label: 'Eskaliert', color: 'bg-red-500' },
  completed: { label: 'Abgeschlossen', color: 'bg-blue-500' },
  disqualified: { label: 'Disqualifiziert', color: 'bg-gray-500' },
}

export function ConversationList({ conversations, selectedId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
        Keine Konversationen gefunden
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {conversations.map((conversation) => {
          const status = statusConfig[conversation.status] || statusConfig.active
          const isSelected = conversation.id === selectedId

          return (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                isSelected ? 'bg-muted' : ''
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {conversation.contact_name?.[0] ||
                    conversation.contact_phone.slice(-2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">
                    {conversation.contact_name || conversation.contact_phone}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {conversation.last_message_at
                      ? formatDistanceToNow(new Date(conversation.last_message_at), {
                          addSuffix: true,
                          locale: de,
                        })
                      : '-'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`${status.color} text-white text-xs`}
                  >
                    {status.label}
                  </Badge>
                  {conversation.agents?.name && (
                    <span className="text-xs text-muted-foreground truncate">
                      {conversation.agents.name}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  )
}
