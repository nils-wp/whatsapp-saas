'use client'

import { useState } from 'react'
import {
  Webhook,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  ExternalLink,
  Key,
  RefreshCw,
  Plus,
  Trash2,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrationen</h1>
        <p className="text-muted-foreground">
          Verbinde externe Tools und automatisiere deine Workflows.
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhooksSection />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <CRMSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WebhooksSection() {
  const [copiedIncoming, setCopiedIncoming] = useState(false)
  const [copiedOutgoing, setCopiedOutgoing] = useState(false)

  const incomingWebhookUrl = 'https://chatsetter.io/api/webhook/abc123'
  const outgoingWebhookUrl = ''

  const copyToClipboard = (text: string, type: 'incoming' | 'outgoing') => {
    navigator.clipboard.writeText(text)
    if (type === 'incoming') {
      setCopiedIncoming(true)
      setTimeout(() => setCopiedIncoming(false), 2000)
    } else {
      setCopiedOutgoing(true)
      setTimeout(() => setCopiedOutgoing(false), 2000)
    }
    toast.success('In Zwischenablage kopiert')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Incoming Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Incoming Webhooks</CardTitle>
              <CardDescription>
                Empfange Daten von externen Tools um Konversationen zu starten
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                value={incomingWebhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(incomingWebhookUrl, 'incoming')}
              >
                {copiedIncoming ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Beispiel Request</Label>
            <div className="rounded-lg bg-secondary p-4 font-mono text-sm">
              <pre className="overflow-x-auto text-muted-foreground">
{`POST ${incomingWebhookUrl}
Content-Type: application/json

{
  "phone": "+491512345678",
  "name": "Max Mustermann",
  "trigger_id": "your-trigger-id",
  "custom_data": {
    "source": "landing-page",
    "campaign": "summer-2024"
  }
}`}
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="font-medium">Webhook aktiv</div>
              <div className="text-sm text-muted-foreground">
                Incoming Webhooks empfangen
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Outgoing Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowUpFromLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Outgoing Webhooks</CardTitle>
              <CardDescription>
                Sende Events an externe Tools bei Konversations-Updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://your-endpoint.com/webhook"
              value={outgoingWebhookUrl}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Gesendete Events</Label>
            <div className="space-y-2">
              <EventToggle
                name="Neue Nachricht"
                description="Bei jeder eingehenden Nachricht"
                event="message.received"
                defaultChecked
              />
              <EventToggle
                name="Nachricht gesendet"
                description="Bei jeder ausgehenden Nachricht"
                event="message.sent"
                defaultChecked
              />
              <EventToggle
                name="Termin gebucht"
                description="Wenn ein Lead einen Termin bucht"
                event="booking.created"
                defaultChecked
              />
              <EventToggle
                name="Eskalation"
                description="Wenn eine Konversation eskaliert wird"
                event="conversation.escalated"
                defaultChecked
              />
              <EventToggle
                name="Konversation beendet"
                description="Wenn eine Konversation abgeschlossen wird"
                event="conversation.completed"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Beispiel Payload</Label>
            <div className="rounded-lg bg-secondary p-4 font-mono text-sm">
              <pre className="overflow-x-auto text-muted-foreground">
{`{
  "event": "message.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "conversation_id": "conv_abc123",
  "contact": {
    "phone": "+491512345678",
    "name": "Max Mustermann"
  },
  "message": {
    "content": "Hallo, ich interessiere mich...",
    "type": "text"
  }
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EventToggle({
  name,
  description,
  event,
  defaultChecked = false,
}: {
  name: string
  description: string
  event: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  )
}

function CRMSection() {
  const [showActiveCampaignDialog, setShowActiveCampaignDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ActiveCampaign */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#356AE6]/10">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="#356AE6">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <CardTitle>ActiveCampaign</CardTitle>
                  <CardDescription>
                    Synchronisiere Kontakte und Konversationen
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">Nicht verbunden</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verbinde ActiveCampaign um Kontakte automatisch zu synchronisieren,
              Tags zu vergeben und Automationen auszulösen.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Kontakte automatisch anlegen
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Konversations-Status als Tags
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Nachrichten in Notes speichern
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => setShowActiveCampaignDialog(true)}
            >
              <Key className="mr-2 h-4 w-4" />
              Verbinden
            </Button>
          </CardContent>
        </Card>

        {/* Close CRM */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1C2B3A]/10">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="#1C2B3A">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" fill="white" />
                  </svg>
                </div>
                <div>
                  <CardTitle>Close CRM</CardTitle>
                  <CardDescription>
                    Leads und SMS-Kommunikation synchronisieren
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">Nicht verbunden</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verbinde Close um Leads zu synchronisieren und WhatsApp-Nachrichten
              als SMS-Aktivitäten zu speichern.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Leads automatisch anlegen
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Nachrichten als SMS speichern
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Lead-Status synchronisieren
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => setShowCloseDialog(true)}
            >
              <Key className="mr-2 h-4 w-4" />
              Verbinden
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Custom Webhook Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Eigene Integration</CardTitle>
              <CardDescription>
                Nutze Webhooks um jedes Tool zu verbinden
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Für Tools die nicht nativ unterstützt werden, kannst du unsere
            Webhooks nutzen. Sende Incoming-Webhooks um Konversationen zu starten
            und empfange Outgoing-Webhooks für Updates.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a
                href="https://docs.chatsetter.io/webhooks"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Dokumentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ActiveCampaign Dialog */}
      <Dialog open={showActiveCampaignDialog} onOpenChange={setShowActiveCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ActiveCampaign verbinden</DialogTitle>
            <DialogDescription>
              Gib deine ActiveCampaign API-Daten ein um die Integration zu aktivieren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ac-url">Account URL</Label>
              <Input
                id="ac-url"
                placeholder="https://yourname.api-us1.com"
              />
              <p className="text-xs text-muted-foreground">
                Findest du unter Settings → Developer
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac-key">API Key</Label>
              <Input
                id="ac-key"
                type="password"
                placeholder="Dein ActiveCampaign API Key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActiveCampaignDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => {
              toast.success('ActiveCampaign verbunden')
              setShowActiveCampaignDialog(false)
            }}>
              Verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close CRM verbinden</DialogTitle>
            <DialogDescription>
              Gib deinen Close API Key ein um die Integration zu aktivieren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="close-key">API Key</Label>
              <Input
                id="close-key"
                type="password"
                placeholder="api_xxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                Findest du unter Settings → API Keys
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => {
              toast.success('Close CRM verbunden')
              setShowCloseDialog(false)
            }}>
              Verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
