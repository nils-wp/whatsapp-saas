'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MoreVertical, Trash2, Eye } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'> & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string; agent_name?: string | null } | null
  profile_picture_url?: string | null
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onDelete?: (id: string) => void
}

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-500' },
  paused: { label: 'Paused', dot: 'bg-yellow-500', text: 'text-yellow-500' },
  escalated: { label: 'Escalated', dot: 'bg-red-500', text: 'text-red-500' },
  completed: { label: 'Completed', dot: 'bg-blue-500', text: 'text-blue-500' },
  disqualified: { label: 'Disqualified', dot: 'bg-gray-500', text: 'text-gray-500' },
}

function formatPhoneNumber(phone: string): string {
  // Format: +49 176 12345678
  if (phone.startsWith('49') && phone.length >= 10) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`
  }
  if (phone.length >= 10) {
    return `+${phone.slice(0, -8)} ${phone.slice(-8, -4)} ${phone.slice(-4)}`
  }
  return phone
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return phone.slice(-2)
}

export function ConversationList({ conversations, selectedId, onDelete }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-8 text-center">
        No conversations found
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-[#2a2a2a]">
        {conversations.map((conversation) => {
          const status = statusConfig[conversation.status] || statusConfig.active
          const isSelected = conversation.id === selectedId
          const displayName = conversation.contact_name || formatPhoneNumber(conversation.contact_phone)

          return (
            <div
              key={conversation.id}
              className={cn(
                'flex items-center gap-3 p-4 transition-colors group',
                isSelected
                  ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                  : 'hover:bg-[#252525]'
              )}
            >
              <Link href={`/conversations/${conversation.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-11 w-11 border border-[#3a3a3a]">
                  <AvatarImage
                    src={conversation.profile_picture_url || undefined}
                    alt={conversation.contact_name || conversation.contact_phone}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-500 font-medium">
                    {getInitials(conversation.contact_name, conversation.contact_phone)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-white truncate">
                      {displayName}
                    </p>
                    <span className="text-xs text-gray-500 shrink-0">
                      {conversation.last_message_at
                        ? formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: true,
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      <span className={status.text}>{status.label}</span>
                    </span>
                    {conversation.agents?.name && (
                      <span className="text-xs text-gray-500 truncate">
                        • {conversation.agents.name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-[#252525]">
                    <Link href={`/conversations/${conversation.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        onDelete(conversation.id)
                      }}
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
