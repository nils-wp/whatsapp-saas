'use client'

import { useState } from 'react'
import {
  Webhook,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  Plus,
  Settings,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useTenant } from '@/providers/tenant-provider'
import { useTriggers } from '@/lib/hooks/use-triggers'
import { useTranslations } from '@/providers/locale-provider'

export default function IntegrationsPage() {
  const t = useTranslations('integrations')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('title')}</h1>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Incoming Webhooks Section */}
      <IncomingWebhooksSection />

      {/* Outgoing Webhooks Section */}
      <OutgoingWebhooksSection />

      {/* CRM Integrations */}
      <CRMSection />
    </div>
  )
}

function IncomingWebhooksSection() {
  const { currentTenant } = useTenant()
  const { data: triggers } = useTriggers()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const t = useTranslations('integrations')

  const webhookTriggers = triggers?.filter(t => t.type === 'webhook') || []
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chatsetter.io'

  const copyToClipboard = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(t('copiedToClipboard'))
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{t('incomingWebhooks')}</h3>
            <p className="text-sm text-gray-500">{t('incomingDesc')}</p>
          </div>
        </div>
        <a
          href="/triggers/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('addWebhook')}
        </a>
      </div>

      {webhookTriggers.length === 0 ? (
        <div className="text-center py-8">
          <Webhook className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">{t('noWebhooks')}</p>
          <p className="text-gray-600 text-sm mt-1">{t('createWebhookHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhookTriggers.map((trigger) => {
            const webhookUrl = `${baseUrl}/api/webhook/${trigger.id}`
            return (
              <div
                key={trigger.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{trigger.name}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      trigger.is_active
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-gray-500/10 text-gray-500'
                    )}>
                      {trigger.is_active ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-mono truncate mt-1">{webhookUrl}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => copyToClipboard(trigger.id, webhookUrl)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
                  >
                    {copiedId === trigger.id ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={`/triggers/${trigger.id}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OutgoingWebhooksSection() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [events, setEvents] = useState({
    'message.received': true,
    'message.sent': true,
    'booking.created': true,
    'conversation.escalated': true,
    'conversation.completed': false,
  })
  const t = useTranslations('integrations')

  const toggleEvent = (event: string) => {
    setEvents(prev => ({ ...prev, [event]: !prev[event as keyof typeof events] }))
  }

  const eventsList = [
    { key: 'message.received', nameKey: 'events.messageReceived', descKey: 'events.messageReceivedDesc' },
    { key: 'message.sent', nameKey: 'events.messageSent', descKey: 'events.messageSentDesc' },
    { key: 'booking.created', nameKey: 'events.bookingCreated', descKey: 'events.bookingCreatedDesc' },
    { key: 'conversation.escalated', nameKey: 'events.escalation', descKey: 'events.escalationDesc' },
    { key: 'conversation.completed', nameKey: 'events.completed', descKey: 'events.completedDesc' },
  ]

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <ArrowUpFromLine className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{t('outgoingWebhooks')}</h3>
          <p className="text-sm text-gray-500">{t('outgoingDesc')}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-gray-300">{t('webhookUrl')}</Label>
          <input
            type="url"
            placeholder="https://your-endpoint.com/webhook"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full mt-2 px-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div>
          <Label className="text-gray-300 mb-3 block">{t('eventsToSend')}</Label>
          <div className="space-y-2">
            {eventsList.map((event) => (
              <div
                key={event.key}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]"
              >
                <div>
                  <p className="text-sm font-medium text-white">{t(event.nameKey)}</p>
                  <p className="text-xs text-gray-500">{t(event.descKey)}</p>
                </div>
                <Switch
                  checked={events[event.key as keyof typeof events]}
                  onCheckedChange={() => toggleEvent(event.key)}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => toast.success(t('settingsSaved'))}
          disabled={!webhookUrl}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('saveSettings')}
        </button>
      </div>
    </div>
  )
}

function CRMSection() {
  const [showActiveCampaignDialog, setShowActiveCampaignDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const t = useTranslations('integrations')
  const tCommon = useTranslations('common')

  return (
    <>
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Webhook className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{t('crm.title')}</h3>
            <p className="text-sm text-gray-500">{t('crm.subtitle')}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* ActiveCampaign */}
          <div className="p-5 rounded-xl bg-[#0f0f0f] border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#356AE6]/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#356AE6">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{t('activeCampaign.title')}</h4>
                  <p className="text-xs text-gray-500">{t('activeCampaign.subtitle')}</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/10 text-gray-400">
                {t('crm.notConnected')}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-gray-400 mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t('activeCampaign.autoCreateContacts')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t('activeCampaign.statusAsTags')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t('activeCampaign.messagesInNotes')}
              </li>
            </ul>
            <button
              onClick={() => setShowActiveCampaignDialog(true)}
              className="w-full py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium hover:bg-[#252525] transition-colors"
            >
              {t('crm.connect')}
            </button>
          </div>

          {/* Close CRM */}
          <div className="p-5 rounded-xl bg-[#0f0f0f] border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#f97316">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" fill="white" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{t('closeCrm.title')}</h4>
                  <p className="text-xs text-gray-500">{t('closeCrm.subtitle')}</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/10 text-gray-400">
                {t('crm.notConnected')}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-gray-400 mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t('closeCrm.autoCreateLeads')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t('closeCrm.messagesAsSms')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t('closeCrm.syncLeadStatus')}
              </li>
            </ul>
            <button
              onClick={() => setShowCloseDialog(true)}
              className="w-full py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium hover:bg-[#252525] transition-colors"
            >
              {t('crm.connect')}
            </button>
          </div>
        </div>
      </div>

      {/* ActiveCampaign Dialog */}
      <Dialog open={showActiveCampaignDialog} onOpenChange={setShowActiveCampaignDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">{t('activeCampaign.dialogTitle')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('activeCampaign.dialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">{t('activeCampaign.accountUrl')}</Label>
              <Input
                placeholder="https://yourname.api-us1.com"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
              <p className="text-xs text-gray-500">{t('activeCampaign.accountUrlHint')}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">{t('activeCampaign.apiKey')}</Label>
              <Input
                type="password"
                placeholder={t('activeCampaign.apiKeyPlaceholder')}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowActiveCampaignDialog(false)}
              className="px-4 py-2 rounded-lg bg-[#252525] text-gray-300 hover:text-white transition-colors"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={() => {
                toast.success('ActiveCampaign ' + t('crm.connected'))
                setShowActiveCampaignDialog(false)
              }}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              {t('crm.connect')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">{t('closeCrm.dialogTitle')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('closeCrm.dialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">{t('activeCampaign.apiKey')}</Label>
              <Input
                type="password"
                placeholder="api_xxxxxxxxxxxxxxxx"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
              <p className="text-xs text-gray-500">{t('closeCrm.apiKeyHint')}</p>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowCloseDialog(false)}
              className="px-4 py-2 rounded-lg bg-[#252525] text-gray-300 hover:text-white transition-colors"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={() => {
                toast.success('Close CRM ' + t('crm.connected'))
                setShowCloseDialog(false)
              }}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              {t('crm.connect')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
