'use client'

import { useState } from 'react'
import { Search, CheckCircle, XCircle, Loader2, Database, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { TriggerType } from '@/lib/utils/validation'

interface CRMTriggerTestProps {
  triggerType: TriggerType
  firstMessage: string
}

interface TestResult {
  success: boolean
  crmType: string
  rawData: Record<string, unknown> | null
  extractedVariables: Record<string, string | null>
  availableVariables: Array<{ key: string; description: string; example: string | null }>
  error?: string
}

const CRM_LABELS: Record<TriggerType, string> = {
  webhook: 'Webhook',
  close: 'Close CRM',
  activecampaign: 'ActiveCampaign',
  pipedrive: 'Pipedrive',
  hubspot: 'HubSpot',
  monday: 'Monday.com',
}

export function CRMTriggerTest({ triggerType, firstMessage }: CRMTriggerTestProps) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Preview first message with variables
  const previewFirstMessage = (): string => {
    if (!result?.extractedVariables) return firstMessage

    let preview = firstMessage
    for (const [key, value] of Object.entries(result.extractedVariables)) {
      if (value) {
        preview = preview.replaceAll(`{{${key}}}`, value)
      }
    }
    return preview
  }

  async function runTest() {
    if (!phone && !email) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/integrations/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmType: triggerType,
          phone: phone || undefined,
          email: email || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          crmType: triggerType,
          rawData: null,
          extractedVariables: {},
          availableVariables: [],
          error: data.error || 'Unbekannter Fehler',
        })
        return
      }

      setResult(data)
    } catch (err) {
      setResult({
        success: false,
        crmType: triggerType,
        rawData: null,
        extractedVariables: {},
        availableVariables: [],
        error: err instanceof Error ? err.message : 'Verbindungsfehler',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function copyVariable(key: string) {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // For webhook type, just show the available variables
  if (triggerType === 'webhook') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Verfügbare Variablen
          </CardTitle>
          <CardDescription>
            Diese Variablen kannst du in der ersten Nachricht verwenden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { key: '{{name}}', description: 'Name aus Payload', example: 'Max Mustermann' },
              { key: '{{first_name}}', description: 'Vorname aus Payload', example: 'Max' },
              { key: '{{last_name}}', description: 'Nachname aus Payload', example: 'Mustermann' },
              { key: '{{email}}', description: 'E-Mail aus Payload', example: 'max@example.com' },
              { key: '{{phone}}', description: 'Telefon aus Payload (erforderlich)', example: '+49123456789' },
            ].map((variable) => (
              <div
                key={variable.key}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-0.5 rounded text-sm font-mono">
                      {variable.key}
                    </code>
                    <span className="text-sm text-muted-foreground">{variable.description}</span>
                  </div>
                  {variable.example && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Beispiel: <span className="text-foreground">{variable.example}</span>
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyVariable(variable.key)}
                  className="ml-2"
                >
                  {copiedKey === variable.key ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          CRM-Verbindung testen
        </CardTitle>
        <CardDescription>
          Teste die {CRM_LABELS[triggerType]}-Verbindung und sieh welche Daten verfügbar sind
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Telefonnummer</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49123456789"
            />
          </div>
          <div className="space-y-2">
            <Label>E-Mail</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max@example.com"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Gib eine Telefonnummer oder E-Mail ein, die in {CRM_LABELS[triggerType]} existiert,
          um die Daten abzurufen.
        </p>

        {/* Test Button */}
        <Button
          onClick={runTest}
          disabled={isLoading || (!phone && !email)}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Suche in {CRM_LABELS[triggerType]}...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              In {CRM_LABELS[triggerType]} suchen
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            {/* Status */}
            <div className="flex items-center gap-2">
              {result.success && result.rawData ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">Kontakt gefunden!</span>
                </>
              ) : result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-blue-600">Verbindung OK</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600">Nicht gefunden</span>
                </>
              )}
            </div>

            {result.error && (
              <Alert variant="destructive">
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}

            {/* Available Variables */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Verfügbare Variablen</Label>
              <div className="space-y-2">
                {result.availableVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="bg-background px-2 py-0.5 rounded text-sm font-mono">
                          {variable.key}
                        </code>
                        <span className="text-sm text-muted-foreground">{variable.description}</span>
                      </div>
                      {variable.example && (
                        <p className="text-xs mt-1">
                          Wert: <Badge variant="secondary">{variable.example}</Badge>
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyVariable(variable.key)}
                      className="ml-2"
                    >
                      {copiedKey === variable.key ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Preview */}
            {result.success && result.rawData && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vorschau: Erste Nachricht</Label>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{previewFirstMessage()}</p>
                </div>
              </div>
            )}

            {/* Raw Data */}
            {result.rawData && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rohdaten aus {CRM_LABELS[triggerType]}</Label>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-60 overflow-y-auto">
                  {JSON.stringify(result.rawData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
