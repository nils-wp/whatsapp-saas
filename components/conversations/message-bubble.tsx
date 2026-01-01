'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

type Message = Tables<'messages'>

interface MessageBubbleProps {
  message: Message
}

const statusIcons = {
  pending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const StatusIcon = statusIcons[message.status as keyof typeof statusIcons] || Clock

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
        {isOutbound && message.sender_type !== 'contact' && (
          <p className="text-xs opacity-70 mb-1">
            {message.sender_type === 'agent' ? 'Agent' : 'Human'}
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
