'use client'

import Link from 'next/link'
import { Phone, MoreVertical, Settings, Trash2, Unplug, MessageSquare, Calendar, RefreshCw, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations, useLocale } from '@/providers/locale-provider'
import type { Tables } from '@/types/database'
import { formatDistanceToNow, type Locale } from 'date-fns'
import { de, es, fr, enUS } from 'date-fns/locale'

type WhatsAppAccount = Tables<'whatsapp_accounts'>

interface AccountCardProps {
  account: WhatsAppAccount
  onDisconnect?: (id: string) => void
  onDelete?: (id: string) => void
  onSync?: (id: string) => void
  onReconnect?: (account: WhatsAppAccount) => void
  isSyncing?: boolean
}

const localeMap: Record<string, Locale> = {
  de,
  es,
  fr,
  en: enUS,
}

const statusStyles = {
  connected: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  qr_pending: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    dot: 'bg-yellow-500',
  },
  disconnected: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    dot: 'bg-red-500',
  },
}

export function AccountCard({ account, onDisconnect, onDelete, onSync, onReconnect, isSyncing }: AccountCardProps) {
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  const { locale } = useLocale()
  const dateLocale = localeMap[locale] || enUS

  const statusKey = account.status as keyof typeof statusStyles
  const statusStyle = statusStyles[statusKey] || statusStyles.disconnected
  const usageProgress = (account.messages_sent_today / account.daily_limit) * 100

  const getStatusLabel = () => {
    if (statusKey === 'connected') return t('status.connected')
    if (statusKey === 'qr_pending') return t('pending')
    return t('status.disconnected')
  }

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
              {account.phone_number || t('noNumberAssigned')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            statusStyle.bg,
            statusStyle.text
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
            {getStatusLabel()}
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
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
              {account.status === 'connected' && (
                <DropdownMenuItem
                  onClick={() => onSync?.(account.id)}
                  disabled={isSyncing}
                  className="text-gray-300 focus:text-white focus:bg-[#252525]"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
                  {isSyncing ? t('syncing') : t('syncChats')}
                </DropdownMenuItem>
              )}
              {account.status === 'connected' && (
                <DropdownMenuItem
                  onClick={() => onDisconnect?.(account.id)}
                  className="text-gray-300 focus:text-white focus:bg-[#252525]"
                >
                  <Unplug className="mr-2 h-4 w-4" />
                  {t('disconnect')}
                </DropdownMenuItem>
              )}
              {account.status !== 'connected' && account.status !== 'qr_pending' && (
                <DropdownMenuItem
                  onClick={() => onReconnect?.(account)}
                  className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {t('reconnect') || 'Neu verbinden'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem
                onClick={() => onDelete?.(account.id)}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Connected Date */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {t('connectedAgo')} {account.created_at ? formatDistanceToNow(new Date(account.created_at), { addSuffix: true, locale: dateLocale }) : t('recently')}
        </span>
      </div>

      {/* Daily Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">{t('dailyUsage')}</span>
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
          <span>{account.messages_sent_today} {t('sentToday')}</span>
        </div>
        <div className="text-sm text-gray-500">
          {t('warmupDay')} {account.warmup_day}/30
        </div>
      </div>
    </div>
  )
}
