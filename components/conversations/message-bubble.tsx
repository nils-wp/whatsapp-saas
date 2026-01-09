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

  // Determine sender label
  const getSenderLabel = () => {
    if (message.sender_type === 'agent') return 'Agent'
    if (message.sender_type === 'human' && sentByName) return sentByName
    if (message.sender_type === 'human') return 'Human'
    return null
  }

  const senderLabel = getSenderLabel()

  return (
    <div
      className={cn(
        'flex mb-2',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isOutbound
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {/* Sender indicator for outbound */}
        {isOutbound && senderLabel && (
          <p className="text-xs opacity-70 mb-1">
            {senderLabel}
          </p>
        )}

        {/* Message content */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Timestamp and status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            isOutbound ? 'justify-end opacity-70' : 'text-muted-foreground'
          )}
        >
          <span>
            {format(new Date(message.created_at), 'HH:mm', { locale: de })}
          </span>
          {isOutbound && (
            <StatusIcon
              className={cn(
                'h-3 w-3',
                message.status === 'read' && 'text-blue-400',
                message.status === 'failed' && 'text-red-400'
              )}
            />
          )}
        </div>
      </div>
    </div>
  )
}
