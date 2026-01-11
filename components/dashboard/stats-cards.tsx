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
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      titleKey: 'activeConversations',
      value: stats.activeConversations,
      icon: MessageSquare,
      change: stats.changes?.activeConversations,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      titleKey: 'conversionRate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      change: stats.changes?.conversionRate,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      isPercentage: true,
    },
    {
      titleKey: 'connectedNumbers',
      value: stats.connectedNumbers,
      icon: Phone,
      change: stats.changes?.connectedNumbers,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.titleKey}
          className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400">
                {t(card.titleKey)}
              </p>
              <p className="text-3xl font-bold tracking-tight text-white">
                {typeof card.value === 'number'
                  ? card.value.toLocaleString()
                  : card.value}
              </p>
              {card.change !== undefined && card.change !== 0 && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      card.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {card.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-xs text-gray-500">{t('vsLastWeek')}</span>
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                card.iconBg
              )}
            >
              <card.icon className={cn('h-6 w-6', card.iconColor)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
