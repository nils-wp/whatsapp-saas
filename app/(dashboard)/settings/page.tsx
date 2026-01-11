'use client'

import { useState } from 'react'
import {
  User,
  Users,
  Shield,
  Bell,
  CreditCard,
  Clock,
  Key,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useTenant } from '@/providers/tenant-provider'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/providers/locale-provider'

const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
]

const WEEKDAY_KEYS = [
  { value: 1, key: 'mon' },
  { value: 2, key: 'tue' },
  { value: 3, key: 'wed' },
  { value: 4, key: 'thu' },
  { value: 5, key: 'fri' },
  { value: 6, key: 'sat' },
  { value: 0, key: 'sun' },
]

export default function SettingsPage() {
  const { currentTenant, user } = useTenant()
  const t = useTranslations('settings')
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [email] = useState(user?.email || '')
  const [timezone, setTimezone] = useState('Europe/Berlin')
  const [officeHoursEnabled, setOfficeHoursEnabled] = useState(true)
  const [officeStart, setOfficeStart] = useState('08:00')
  const [officeEnd, setOfficeEnd] = useState('18:00')
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5])
  const [notifications, setNotifications] = useState({
    email: true,
    escalations: true,
    dailyDigest: false,
    marketing: false,
  })

  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSave = () => {
    toast.success(t('saved'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('title')}</h1>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
        >
          {t('saveChanges')}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('account')}</h3>
              <p className="text-sm text-gray-500">{t('manageProfile')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">{t('email')}</Label>
              <Input
                value={email}
                disabled
                className="mt-2 bg-[#0f0f0f] border-[#2a2a2a] text-gray-400"
              />
            </div>
            <div>
              <Label className="text-gray-300">{t('fullName')}</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('yourName')}
                className="mt-2 bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">{t('timezone')}</Label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full mt-2 px-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-white focus:outline-none focus:border-emerald-500/50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Team Card */}
        <Link href="/settings/team" className="block rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{t('team')}</h3>
              <p className="text-sm text-gray-500">{t('teamDesc')}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </div>
          <p className="text-sm text-gray-400">
            {t('teamInviteDesc')}
          </p>
        </Link>

        {/* Security Card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('security')}</h3>
              <p className="text-sm text-gray-500">{t('protectAccount')}</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-gray-400" />
                <span className="text-white">{t('changePassword')}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-white">{t('twoFactor')}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-400">
                {t('comingSoon')}
              </span>
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:bg-[#151515] transition-colors">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-gray-400" />
                <span className="text-white">{t('apiKeys')}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('notifications')}</h3>
              <p className="text-sm text-gray-500">{t('configureAlerts')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: 'email', labelKey: 'emailNotifications', descKey: 'emailNotificationsDesc' },
              { key: 'escalations', labelKey: 'escalationAlerts', descKey: 'escalationAlertsDesc' },
              { key: 'dailyDigest', labelKey: 'dailyDigest', descKey: 'dailyDigestDesc' },
              { key: 'marketing', labelKey: 'marketingUpdates', descKey: 'marketingUpdatesDesc' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]"
              >
                <div>
                  <p className="text-sm font-medium text-white">{t(item.labelKey)}</p>
                  <p className="text-xs text-gray-500">{t(item.descKey)}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Billing Card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('billing')}</h3>
              <p className="text-sm text-gray-500">{t('manageSubscription')}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('currentPlan')}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                Premium
              </span>
            </div>
            <p className="text-2xl font-bold text-white">$99/month</p>
            <p className="text-sm text-gray-400 mt-1">{t('unlimitedAgents')}</p>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:bg-[#151515] transition-colors">
              <span className="text-white">{t('manageSubscription')}</span>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:bg-[#151515] transition-colors">
              <span className="text-white">{t('viewInvoices')}</span>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Office Hours Section */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t('officeHours')}</h3>
            <p className="text-sm text-gray-500">{t('officeHoursDesc')}</p>
          </div>
          <Switch
            checked={officeHoursEnabled}
            onCheckedChange={setOfficeHoursEnabled}
          />
        </div>

        {officeHoursEnabled && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-gray-300">{t('startTime')}</Label>
                <Input
                  type="time"
                  value={officeStart}
                  onChange={(e) => setOfficeStart(e.target.value)}
                  className="mt-2 bg-[#0f0f0f] border-[#2a2a2a] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">{t('endTime')}</Label>
                <Input
                  type="time"
                  value={officeEnd}
                  onChange={(e) => setOfficeEnd(e.target.value)}
                  className="mt-2 bg-[#0f0f0f] border-[#2a2a2a] text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-300 mb-3 block">{t('workingDays')}</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_KEYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleWorkDay(day.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      workDays.includes(day.value)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#252525]'
                    )}
                  >
                    {t(`weekdays.${day.key}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('outsideHoursMsg')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
