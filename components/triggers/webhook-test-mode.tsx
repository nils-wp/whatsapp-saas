'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square, Copy, Check, Loader2, AlertCircle, Webhook, Clock, Send, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WebhookTestModeProps {
  triggerId: string
  webhookId: string
  webhookSecret: string
  triggerType: string
}

interface TestEvent {
  timestamp: number
  payload: Record<string, unknown>
  extractedVariables: Record<string, string | null>
}

interface TestModeState {
  testMode: boolean
  expiresAt?: string
  remainingSeconds?: number
  hasEvent: boolean
  messagePreview?: string | null
  event?: TestEvent | null
}

export function WebhookTestMode({
  triggerId,
  webhookId,
  webhookSecret,
  triggerType,
}: WebhookTestModeProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [testState, setTestState] = useState<TestModeState | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/${webhookId}`

  // Check if this is a CRM trigger (not generic webhook)
  const isCRMTrigger = ['pipedrive', 'hubspot', 'monday', 'close', 'activecampaign'].includes(triggerType)

  // Poll for test events
  const pollTestMode = useCallback(async () => {
    try {
      const response = await fetch(`/api/triggers/${triggerId}/test-mode`)
      const data = await response.json()
      setTestState(data)
      return data
    } catch (error) {
      console.error('Poll error:', error)
      return null
    }
  }, [triggerId])

  // Trigger manual polling for CRMs that don't have native webhooks
  const triggerManualPoll = useCallback(async () => {
    if (!isCRMTrigger) return

    try {
      await fetch(`/api/triggers/${triggerId}/poll-now`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Manual poll error:', error)
    }
  }, [triggerId, isCRMTrigger])

  // Start polling when test mode is active
  useEffect(() => {
    if (!testState?.testMode) return

    // For polling CRMs (Close, HubSpot, ActiveCampaign), also trigger manual poll
    const pollingCRMs = ['close', 'hubspot', 'activecampaign']
    const needsManualPoll = pollingCRMs.includes(triggerType)

    const interval = setInterval(async () => {
      // First trigger manual poll for CRMs without native webhooks
      if (needsManualPoll) {
        await triggerManualPoll()
      }

      // Then check for events
      const data = await pollTestMode()
      if (data?.hasEvent) {
        toast.success('Event empfangen!')
        // Automatically stop test mode after first event
        stopTestMode()

        // Pre-fill phone number if available in event data
        const phone = data.event?.extractedVariables?.phone || data.event?.extractedVariables?.whatsapp_phone
        if (phone) setTestPhone(phone)
      }
    }, 1000) // Poll every 1 second

    // Also trigger immediate poll on start
    if (needsManualPoll) {
      triggerManualPoll()
    }

    return () => clearInterval(interval)
  }, [testState?.testMode, pollTestMode, triggerManualPoll, triggerType])

  async function startTestMode() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/triggers/${triggerId}/test-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setTestState({
          testMode: true,
          expiresAt: data.expiresAt,
          remainingSeconds: 300,
          hasEvent: false,
        })
        toast.success('Test Mode gestartet - warte auf Webhook Event...')
      } else {
        toast.error(data.error || 'Konnte Test Mode nicht starten')
      }
    } catch (error) {
      console.error('Start test mode error:', error)
      toast.error('Fehler beim Starten des Test Mode')
    } finally {
      setIsLoading(false)
    }
  }

  async function stopTestMode() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/triggers/${triggerId}/test-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setTestState(prev => prev ? { ...prev, testMode: false } : null)
        toast.success('Test Mode beendet')
      } else {
        toast.error(data.error || 'Konnte Test Mode nicht beenden')
      }
    } catch (error) {
      console.error('Stop test mode error:', error)
      toast.error('Fehler beim Beenden des Test Mode')
    } finally {
      setIsLoading(false)
    }
  }

  function copyToClipboard(text: string, type: 'webhook' | 'secret' | 'variable', variableName?: string) {
    navigator.clipboard.writeText(text)
    if (type === 'webhook') {
      setCopiedWebhook(true)
      setTimeout(() => setCopiedWebhook(false), 2000)
    } else if (type === 'secret') {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } else if (type === 'variable' && variableName) {
      setCopiedVariable(variableName)
      setTimeout(() => setCopiedVariable(null), 2000)
    }
    toast.success('Kopiert!')
  }

  async function sendTestMessage() {
    if (!testPhone) {
      toast.error('Bitte eine Telefonnummer eingeben')
      return
    }

    setIsSendingTest(true)
    try {
      const response = await fetch(`/api/triggers/${triggerId}/test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_phone: testPhone,
          trigger_data: testState?.event?.extractedVariables
        }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Test-Nachricht versendet!')
      } else {
        toast.error(data.error || 'Fehler beim Senden der Test-Nachricht')
      }
    } catch (error) {
      console.error('Send test message error:', error)
      toast.error('Fehler beim Senden der Test-Nachricht')
    } finally {
      setIsSendingTest(false)
    }
  }

  const getCrmName = (type: string) => {
    const names: Record<string, string> = {
      pipedrive: 'Pipedrive',
      hubspot: 'HubSpot',
      monday: 'Monday.com',
      close: 'Close CRM',
      activecampaign: 'ActiveCampaign',
      webhook: 'Webhook',
    }
    return names[type] || type
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00a884]/10 rounded-lg">
              <Webhook className="h-5 w-5 text-[#00a884]" />
            </div>
            <div>
              <CardTitle className="text-white">Webhook Test Mode</CardTitle>
              <CardDescription>
                Teste den Webhook mit echten {getCrmName(triggerType)} Events
              </CardDescription>
            </div>
          </div>
          {testState?.testMode && (
            <Badge variant="outline" className="border-[#00a884] text-[#00a884]">
              <Clock className="h-3 w-3 mr-1" />
              {testState.remainingSeconds}s verbleibend
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Webhook URL and Secret - Only for generic webhooks, not CRM triggers */}
        {!isCRMTrigger && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Webhook URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#0d0d0d] text-[#00a884] px-3 py-2 rounded text-sm font-mono overflow-x-auto">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  className="shrink-0"
                >
                  {copiedWebhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Webhook Secret (X-Webhook-Secret Header)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#0d0d0d] text-yellow-500 px-3 py-2 rounded text-sm font-mono">
                  {webhookSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookSecret, 'secret')}
                  className="shrink-0"
                >
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Test Mode Controls */}
        <div className="flex items-center gap-3 pt-2">
          {!testState?.testMode ? (
            <Button
              onClick={startTestMode}
              disabled={isLoading}
              className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Test Mode starten
            </Button>
          ) : (
            <Button
              onClick={stopTestMode}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              Test Mode beenden
            </Button>
          )}
        </div>

        {/* Waiting for Event */}
        {testState?.testMode && !testState.hasEvent && (
          <div className="flex items-center gap-3 p-4 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
            <Loader2 className="h-5 w-5 text-[#00a884] animate-spin" />
            <div>
              <p className="text-white font-medium">Warte auf Event...</p>
              <p className="text-sm text-gray-400">
                Löse jetzt ein Event in {getCrmName(triggerType)} aus, um die Daten zu erfassen.
              </p>
            </div>
          </div>
        )}

        {/* Event Received */}
        {testState?.hasEvent && testState.event && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#00a884]">
              <Check className="h-5 w-5" />
              <span className="font-medium">Event erfolgreich empfangen!</span>
            </div>

            {/* Extracted Variables */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Extrahierte Variablen</h4>
              <div className="bg-[#0d0d0d] rounded-lg border border-[#2a2a2a] divide-y divide-[#2a2a2a]">
                {Object.entries(testState.event.extractedVariables)
                  .filter(([, value]) => value !== null && value !== '')
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <code className="text-[#00a884] text-sm">{`{{${key}}}`}</code>
                        <span className="text-gray-400">=</span>
                        <span className="text-white">{value}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`{{${key}}}`, 'variable', key)}
                        className="h-7 w-7 p-0"
                      >
                        {copiedVariable === key ? (
                          <Check className="h-3 w-3 text-[#00a884]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                {Object.entries(testState.event.extractedVariables).filter(
                  ([, value]) => value !== null && value !== ''
                ).length === 0 && (
                    <div className="px-3 py-4 text-center text-gray-400">
                      <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                      <p>Keine Variablen extrahiert. Überprüfe das Payload-Format.</p>
                    </div>
                  )}
              </div>
            </div>

            {/* Raw Payload */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Raw Payload</h4>
              <pre className="bg-[#0d0d0d] rounded-lg border border-[#2a2a2a] p-3 text-xs text-gray-300 overflow-x-auto max-h-60">
                {JSON.stringify(testState.event.payload, null, 2)}
              </pre>
            </div>

            <Separator className="bg-[#2a2a2a]" />

            {/* Message Preview & Sending */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#00a884]/10 rounded-md">
                  <Send className="h-4 w-4 text-[#00a884]" />
                </div>
                <h4 className="text-sm font-medium text-white">Nachricht mittesten</h4>
              </div>

              {testState.messagePreview && (
                <div className="bg-[#0d0d0d] rounded-lg border border-[#2a2a2a] overflow-hidden">
                  <div className="px-3 py-2 bg-[#222] border-b border-[#2a2a2a] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Vorschau der Erstnachricht</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="bg-[#005c4b] text-white p-3 rounded-lg rounded-tl-none relative max-w-[90%] text-sm whitespace-pre-wrap">
                      {testState.messagePreview}
                      {/* Subtitle logic for WhatsApp bubble arrow */}
                      <div className="absolute top-0 -left-2 w-0 h-0 border-t-[8px] border-t-[#005c4b] border-l-[8px] border-l-transparent" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-gray-400 block">WhatsApp Nummer für den Test</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="z.B. 49151..."
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white h-9"
                  />
                  <Button
                    onClick={sendTestMessage}
                    disabled={isSendingTest || !testPhone}
                    size="sm"
                    className="bg-[#00a884] hover:bg-[#00a884]/90 text-white shrink-0"
                  >
                    {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Senden
                  </Button>
                </div>
                <p className="text-[10px] text-gray-500">
                  Die Nachricht wird über den verknüpften WhatsApp-Account an diese Nummer gesendet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!testState?.testMode && (
          <div className={cn(
            "p-4 rounded-lg border",
            "bg-blue-500/5 border-blue-500/20"
          )}>
            <h4 className="text-sm font-medium text-blue-400 mb-2">So funktioniert es</h4>
            {isCRMTrigger ? (
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Klicke auf &quot;Test Mode starten&quot;</li>
                <li>Löse das gewünschte Event in {getCrmName(triggerType)} aus (z.B. neuer Deal erstellt)</li>
                <li>Die empfangenen Daten und Variablen werden hier automatisch angezeigt</li>
                <li>Kopiere die Variablen für deine erste Nachricht</li>
              </ol>
            ) : (
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Konfiguriere den Webhook in {getCrmName(triggerType)} mit der URL und dem Secret oben</li>
                <li>Klicke auf &quot;Test Mode starten&quot;</li>
                <li>Löse das gewünschte Event in {getCrmName(triggerType)} aus (z.B. neuer Deal erstellt)</li>
                <li>Die empfangenen Daten und Variablen werden hier angezeigt</li>
                <li>Kopiere die Variablen für deine erste Nachricht</li>
              </ol>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
