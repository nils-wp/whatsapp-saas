'use client'

import { useState } from 'react'
import {
  Bell,
  Mail,
  Save,
  MessageSquare,
  Calendar,
  AlertTriangle,
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [email, setEmail] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')

  const [notifications, setNotifications] = useState({
    escalation: true,
    booking: true,
    dailySummary: false,
    weeklyReport: true,
    connectionLost: true,
    limitWarning: true,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    toast.success('Benachrichtigungs-Einstellungen gespeichert')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benachrichtigungen</h1>
          <p className="text-muted-foreground">
            Konfiguriere wie und wann du benachrichtigt werden möchtest.
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Benachrichtigungs-Kanäle</CardTitle>
                <CardDescription>
                  Wo möchtest du Benachrichtigungen erhalten?
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="notifications@firma.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Falls leer, wird die E-Mail deines Accounts verwendet
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="slack">Slack Webhook URL (optional)</Label>
              <Input
                id="slack"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Erhalte wichtige Benachrichtigungen direkt in Slack
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Benachrichtigungs-Typen</CardTitle>
                <CardDescription>
                  Wähle aus, worüber du informiert werden möchtest
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationToggle
              icon={AlertTriangle}
              title="Eskalationen"
              description="Wenn eine Konversation an einen Menschen eskaliert wird"
              checked={notifications.escalation}
              onCheckedChange={() => toggleNotification('escalation')}
            />
            <NotificationToggle
              icon={Calendar}
              title="Neue Buchungen"
              description="Wenn ein Lead einen Termin über Calendly bucht"
              checked={notifications.booking}
              onCheckedChange={() => toggleNotification('booking')}
            />
            <NotificationToggle
              icon={MessageSquare}
              title="Tägliche Zusammenfassung"
              description="Jeden Morgen eine Übersicht der letzten 24 Stunden"
              checked={notifications.dailySummary}
              onCheckedChange={() => toggleNotification('dailySummary')}
            />
            <NotificationToggle
              icon={Mail}
              title="Wöchentlicher Report"
              description="Jeden Montag eine Wochenübersicht mit Statistiken"
              checked={notifications.weeklyReport}
              onCheckedChange={() => toggleNotification('weeklyReport')}
            />

            <Separator />

            <div className="text-sm font-medium text-muted-foreground mb-2">
              System-Benachrichtigungen
            </div>

            <NotificationToggle
              icon={AlertTriangle}
              title="Verbindung verloren"
              description="Wenn eine WhatsApp-Nummer die Verbindung verliert"
              checked={notifications.connectionLost}
              onCheckedChange={() => toggleNotification('connectionLost')}
              important
            />
            <NotificationToggle
              icon={AlertTriangle}
              title="Limit-Warnung"
              description="Wenn du 80% deines Nachrichten-Limits erreicht hast"
              checked={notifications.limitWarning}
              onCheckedChange={() => toggleNotification('limitWarning')}
              important
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NotificationToggle({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  important = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  checked: boolean
  onCheckedChange: () => void
  important?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            important ? 'bg-destructive/10' : 'bg-secondary'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              important ? 'text-destructive' : 'text-muted-foreground'
            }`}
          />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
