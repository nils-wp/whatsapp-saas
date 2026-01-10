'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentConversations } from '@/components/dashboard/recent-conversations'
import { ActivityChart } from '@/components/dashboard/activity-chart'
import { PageLoader } from '@/components/shared/loading-spinner'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/providers/tenant-provider'
import { useTranslations } from '@/providers/locale-provider'
import { MessageSquare, Clock } from 'lucide-react'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'>
type AnalyticsDaily = Tables<'analytics_daily'>

export default function DashboardPage() {
  const { currentTenant, isLoading: tenantLoading } = useTenant()
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    appointmentsBooked: 0,
    activeConversations: 0,
    conversionRate: 0,
    connectedNumbers: 0,
    changes: {
      appointmentsBooked: 0,
      activeConversations: 0,
      conversionRate: 0,
      connectedNumbers: 0,
    },
  })
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
  const [activityData, setActivityData] = useState<Array<{
    date: string
    sent: number
    received: number
  }>>([])

  useEffect(() => {
    if (!currentTenant) return

    const tenantId = currentTenant.id

    async function fetchDashboardData() {
      const supabase = createClient()
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Fetch stats
      const [
        { count: activeCount },
        { count: totalCount },
        { count: bookedCount },
        { count: connectedCount },
        analyticsResult,
        { data: conversationsData },
        { count: prevTotalCount },
        { count: prevBookedCount },
      ] = await Promise.all([
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'active'),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', weekAgo),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('outcome', 'booked')
          .gte('booked_at', weekAgo),
        supabase
          .from('whatsapp_accounts')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'connected'),
        supabase
          .from('analytics_daily')
          .select('*')
          .eq('tenant_id', tenantId)
          .gte('date', weekAgo)
          .order('date', { ascending: true }),
        supabase
          .from('conversations')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('last_message_at', { ascending: false })
          .limit(5),
        // Previous week data for comparison
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', twoWeeksAgo)
          .lt('created_at', weekAgo),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('outcome', 'booked')
          .gte('booked_at', twoWeeksAgo)
          .lt('booked_at', weekAgo),
      ])

      // Extract analytics data with proper typing
      const analyticsData = analyticsResult.data as AnalyticsDaily[] | null

      // Calculate conversion rate
      const conversionRate = totalCount && totalCount > 0
        ? Math.round((bookedCount || 0) / totalCount * 100 * 10) / 10
        : 0

      // Calculate previous conversion rate
      const prevConversionRate = prevTotalCount && prevTotalCount > 0
        ? Math.round((prevBookedCount || 0) / prevTotalCount * 100 * 10) / 10
        : 0

      // Calculate changes
      const calcChange = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0
        return Math.round((current - prev) / prev * 100)
      }

      setStats({
        appointmentsBooked: bookedCount || 0,
        activeConversations: activeCount || 0,
        conversionRate,
        connectedNumbers: connectedCount || 0,
        changes: {
          appointmentsBooked: calcChange(bookedCount || 0, prevBookedCount || 0),
          activeConversations: 0, // Active is point-in-time, no change calc
          conversionRate: Math.round((conversionRate - prevConversionRate) * 10) / 10,
          connectedNumbers: 0, // No historical comparison for connected numbers
        },
      })

      setRecentConversations(conversationsData || [])

      // Prepare activity chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
        return date.toISOString().split('T')[0]
      })

      const chartData = last7Days.map((date) => {
        const dayData = analyticsData?.find((a) => a.date === date)
        return {
          date,
          sent: dayData?.messages_sent || 0,
          received: dayData?.messages_received || 0,
        }
      })

      setActivityData(chartData)
      setIsLoading(false)
    }

    fetchDashboardData()
  }, [currentTenant])

  if (tenantLoading || isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('title')}</h1>
          <p className="text-gray-400">
            {t('welcome')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/conversations"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            {tNav('conversations')}
          </Link>
          <Link
            href="/queue"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
          >
            <Clock className="h-4 w-4" />
            Queue
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentConversations conversations={recentConversations} />
        <ActivityChart data={activityData} />
      </div>
    </div>
  )
}
