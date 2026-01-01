'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateTrigger } from '@/lib/hooks/use-triggers'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useAgents } from '@/lib/hooks/use-agents'
import { triggerSchema, type TriggerFormData } from '@/lib/utils/validation'
import { toast } from 'sonner'

export default function NewTriggerPage() {
  const router = useRouter()
  const createTrigger = useCreateTrigger()
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
    defaultValues: {
      type: 'webhook',
      first_message_delay_seconds: 30,
    },
  })

  const selectedType = watch('type')

  async function onSubmit(data: TriggerFormData) {
    try {
      const trigger = await createTrigger.mutateAsync(data)
      toast.success('Trigger erfolgreich erstellt')
      router.push(`/triggers/${trigger.id}`)
    } catch (error) {
      toast.error('Fehler beim Erstellen')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/triggers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuen Trigger erstellen</h1>
          <p className="text-muted-foreground">
            Konfiguriere einen neuen Automatisierungs-Trigger
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Grundeinstellungen</CardTitle>
            <CardDescription>
              Name und Typ des Triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Lead aus Webinar"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Typ *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue('type', value as 'webhook' | 'activecampaign' | 'close')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="activecampaign">ActiveCampaign</SelectItem>
                  <SelectItem value="close">Close CRM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verknüpfungen</CardTitle>
            <CardDescription>
              WhatsApp-Account und Agent für diesen Trigger
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Account *</Label>
              <Select
                onValueChange={(value) => setValue('whatsapp_account_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Account auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.display_name || account.instance_name}
                      {account.phone_number && ` (${account.phone_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.whatsapp_account_id && (
                <p className="text-sm text-destructive">{errors.whatsapp_account_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Agent *</Label>
              <Select
                onValueChange={(value) => setValue('agent_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Agent auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.filter(a => a.is_active).map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.agent_id && (
                <p className="text-sm text-destructive">{errors.agent_id.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Erste Nachricht</CardTitle>
            <CardDescription>
              Diese Nachricht wird automatisch gesendet, wenn der Trigger ausgelöst wird
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_message">Nachricht *</Label>
              <Textarea
                id="first_message"
                placeholder="Hey {{name}}, danke für dein Interesse! 👋"
                rows={4}
                {...register('first_message')}
              />
              {errors.first_message && (
                <p className="text-sm text-destructive">{errors.first_message.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Verfügbare Variablen: {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_message_delay_seconds">Verzögerung (Sekunden)</Label>
              <Input
                id="first_message_delay_seconds"
                type="number"
                min={0}
                max={300}
                {...register('first_message_delay_seconds', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Zeit zwischen Trigger und erster Nachricht
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/triggers">
            <Button type="button" variant="outline">
              Abbrechen
            </Button>
          </Link>
          <Button type="submit" disabled={createTrigger.isPending}>
            Trigger erstellen
          </Button>
        </div>
      </form>
    </div>
  )
}
