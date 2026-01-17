'use client'

import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/providers/locale-provider'

interface StatsCardsProps {
  stats: {
    appointmentsBooked: number
    activeConversations: number
    conversionRate: number
    connectedNumbers: number
    changes?: {
      appointmentsBooked?: number
      activeConversations?: number
      conversionRate?: number
      connectedNumbers?: number
    }
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('dashboard')

  const cards = [
    {
      titleKey: 'appointmentsBooked',
      value: stats.appointmentsBooked,
      icon: Calendar,
      change: stats.changes?.appointmentsBooked,
      iconBg: 'bg-[#00a884]/10',
      iconColor: 'text-[#00a884]',
    },
    {
      titleKey: 'activeConversations',
      value: stats.activeConversations,
      icon: MessageSquare,
      change: stats.changes?.activeConversations,
      iconBg: 'bg-[#53bdeb]/10',
      iconColor: 'text-[#53bdeb]',
    },
    {
      titleKey: 'conversionRate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      change: stats.changes?.conversionRate,
      iconBg: 'bg-[#8696a0]/10',
      iconColor: 'text-[#8696a0]',
      isPercentage: true,
    },
    {
      titleKey: 'connectedNumbers',
      value: stats.connectedNumbers,
      icon: Phone,
      change: stats.changes?.connectedNumbers,
      iconBg: 'bg-[#f7c948]/10',
      iconColor: 'text-[#f7c948]',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.titleKey}
          className="relative overflow-hidden rounded-xl border border-[#222d34] bg-[#111b21] p-5 transition-colors hover:bg-[#1a252c]"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-[#8696a0]">
                {t(card.titleKey)}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-[#e9edef]">
                {typeof card.value === 'number'
                  ? card.value.toLocaleString()
                  : card.value}
              </p>
              {card.change !== undefined && card.change !== 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      card.change >= 0 ? 'text-[#00a884]' : 'text-[#ea4335]'
                    )}
                  >
                    {card.change >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-xs text-[#667781]">{t('vsLastWeek')}</span>
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl',
                card.iconBg
              )}
            >
              <card.icon className={cn('h-5 w-5', card.iconColor)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
