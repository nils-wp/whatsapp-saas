'use client'

import { useState } from 'react'
import { Phone, CheckCircle, XCircle, Loader2, Search, Copy, Check, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { toast } from 'sonner'

interface CheckResult {
  success: boolean
  phone: string
  formattedPhone: string
  hasWhatsApp: boolean
  jid: string | null
  error?: string
}

export default function ToolsPage() {
  const [phone, setPhone] = useState('')
  const [accountId, setAccountId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<CheckResult[]>([])

  const { data: accounts } = useAccounts()
  const connectedAccounts = accounts?.filter(a => a.status === 'connected') || []

  async function checkNumber() {
    if (!phone.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/whatsapp/check-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          accountId: accountId || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          phone: phone.trim(),
          formattedPhone: phone.trim(),
          hasWhatsApp: false,
          jid: null,
          error: data.error || 'Unbekannter Fehler',
        })
        return
      }

      const checkResult: CheckResult = {
        success: true,
        phone: data.phone,
        formattedPhone: data.formattedPhone,
        hasWhatsApp: data.hasWhatsApp,
        jid: data.jid,
      }

      setResult(checkResult)

      // Add to history (keep last 10)
      setHistory(prev => [checkResult, ...prev.slice(0, 9)])
    } catch (err) {
      setResult({
        success: false,
        phone: phone.trim(),
        formattedPhone: phone.trim(),
        hasWhatsApp: false,
        jid: null,
        error: err instanceof Error ? err.message : 'Verbindungsfehler',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function copyNumber(number: string) {
    navigator.clipboard.writeText(number)
    setCopied(true)
    toast.success('Nummer kopiert')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      checkNumber()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Tools</h1>
        <p className="text-gray-400">
          Hilfreiche Werkzeuge für deine WhatsApp-Automatisierung
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* WhatsApp Number Check */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-500" />
              WhatsApp Nummern-Check
            </CardTitle>
            <CardDescription>
              Prüfe ob eine Telefonnummer bei WhatsApp registriert ist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Telefonnummer</Label>
                <div className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="+49 123 456789 oder 0049123456789"
                    className="flex-1"
                  />
                  <Button
                    onClick={checkNumber}
                    disabled={isLoading || !phone.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mit Ländervorwahl eingeben (z.B. +49 für Deutschland, +43 für Österreich)
                </p>
              </div>

              {connectedAccounts.length > 1 && (
                <div className="space-y-2">
                  <Label>WhatsApp Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Automatisch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Automatisch (erster verfügbarer)</SelectItem>
                      {connectedAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.display_name || account.instance_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className="pt-4 border-t">
                {result.error ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                    <div className={`p-3 rounded-full ${result.hasWhatsApp ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {result.hasWhatsApp ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg">{result.formattedPhone}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyNumber(result.phone)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className={`text-sm font-medium ${result.hasWhatsApp ? 'text-green-500' : 'text-red-500'}`}>
                        {result.hasWhatsApp
                          ? 'Hat WhatsApp'
                          : 'Kein WhatsApp'}
                      </p>
                      {result.jid && (
                        <p className="text-xs text-muted-foreground mt-1">
                          JID: {result.jid}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No connected account warning */}
            {connectedAccounts.length === 0 && (
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  Du benötigst einen verbundenen WhatsApp Account um Nummern zu prüfen.
                  <a href="/accounts" className="underline ml-1">
                    Account verbinden →
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Letzte Prüfungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={`${item.phone}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.hasWhatsApp ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-mono">{item.formattedPhone}</span>
                    </div>
                    <Badge variant={item.hasWhatsApp ? 'default' : 'destructive'}>
                      {item.hasWhatsApp ? 'WhatsApp' : 'Kein WhatsApp'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
