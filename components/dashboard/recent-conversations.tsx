'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'>

interface RecentConversationsProps {
  conversations: Conversation[]
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Active' },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Paused' },
  escalated: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Escalated' },
  completed: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Completed' },
  disqualified: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Disqualified' },
}

export function RecentConversations({ conversations }: RecentConversationsProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-400" />
            Recent Conversations
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-12 w-12 text-gray-600 mb-4" />
          <p className="text-gray-500">No conversations yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          Recent Conversations
        </h3>
        <Link
          href="/conversations"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {conversations.map((conversation) => {
          const status = statusConfig[conversation.status] || statusConfig.active
          return (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#252525] transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                {conversation.contact_name?.[0] || conversation.contact_phone.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {conversation.contact_name || conversation.contact_phone}
                </p>
                <p className="text-sm text-gray-500">
                  {conversation.last_message_at
                    ? formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: de,
                      })
                    : 'No messages'}
                </p>
              </div>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  status.bg,
                  status.text
                )}
              >
                {status.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
