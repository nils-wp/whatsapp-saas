'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { MoreVertical, Trash2, Eye, CheckCheck } from 'lucide-react'
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
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onDelete?: (id: string) => void
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'text-[#00a884]' },
  paused: { label: 'Pausiert', color: 'text-[#f7c948]' },
  escalated: { label: 'Eskaliert', color: 'text-[#ea4335]' },
  completed: { label: 'Abgeschlossen', color: 'text-[#53bdeb]' },
  disqualified: { label: 'Disqualifiziert', color: 'text-[#8696a0]' },
}

function formatPhoneNumber(phone: string): string {
  // Clean the phone number (remove any non-digits except leading +)
  const cleaned = phone.replace(/[^\d+]/g, '')

  // If it already has a +, format it nicely
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1)
    if (digits.length >= 10) {
      // Format as +XX XXX XXXXXXX
      const countryCode = digits.slice(0, 2)
      const areaCode = digits.slice(2, 5)
      const rest = digits.slice(5)
      return `+${countryCode} ${areaCode} ${rest}`
    }
    return cleaned
  }

  // German number (49)
  if (cleaned.startsWith('49') && cleaned.length >= 10) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
  }

  // Other numbers - just add + and format
  if (cleaned.length >= 10) {
    // Assume country code is first 2-3 digits
    const countryCode = cleaned.slice(0, 2)
    const rest = cleaned.slice(2)
    return `+${countryCode} ${rest.slice(0, 3)} ${rest.slice(3)}`
  }

  return phone.startsWith('+') ? phone : `+${phone}`
}

function getInitials(name: string | null, pushName: string | null, phone: string): string {
  const displayName = name || pushName
  if (displayName) {
    const parts = displayName.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }
  // Use last 2 digits of phone for initials
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-2)
}

export function ConversationList({ conversations, selectedId, onDelete }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#8696a0] p-8 text-center">
        Keine Konversationen gefunden
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div>
        {conversations.map((conversation) => {
          const status = statusConfig[conversation.status] || statusConfig.active
          const isSelected = conversation.id === selectedId
          // Priority: contact_name (from CRM) > contact_push_name (from WhatsApp) > formatted phone
          const displayName = conversation.contact_name || conversation.contact_push_name || formatPhoneNumber(conversation.contact_phone)

          return (
            <div
              key={conversation.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors group cursor-pointer border-b border-[#222d34]',
                isSelected
                  ? 'bg-[#2a3942]'
                  : 'hover:bg-[#202c33]'
              )}
            >
              <Link href={`/conversations/${conversation.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage
                    src={conversation.profile_picture_url || undefined}
                    alt={conversation.contact_name || conversation.contact_phone}
                  />
                  <AvatarFallback className="bg-[#6b7c85] text-[#e9edef] font-medium text-base">
                    {getInitials(conversation.contact_name, conversation.contact_push_name, conversation.contact_phone)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[#e9edef] truncate text-[15px]">
                      {displayName}
                    </p>
                    <span className="text-xs text-[#8696a0] shrink-0">
                      {conversation.last_message_at
                        ? formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: false,
                            locale: de,
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCheck className="h-4 w-4 text-[#53bdeb] shrink-0" />
                    <span className={cn('text-sm truncate', status.color)}>
                      {status.label}
                    </span>
                    {conversation.agents?.name && (
                      <span className="text-sm text-[#8696a0] truncate">
                        · {conversation.agents.name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#233138] border-[#233138] shadow-xl">
                  <DropdownMenuItem asChild className="text-[#e9edef] focus:text-[#e9edef] focus:bg-[#2a3942]">
                    <Link href={`/conversations/${conversation.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Anzeigen
                    </Link>
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        onDelete(conversation.id)
                      }}
                      className="text-[#ea4335] focus:text-[#ea4335] focus:bg-[#2a3942]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
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
