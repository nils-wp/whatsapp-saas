'use client'

import { useState } from 'react'
import { Play, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { TriggerType } from '@/lib/utils/validation'

interface TriggerTestProps {
  webhookId: string
  webhookSecret: string
  triggerType: TriggerType
  firstMessage: string
}

interface TestResult {
  success: boolean
  status: number
  data: Record<string, unknown>
  duration: number
}

// Sample payloads for different CRM types
const SAMPLE_PAYLOADS: Record<TriggerType, Record<string, unknown>> = {
  webhook: {
    phone: '+49123456789',
    name: 'Max Mustermann',
    email: 'max@example.com',
    first_name: 'Max',
    last_name: 'Mustermann',
  },
  close: {
    event: 'lead.created',
    data: {
      id: 'lead_test123',
      display_name: 'Test Company GmbH',
      contacts: [{ name: 'Max Mustermann', phone: '+49123456789' }],
    },
    phone: '+49123456789',
    name: 'Max Mustermann',
  },
  activecampaign: {
    type: 'contact_tag_added',
    contact: {
      id: '123',
      email: 'max@example.com',
      firstName: 'Max',
      lastName: 'Mustermann',
      phone: '+49123456789',
    },
    phone: '+49123456789',
  },
  pipedrive: {
    event: 'added.person',
    current: {
      id: 123,
      name: 'Max Mustermann',
      first_name: 'Max',
      last_name: 'Mustermann',
      phone: [{ value: '+49123456789', primary: true }],
    },
    phone: '+49123456789',
  },
  hubspot: {
    subscriptionType: 'contact.creation',
    objectId: 123,
    properties: {
      firstname: 'Max',
      lastname: 'Mustermann',
      phone: '+49123456789',
    },
    phone: '+49123456789',
  },
  monday: {
    event: {
      type: 'create_item',
      pulseId: 123456,
      pulseName: 'Max Mustermann',
    },
    phone: '+49123456789',
    name: 'Max Mustermann',
  },
}

export function TriggerTest({
  webhookId,
  webhookSecret,
  triggerType,
  firstMessage,
}: TriggerTestProps) {
  const [phone, setPhone] = useState('+49123456789')
  const [name, setName] = useState('Test Kontakt')
  const [customPayload, setCustomPayload] = useState('')
  const [useCustomPayload, setUseCustomPayload] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhook/${webhookId}`

  // Build the test payload
  const buildPayload = (): Record<string, unknown> => {
    if (useCustomPayload && customPayload) {
      try {
        return JSON.parse(customPayload)
      } catch {
        throw new Error('Ungültiges JSON im Custom Payload')
      }
    }

    // Start with the sample payload for this CRM type
    const samplePayload = { ...SAMPLE_PAYLOADS[triggerType] }

    // Override phone and name with user input
    samplePayload.phone = phone
    if (name) {
      samplePayload.name = name
      samplePayload.first_name = name.split(' ')[0]
      samplePayload.last_name = name.split(' ').slice(1).join(' ') || ''
    }

    return samplePayload
  }

  // Preview the first message with variable substitution
  const previewFirstMessage = (): string => {
    let preview = firstMessage
    const payload = buildPayload()

    // Simple variable substitution for preview
    const variables: Record<string, string> = {
      '{{name}}': (payload.name as string) || '',
      '{{first_name}}': (payload.first_name as string) || name.split(' ')[0] || '',
      '{{last_name}}': (payload.last_name as string) || name.split(' ').slice(1).join(' ') || '',
      '{{vorname}}': (payload.first_name as string) || name.split(' ')[0] || '',
      '{{nachname}}': (payload.last_name as string) || name.split(' ').slice(1).join(' ') || '',
      '{{phone}}': phone,
      '{{email}}': (payload.email as string) || '',
    }

    for (const [key, value] of Object.entries(variables)) {
      preview = preview.replaceAll(key, value)
    }

    return preview
  }

  async function runTest() {
    setIsLoading(true)
    setResult(null)
    setError(null)

    const startTime = performance.now()

    try {
      const payload = buildPayload()

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      const duration = Math.round(performance.now() - startTime)

      setResult({
        success: response.ok,
        status: response.status,
        data,
        duration,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Trigger testen
          </CardTitle>
          <CardDescription>
            Teste den Webhook mit Beispieldaten, um die Konfiguration zu überprüfen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefonnummer *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49123456789"
              />
              <p className="text-xs text-muted-foreground">
                Mit Ländervorwahl (z.B. +49 für Deutschland)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
              />
            </div>
          </div>

          {/* Custom Payload Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="customPayload"
              checked={useCustomPayload}
              onChange={(e) => setUseCustomPayload(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="customPayload" className="text-sm cursor-pointer">
              Custom Payload verwenden (für fortgeschrittene Tests)
            </Label>
          </div>

          {useCustomPayload && (
            <div className="space-y-2">
              <Label>Custom JSON Payload</Label>
              <Textarea
                value={customPayload || JSON.stringify(SAMPLE_PAYLOADS[triggerType], null, 2)}
                onChange={(e) => setCustomPayload(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder={JSON.stringify(SAMPLE_PAYLOADS[triggerType], null, 2)}
              />
            </div>
          )}

          {/* First Message Preview */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Vorschau: Erste Nachricht</Label>
            <p className="text-sm whitespace-pre-wrap">{previewFirstMessage()}</p>
          </div>

          {/* Warning for real messages */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Achtung:</strong> Der Test sendet eine echte WhatsApp-Nachricht an die angegebene Nummer.
              Verwende eine Testnummer, die du kontrollierst.
            </AlertDescription>
          </Alert>

          {/* Test Button */}
          <Button
            onClick={runTest}
            disabled={isLoading || !phone}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test läuft...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test ausführen
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Test erfolgreich' : 'Test fehlgeschlagen'}
                </span>
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  Status: {result.status}
                </Badge>
                <Badge variant="outline">{result.duration}ms</Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Antwort:</Label>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-60 overflow-y-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              {result.success && typeof result.data.conversation_id === 'string' && (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Konversation erstellt! ID: <code>{result.data.conversation_id}</code>
                    <br />
                    <a
                      href={`/conversations/${result.data.conversation_id}`}
                      className="underline hover:no-underline"
                    >
                      Zur Konversation →
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variable Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Variablen</CardTitle>
          <CardDescription>
            Diese Variablen kannst du in der ersten Nachricht verwenden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Allgemein</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="bg-muted px-1 rounded">{'{{name}}'}</code> - Vollständiger Name</li>
                <li><code className="bg-muted px-1 rounded">{'{{first_name}}'}</code> - Vorname</li>
                <li><code className="bg-muted px-1 rounded">{'{{last_name}}'}</code> - Nachname</li>
                <li><code className="bg-muted px-1 rounded">{'{{vorname}}'}</code> - Vorname (DE)</li>
                <li><code className="bg-muted px-1 rounded">{'{{nachname}}'}</code> - Nachname (DE)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Kontakt</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="bg-muted px-1 rounded">{'{{phone}}'}</code> - Telefonnummer</li>
                <li><code className="bg-muted px-1 rounded">{'{{email}}'}</code> - E-Mail</li>
                <li><code className="bg-muted px-1 rounded">{'{{lead_id}}'}</code> - Lead-ID aus CRM</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
