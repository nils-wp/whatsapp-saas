'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { MoreVertical, Trash2, MessageSquare, Bot, Phone } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatPhoneNumber, getContactInitials } from '@/lib/utils/phone'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'> & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string; agent_name?: string | null } | null
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onDelete?: (id: string) => void
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Aktiv', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'secondary' },
  escalated: { label: 'Eskaliert', variant: 'destructive' },
  completed: { label: 'Abgeschlossen', variant: 'outline' },
  booked: { label: 'Gebucht', variant: 'default' },
  disqualified: { label: 'Disqualifiziert', variant: 'secondary' },
}

export function ConversationList({ conversations, selectedId, onDelete }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <MessageSquare className="h-12 w-12 mb-3 text-slate-600" />
        <p>Keine Konversationen gefunden</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-800/50">
      {conversations.map((conversation) => {
        const status = statusConfig[conversation.status] || statusConfig.active
        const isSelected = conversation.id === selectedId
        const displayName = conversation.contact_name || conversation.contact_push_name || formatPhoneNumber(conversation.contact_phone)

        return (
          <Link
            key={conversation.id}
            href={`/conversations/${conversation.id}`}
            className={cn(
              'flex items-center gap-4 p-4 transition-all group hover:bg-slate-900/50',
              isSelected && 'bg-slate-900/80 border-l-2 border-l-emerald-500'
            )}
          >
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-slate-800">
              <AvatarImage
                src={conversation.profile_picture_url || undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 font-semibold">
                {getContactInitials(conversation.contact_name, conversation.contact_push_name, conversation.contact_phone)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-white truncate">
                  {displayName}
                </p>
                <span className="text-xs text-slate-500 shrink-0">
                  {conversation.last_message_at
                    ? formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: false,
                        locale: de,
                      })
                    : '-'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={status.variant} className="text-xs">
                  {status.label}
                </Badge>
                {conversation.agents?.name && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Bot className="h-3 w-3" />
                    {conversation.agents.name}
                  </span>
                )}
              </div>

              {conversation.contact_phone && displayName !== formatPhoneNumber(conversation.contact_phone) && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <Phone className="h-3 w-3" />
                  {formatPhoneNumber(conversation.contact_phone)}
                </p>
              )}
            </div>

            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete(conversation.id)
                    }}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </Link>
        )
      })}
    </div>
  )
}
