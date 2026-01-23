'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square, Copy, Check, Loader2, AlertCircle, Webhook, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/${webhookId}`

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

  // Start polling when test mode is active
  useEffect(() => {
    if (!testState?.testMode) return

    const interval = setInterval(async () => {
      const data = await pollTestMode()
      if (data?.hasEvent) {
        toast.success('Webhook Event empfangen!')
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [testState?.testMode, pollTestMode])

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
        setTestState(null)
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
        {/* Webhook URL and Secret */}
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
          </div>
        )}

        {/* Instructions */}
        {!testState?.testMode && (
          <div className={cn(
            "p-4 rounded-lg border",
            "bg-blue-500/5 border-blue-500/20"
          )}>
            <h4 className="text-sm font-medium text-blue-400 mb-2">So funktioniert es</h4>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Konfiguriere den Webhook in {getCrmName(triggerType)} mit der URL und dem Secret oben</li>
              <li>Klicke auf &quot;Test Mode starten&quot;</li>
              <li>Löse das gewünschte Event in {getCrmName(triggerType)} aus (z.B. neuer Deal erstellt)</li>
              <li>Die empfangenen Daten und Variablen werden hier angezeigt</li>
              <li>Kopiere die Variablen für deine erste Nachricht</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
