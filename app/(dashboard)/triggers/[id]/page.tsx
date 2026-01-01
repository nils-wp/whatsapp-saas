'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/shared/loading-spinner'
import { WebhookGenerator } from '@/components/triggers/webhook-generator'
import { useTrigger, useUpdateTrigger } from '@/lib/hooks/use-triggers'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useAgents } from '@/lib/hooks/use-agents'
import { triggerSchema, type TriggerFormData } from '@/lib/utils/validation'
import { toast } from 'sonner'

export default function EditTriggerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: trigger, isLoading } = useTrigger(id)
  const updateTrigger = useUpdateTrigger()
  const { data: accounts } = useAccounts()
  const { data: agents } = useAgents()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TriggerFormData>({
    resolver: zodResolver(triggerSchema),
    values: trigger ? {
      name: trigger.name,
      type: trigger.type as 'webhook' | 'activecampaign' | 'close',
      whatsapp_account_id: trigger.whatsapp_account_id || '',
      agent_id: trigger.agent_id || '',
      first_message: trigger.first_message,
      first_message_delay_seconds: trigger.first_message_delay_seconds,
    } : undefined,
  })

  const isActive = trigger?.is_active ?? true

  async function onSubmit(data: TriggerFormData) {
    try {
      await updateTrigger.mutateAsync({ id, ...data })
      toast.success('Trigger gespeichert')
    } catch (error) {
      toast.error('Fehler beim Speichern')
    }
  }

  async function toggleActive() {
    try {
      await updateTrigger.mutateAsync({ id, is_active: !isActive })
      toast.success(isActive ? 'Trigger deaktiviert' : 'Trigger aktiviert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!trigger) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Trigger nicht gefunden</p>
        <Link href="/triggers">
          <Button variant="outline" className="mt-4">
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/triggers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{trigger.name}</h1>
            <p className="text-muted-foreground">
              Trigger bearbeiten
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={toggleActive}
              id="is_active"
            />
            <Label htmlFor="is_active">
              {isActive ? 'Aktiv' : 'Inaktiv'}
            </Label>
          </div>
          <Button onClick={handleSubmit(onSubmit)} disabled={updateTrigger.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="stats">Statistiken</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grundeinstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp Account</Label>
                  <Select
                    value={watch('whatsapp_account_id')}
                    onValueChange={(value) => setValue('whatsapp_account_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.display_name || account.instance_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Agent</Label>
                  <Select
                    value={watch('agent_id')}
                    onValueChange={(value) => setValue('agent_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agents?.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Erste Nachricht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nachricht</Label>
                <Textarea {...register('first_message')} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Verzögerung (Sekunden)</Label>
                <Input
                  type="number"
                  {...register('first_message_delay_seconds', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook">
          <WebhookGenerator
            webhookId={trigger.webhook_id}
            webhookSecret={trigger.webhook_secret}
          />
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistiken</CardTitle>
              <CardDescription>
                Leistung dieses Triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-4xl font-bold">{trigger.total_triggered}</p>
                  <p className="text-muted-foreground">Ausgelöst</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold">{trigger.total_conversations}</p>
                  <p className="text-muted-foreground">Konversationen</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold">{trigger.total_bookings}</p>
                  <p className="text-muted-foreground">Buchungen</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Konversionsrate:{' '}
                  <span className="font-semibold text-foreground">
                    {trigger.total_triggered > 0
                      ? Math.round((trigger.total_bookings / trigger.total_triggered) * 100)
                      : 0}
                    %
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
