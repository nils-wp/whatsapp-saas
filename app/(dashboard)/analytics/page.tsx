'use client'

import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Calendar,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

type TimeRange = '7d' | '30d' | '90d'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  const stats = {
    '7d': {
      messagesSent: 856,
      messagesReceived: 742,
      conversationsStarted: 124,
      conversationsCompleted: 89,
      bookings: 23,
      escalations: 12,
      conversionRate: 18.5,
      avgResponseTime: 8.5,
      changes: {
        messagesSent: 12,
        messagesReceived: 8,
        conversationsStarted: -5,
        bookings: 15,
        escalations: -20,
        conversionRate: 2.3,
      },
    },
    '30d': {
      messagesSent: 3420,
      messagesReceived: 2890,
      conversationsStarted: 485,
      conversationsCompleted: 412,
      bookings: 87,
      escalations: 45,
      conversionRate: 17.9,
      avgResponseTime: 9.2,
      changes: {
        messagesSent: 8,
        messagesReceived: 5,
        conversationsStarted: 12,
        bookings: 22,
        escalations: -15,
        conversionRate: 1.8,
      },
    },
    '90d': {
      messagesSent: 9850,
      messagesReceived: 8420,
      conversationsStarted: 1420,
      conversationsCompleted: 1180,
      bookings: 245,
      escalations: 132,
      conversionRate: 17.3,
      avgResponseTime: 9.8,
      changes: {
        messagesSent: 25,
        messagesReceived: 18,
        conversationsStarted: 32,
        bookings: 45,
        escalations: -8,
        conversionRate: 3.5,
      },
    },
  }

  const data = stats[timeRange]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Übersicht deiner Konversations-Performance.
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Letzte 7 Tage</SelectItem>
            <SelectItem value="30d">Letzte 30 Tage</SelectItem>
            <SelectItem value="90d">Letzte 90 Tage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Termine gebucht"
          value={data.bookings}
          change={data.changes.bookings}
          icon={Calendar}
          primary
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.conversionRate}%`}
          change={data.changes.conversionRate}
          icon={TrendingUp}
        />
        <MetricCard
          title="Konversationen"
          value={data.conversationsStarted}
          change={data.changes.conversationsStarted}
          icon={MessageSquare}
        />
        <MetricCard
          title="Eskalationen"
          value={data.escalations}
          change={data.changes.escalations}
          icon={Users}
          inverseChange
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Messages Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Nachrichten-Verlauf</CardTitle>
            <CardDescription>
              Gesendete und empfangene Nachrichten im Zeitverlauf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">Gesendet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                  <span className="text-sm">Empfangen</span>
                </div>
              </div>

              {/* Simple Bar Chart Visualization */}
              <div className="space-y-3">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => {
                  const sent = 80 + Math.random() * 40
                  const received = 60 + Math.random() * 40
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground w-8">{day}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(sent)} / {Math.round(received)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-4 rounded bg-primary transition-all"
                          style={{ width: `${sent}%` }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-4 rounded bg-muted-foreground/30 transition-all"
                          style={{ width: `${received}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {data.messagesSent.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nachrichten gesendet
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {data.messagesReceived.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nachrichten empfangen
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Vom ersten Kontakt zum gebuchten Termin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FunnelStep
                label="Konversationen gestartet"
                value={data.conversationsStarted}
                percentage={100}
                color="bg-primary/20"
              />
              <FunnelStep
                label="Qualifiziert"
                value={Math.round(data.conversationsStarted * 0.65)}
                percentage={65}
                color="bg-primary/40"
              />
              <FunnelStep
                label="Interesse bestätigt"
                value={Math.round(data.conversationsStarted * 0.35)}
                percentage={35}
                color="bg-primary/60"
              />
              <FunnelStep
                label="Termin gebucht"
                value={data.bookings}
                percentage={data.conversionRate}
                color="bg-primary"
              />
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data.conversionRate}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Conversion Rate
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {data.avgResponseTime}min
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg. Antwortzeit
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Account Performance</CardTitle>
          <CardDescription>
            Leistung pro WhatsApp Nummer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AccountRow
              name="+49 151 12345678"
              messagesSent={425}
              bookings={12}
              warmupDay={14}
              limit={100}
              recommendation="increase"
            />
            <AccountRow
              name="+49 171 98765432"
              messagesSent={312}
              bookings={8}
              warmupDay={8}
              limit={75}
              recommendation="hold"
            />
            <AccountRow
              name="+49 162 11223344"
              messagesSent={119}
              bookings={3}
              warmupDay={3}
              limit={50}
              recommendation="warming"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  primary = false,
  inverseChange = false,
}: {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
  inverseChange?: boolean
}) {
  const isPositive = inverseChange ? change < 0 : change > 0
  const displayChange = Math.abs(change)

  return (
    <Card className={primary ? 'border-primary bg-primary/5' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className={`text-3xl font-bold ${primary ? 'text-primary' : ''}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              primary ? 'bg-primary/20' : 'bg-secondary'
            }`}
          >
            <Icon className={`h-6 w-6 ${primary ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm">
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {displayChange}%
          </span>
          <span className="text-muted-foreground">vs. Vorperiode</span>
        </div>
      </CardContent>
    </Card>
  )
}

function FunnelStep({
  label,
  value,
  percentage,
  color,
}: {
  label: string
  value: number
  percentage: number
  color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-8 w-full rounded-lg bg-secondary overflow-hidden">
        <div
          className={`h-full ${color} transition-all flex items-center justify-end pr-3`}
          style={{ width: `${percentage}%` }}
        >
          <span className="text-xs font-medium">{percentage}%</span>
        </div>
      </div>
    </div>
  )
}

function AccountRow({
  name,
  messagesSent,
  bookings,
  warmupDay,
  limit,
  recommendation,
}: {
  name: string
  messagesSent: number
  bookings: number
  warmupDay: number
  limit: number
  recommendation: 'increase' | 'hold' | 'warming'
}) {
  const recommendationMap = {
    increase: {
      label: 'Limit erhöhen',
      variant: 'default' as const,
      color: 'text-green-500',
    },
    hold: {
      label: 'Limit halten',
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
    },
    warming: {
      label: 'Warming aktiv',
      variant: 'outline' as const,
      color: 'text-yellow-500',
    },
  }

  const rec = recommendationMap[recommendation]

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">
            Tag {warmupDay} · Limit: {limit}/Tag
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="font-medium">{messagesSent}</div>
          <div className="text-xs text-muted-foreground">Nachrichten</div>
        </div>
        <div className="text-right">
          <div className="font-medium">{bookings}</div>
          <div className="text-xs text-muted-foreground">Buchungen</div>
        </div>
        <Badge variant={rec.variant} className={rec.color}>
          {rec.label}
        </Badge>
      </div>
    </div>
  )
}
