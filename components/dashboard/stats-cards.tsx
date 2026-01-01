'use client'

import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    appointmentsBooked: number
    activeConversations: number
    conversionRate: number
    totalConversations: number
    changes?: {
      appointmentsBooked?: number
      activeConversations?: number
      conversionRate?: number
      totalConversations?: number
    }
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Termine gebucht',
      value: stats.appointmentsBooked,
      icon: Calendar,
      description: 'diese Woche',
      change: stats.changes?.appointmentsBooked,
      primary: true,
    },
    {
      title: 'Aktive Konversationen',
      value: stats.activeConversations,
      icon: MessageSquare,
      description: 'laufend',
      change: stats.changes?.activeConversations,
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      description: 'Termin / Konversation',
      change: stats.changes?.conversionRate,
      isPercentage: true,
    },
    {
      title: 'Konversationen gesamt',
      value: stats.totalConversations,
      icon: Users,
      description: 'diese Woche',
      change: stats.changes?.totalConversations,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={cn(
            'relative overflow-hidden',
            card.primary && 'border-primary bg-primary/5'
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p
                  className={cn(
                    'text-3xl font-bold tracking-tight',
                    card.primary && 'text-primary'
                  )}
                >
                  {typeof card.value === 'number'
                    ? card.value.toLocaleString()
                    : card.value}
                </p>
                <div className="flex items-center gap-2">
                  {card.change !== undefined && (
                    <span
                      className={cn(
                        'flex items-center text-xs font-medium',
                        card.change >= 0 ? 'text-green-500' : 'text-red-500'
                      )}
                    >
                      {card.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      )}
                      {Math.abs(card.change)}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {card.description}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg',
                  card.primary ? 'bg-primary/20' : 'bg-secondary'
                )}
              >
                <card.icon
                  className={cn(
                    'h-6 w-6',
                    card.primary ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </div>
            </div>
          </CardContent>
          {card.primary && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
          )}
        </Card>
      ))}
    </div>
  )
}
