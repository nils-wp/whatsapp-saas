'use client'

import Link from 'next/link'
import { Phone, MoreVertical, Settings, Trash2, Unplug, MessageSquare, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tables } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

type WhatsAppAccount = Tables<'whatsapp_accounts'>

interface AccountCardProps {
  account: WhatsAppAccount
  onDisconnect?: (id: string) => void
  onDelete?: (id: string) => void
}

const statusConfig = {
  connected: {
    label: 'Connected',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  qr_pending: {
    label: 'Pending',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    dot: 'bg-yellow-500',
  },
  disconnected: {
    label: 'Disconnected',
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    dot: 'bg-red-500',
  },
}

export function AccountCard({ account, onDisconnect, onDelete }: AccountCardProps) {
  const status = statusConfig[account.status as keyof typeof statusConfig] || statusConfig.disconnected
  const usageProgress = (account.messages_sent_today / account.daily_limit) * 100

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 hover:border-[#3a3a3a] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {account.display_name || account.instance_name}
            </h3>
            <p className="text-sm text-gray-500">
              {account.phone_number || 'No number assigned'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            status.bg,
            status.text
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
              <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-[#252525]">
                <Link href={`/accounts/${account.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {account.status === 'connected' && (
                <DropdownMenuItem
                  onClick={() => onDisconnect?.(account.id)}
                  className="text-gray-300 focus:text-white focus:bg-[#252525]"
                >
                  <Unplug className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem
                onClick={() => onDelete?.(account.id)}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Connected Date */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          Connected {account.created_at ? formatDistanceToNow(new Date(account.created_at), { addSuffix: true }) : 'recently'}
        </span>
      </div>

      {/* Daily Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Daily Usage</span>
          <span className="text-white">
            {account.messages_sent_today} / {account.daily_limit}
          </span>
        </div>
        <div className="h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(usageProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <MessageSquare className="h-4 w-4" />
          <span>{account.messages_sent_today} sent today</span>
        </div>
        <div className="text-sm text-gray-500">
          Day {account.warmup_day}/30
        </div>
      </div>
    </div>
  )
}
