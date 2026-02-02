'use client'

import { useState, useEffect } from 'react'
import { Phone, CheckCircle, XCircle, Loader2, Search, Copy, Check, Smartphone, Plus, Trash2, Globe, Link as LinkIcon, AlertTriangle, Code } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAccounts } from '@/lib/hooks/use-accounts'
import { toast } from 'sonner'
import type { Tables } from '@/types/database'

type NumberCheckConfig = Tables<'number_check_configs'> & {
  whatsapp_account?: { instance_name: string; display_name: string | null } | null
}

interface CheckResult {
  success: boolean
  phone: string
  formattedPhone: string
  hasWhatsApp: boolean
  jid: string | null
  error?: string
}

const generateSnippet = (slug: string, origin: string = '') => {
  return `// Füge diese Funktion in dein Skript ein
async function checkWhatsApp(phone) {
  try {
    const res = await fetch('${origin}/api/tools/check/${slug}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    return data.exists; // true = Nummer hat WhatsApp
  } catch (e) {
    console.error('Check failed', e);
    return true; // Im Zweifel erlauben
  }
}

// Beispiel Aufruf:
// const hasWhatsApp = await checkWhatsApp("+4912345678");`
}

const generateFullEmbedCode = (slug: string, origin: string = '') => {
  return `<!-- WhatsApp Nummer-Check von Chatsetter -->
<script>
(function() {
  const CHATSETTER_API = '${origin}/api/tools/check/${slug}';

  // WhatsApp Check Funktion
  async function checkWhatsApp(phone) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) return { valid: false, error: 'Nummer zu kurz' };

    try {
      const res = await fetch(CHATSETTER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      return { valid: data.exists, phone: data.formatted || cleanPhone };
    } catch (e) {
      console.error('[Chatsetter] Check failed:', e);
      return { valid: true, phone: cleanPhone }; // Im Fehlerfall erlauben
    }
  }

  // Automatische Validierung für Inputs mit data-whatsapp-check
  document.querySelectorAll('input[data-whatsapp-check]').forEach(input => {
    let timeout;
    const indicator = document.createElement('span');
    indicator.style.cssText = 'margin-left:8px;font-size:14px;';
    input.parentNode.insertBefore(indicator, input.nextSibling);

    input.addEventListener('input', function() {
      clearTimeout(timeout);
      const phone = this.value.replace(/[^0-9+]/g, '');

      if (phone.length < 10) {
        indicator.textContent = '';
        return;
      }

      indicator.textContent = '⏳';
      timeout = setTimeout(async () => {
        const result = await checkWhatsApp(phone);
        indicator.textContent = result.valid ? '✅' : '❌';
        this.dataset.hasWhatsapp = result.valid;
      }, 500);
    });
  });

  // Global verfügbar machen
  window.checkWhatsApp = checkWhatsApp;
})();
</script>

<!-- Beispiel: Füge data-whatsapp-check zu deinem Input hinzu -->
<!-- <input type="tel" name="phone" data-whatsapp-check placeholder="+49 123 456789"> -->`
}

const generateFormValidationCode = (slug: string, origin: string = '') => {
  return `// Formular-Validierung vor dem Absenden
document.getElementById('mein-formular').addEventListener('submit', async function(e) {
  e.preventDefault();

  const phoneInput = this.querySelector('input[name="phone"]');
  const phone = phoneInput.value.replace(/[^0-9+]/g, '');

  // Visuelles Feedback
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Prüfe Nummer...';
  submitBtn.disabled = true;

  try {
    const res = await fetch('${origin}/api/tools/check/${slug}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();

    if (!data.exists) {
      alert('Diese Nummer ist nicht auf WhatsApp registriert. Bitte gib eine gültige WhatsApp-Nummer ein.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      phoneInput.focus();
      return;
    }

    // Nummer ist gültig - Formular absenden
    this.submit();
  } catch (error) {
    // Bei Fehler trotzdem absenden
    this.submit();
  }
});`
}

