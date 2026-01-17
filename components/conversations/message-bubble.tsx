'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

type Message = Tables<'messages'> & {
  sent_by?: string | null
}

interface MessageBubbleProps {
  message: Message
  sentByName?: string | null
}

const statusIcons = {
  pending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
}

export function MessageBubble({ message, sentByName }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const StatusIcon = statusIcons[message.status as keyof typeof statusIcons] || Clock

  const getSenderLabel = () => {
    if (message.sender_type === 'agent') return 'KI Agent'
    if (message.sender_type === 'human' && sentByName) return sentByName
    if (message.sender_type === 'human') return 'Mitarbeiter'
    return null
  }

  const senderLabel = getSenderLabel()

  return (
    <div
      className={cn(
        'flex mb-1',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[85%] sm:max-w-[70%] px-3 py-2 shadow-sm',
          isOutbound
            ? 'bg-[#005c4b] text-[#e9edef] rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-sm'
            : 'bg-[#202c33] text-[#e9edef] rounded-tl-sm rounded-tr-lg rounded-bl-lg rounded-br-lg'
        )}
      >
        {/* Sender indicator for outbound */}
        {isOutbound && senderLabel && (
          <p className="text-[11px] text-[#8fdfcb] font-medium mb-0.5">
            {senderLabel}
          </p>
        )}

        {/* Message content */}
        <p className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px]">{message.content}</p>

        {/* Timestamp and status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-[11px] select-none',
            isOutbound ? 'justify-end text-[#8fdfcb]/70' : 'text-[#8696a0]'
          )}
        >
          <span>
            {format(new Date(message.created_at), 'HH:mm', { locale: de })}
          </span>
          {isOutbound && (
            <StatusIcon
              className={cn(
                'h-[14px] w-[14px] ml-0.5',
                message.status === 'read' && 'text-[#53bdeb]',
                message.status === 'delivered' && 'text-[#8fdfcb]/70',
                message.status === 'sent' && 'text-[#8fdfcb]/70',
                message.status === 'pending' && 'text-[#8fdfcb]/50',
                message.status === 'failed' && 'text-[#ea4335]'
              )}
            />
          )}
        </div>
      </div>
    </div>
  )
}