export default function ToolsPage() {
  const [phone, setPhone] = useState('')
  const [accountId, setAccountId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<CheckResult[]>([])

  // Config Management States
  const [configs, setConfigs] = useState<NumberCheckConfig[]>([])
  const [isConfigsLoading, setIsConfigsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newConfigName, setNewConfigName] = useState('')
  const [newConfigSlug, setNewConfigSlug] = useState('')
  const [newConfigAccountId, setNewConfigAccountId] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Code Integration Dialog
  const [selectedConfig, setSelectedConfig] = useState<NumberCheckConfig | null>(null)
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false)

  const { data: accounts } = useAccounts()
  const connectedAccounts = accounts?.filter(a => a.status === 'connected') || []

  // Load configs on mount
  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/settings/number-checks')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error) {
      console.error('Failed to load configs', error)
    } finally {
      setIsConfigsLoading(false)
    }
  }

  async function createConfig() {
    if (!newConfigName || !newConfigSlug) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/settings/number-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newConfigName,
          slug: newConfigSlug,
          whatsapp_account_id: newConfigAccountId === 'auto' ? undefined : newConfigAccountId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.details || data.error || 'Fehler beim Erstellen')
        return
      }

      toast.success('Widget erstellt')
      setConfigs([data, ...configs])
      setIsDialogOpen(false)
      setNewConfigName('')
      setNewConfigSlug('')
      setNewConfigAccountId('')
    } catch (error) {
      toast.error('Verbindungsfehler')
    } finally {
      setIsCreating(false)
    }
  }

  async function deleteConfig(id: string) {
    if (!confirm('Wirklich löschen? Der Webhook wird nicht mehr funktionieren.')) return

    try {
      const response = await fetch(`/api/settings/number-checks/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setConfigs(configs.filter(c => c.id !== id))
        toast.success('Gelöscht')
      } else {
        toast.error('Konnte nicht gelöscht werden')
      }
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

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
          accountId: accountId === 'auto' ? undefined : accountId,
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
    toast.success('Kopiert')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      checkNumber()
    }
  }

  // Auto-generate slug from name
  useEffect(() => {
    if (newConfigName && !newConfigSlug) {
      setNewConfigSlug(newConfigName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    }
  }, [newConfigName])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Tools</h1>
        <p className="text-gray-400">
          Hilfreiche Werkzeuge für deine WhatsApp-Automatisierung
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config Management */}
        <Card className="lg:col-span-2 border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-emerald-500">
                  <Globe className="h-5 w-5" />
                  Öffentliche Nummer-Checks
                </CardTitle>
                <CardDescription>
                  Erstelle öffentliche Webhooks um Telefonnummern in deinen Funnels zu prüfen (CORS enabled)
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neues Number Check Widget</DialogTitle>
                    <DialogDescription>
                      Erstellt einen öffentlichen Endpunkt zur Validierung von Nummern via API.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name (z.B. "VSL Funnel")</Label>
                      <Input
                        value={newConfigName}
                        onChange={(e) => setNewConfigName(e.target.value)}
                        placeholder="Mein Funnel Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug</Label>
                      <div className="flex items-center">
                        <span className="bg-muted px-3 py-2 rounded-l-md border border-r-0 text-muted-foreground text-sm">
                          .../api/tools/check/
                        </span>
                        <Input
                          value={newConfigSlug}
                          onChange={(e) => setNewConfigSlug(e.target.value)}
                          placeholder="mein-funnel"
                          className="rounded-l-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Verwendeter WhatsApp Account</Label>
                      <Select value={newConfigAccountId} onValueChange={setNewConfigAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Automatisch (erster verfügbarer)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatisch</SelectItem>
                          {connectedAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.display_name || account.instance_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
                    <Button onClick={createConfig} disabled={isCreating || !newConfigName || !newConfigSlug}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Erstellen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isConfigsLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                Du hast noch keine öffentlichen Checks erstellt.
              </div>
            ) : (
              <div className="space-y-4">
                {configs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{config.name}</h4>
                        {config.whatsapp_account && (
                          <Badge variant="outline" className="text-xs">
                            {config.whatsapp_account.display_name || config.whatsapp_account.instance_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate max-w-[300px] md:max-w-[500px]">
                          {typeof window !== 'undefined' ? `${window.location.origin}/api/tools/check/${config.slug}` : `/api/tools/check/${config.slug}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedConfig(config)
                          setIsCodeDialogOpen(true)
                        }}
                        title="Code Snippet anzeigen"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyNumber(typeof window !== 'undefined' ? `${window.location.origin}/api/tools/check/${config.slug}` : "")}
                        title="URL kopieren"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Check */}
        <Card className="lg:col-span-2">
          {/* ... Card Header ... */}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Manueller Nummern-Check
            </CardTitle>
            <CardDescription>
              Prüfe eine einzelne Nummer direkt hier im Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* ... Inputs ... */}
              <div className="space-y-2 md:col-span-2">
                <Label>Telefonnummer</Label>
                <div className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="+49 123 456789"
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
              </div>

              {connectedAccounts.length > 1 && (
                <div className="space-y-2">
                  <Label>Verwendeter Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Automatisch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatisch</SelectItem>
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

                    </div>
                  </div>
                )}
              </div>
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
                    key={`${item.phone}-${index}-${Date.now()}`}
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
      {/* Code Integration Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl">WhatsApp Nummer-Check einbinden</DialogTitle>
            <DialogDescription>
              Wähle die passende Integration für dein Formular. Kopiere den Code und füge ihn in deine Seite ein.
            </DialogDescription>
          </DialogHeader>

          {selectedConfig && (
            <div className="space-y-6">
              {/* Option 1: Einfaches Embed Script */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-sm font-bold">1</div>
                  <h3 className="font-semibold text-white">Einfachste Variante: Auto-Validierung</h3>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Empfohlen</Badge>
                </div>
                <p className="text-sm text-gray-400 pl-8">
                  Füge diesen Code am Ende deiner Seite ein (vor &lt;/body&gt;). Dann markiere dein Telefon-Input mit <code className="bg-zinc-800 px-1 rounded">data-whatsapp-check</code>.
                </p>
                <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-[#0d0d0d]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 z-10"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      navigator.clipboard.writeText(generateFullEmbedCode(selectedConfig.slug, origin))
                      toast.success('Code kopiert!')
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Kopieren
                  </Button>
                  <div className="p-4 pt-10 overflow-x-auto max-h-[200px]">
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                      {generateFullEmbedCode(selectedConfig.slug, typeof window !== 'undefined' ? window.location.origin : '')}
                    </pre>
                  </div>
                </div>
                <div className="pl-8 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-400">
                    <strong>So verwendest du es:</strong> Füge <code className="bg-zinc-800 px-1 rounded">data-whatsapp-check</code> zu deinem Input hinzu:
                  </p>
                  <pre className="mt-2 text-xs font-mono text-gray-300 bg-zinc-900 p-2 rounded">
{`<input type="tel" name="phone" data-whatsapp-check placeholder="+49 123 456789">`}
                  </pre>
                  <p className="text-xs text-gray-400 mt-2">
                    Das Script zeigt automatisch ✅ oder ❌ neben dem Input an.
                  </p>
                </div>
              </div>

              {/* Option 2: Formular-Validierung */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-sm font-bold">2</div>
                  <h3 className="font-semibold text-white">Formular beim Absenden prüfen</h3>
                </div>
                <p className="text-sm text-gray-400 pl-8">
                  Blockiert das Absenden, wenn die Nummer kein WhatsApp hat. Ersetze <code className="bg-zinc-800 px-1 rounded">mein-formular</code> mit der ID deines Formulars.
                </p>
                <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-[#0d0d0d]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 z-10"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      navigator.clipboard.writeText(generateFormValidationCode(selectedConfig.slug, origin))
                      toast.success('Code kopiert!')
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Kopieren
                  </Button>
                  <div className="p-4 pt-10 overflow-x-auto max-h-[200px]">
                    <pre className="text-xs font-mono text-blue-400 whitespace-pre-wrap">
                      {generateFormValidationCode(selectedConfig.slug, typeof window !== 'undefined' ? window.location.origin : '')}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Option 3: Nur die Funktion */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-sm font-bold">3</div>
                  <h3 className="font-semibold text-white">Nur die Check-Funktion</h3>
                </div>
                <p className="text-sm text-gray-400 pl-8">
                  Für Entwickler, die die Validierung selbst einbauen möchten.
                </p>
                <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-[#0d0d0d]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 z-10"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      navigator.clipboard.writeText(generateSnippet(selectedConfig.slug, origin))
                      toast.success('Code kopiert!')
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Kopieren
                  </Button>
                  <div className="p-4 pt-10 overflow-x-auto max-h-[150px]">
                    <pre className="text-xs font-mono text-purple-400 whitespace-pre-wrap">
                      {generateSnippet(selectedConfig.slug, typeof window !== 'undefined' ? window.location.origin : '')}
                    </pre>
                  </div>
                </div>
              </div>

              {/* API Info */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <strong>API Endpoint:</strong>{' '}
                      <code className="bg-zinc-800 px-2 py-0.5 rounded font-mono text-xs">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/api/tools/check/{selectedConfig.slug}
                      </code>
                    </p>
                    <p className="text-gray-400">
                      Dieser Endpunkt ist öffentlich (CORS enabled) und kann von jeder Domain aufgerufen werden.
                      Die API akzeptiert POST-Requests mit <code className="bg-zinc-800 px-1 rounded">{'{ "phone": "+49..." }'}</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
