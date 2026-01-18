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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateAgent } from '@/lib/hooks/use-agents'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { agentSchema, type AgentFormData } from '@/lib/utils/validation'
import { DEFAULT_SCRIPT_STEPS, ESCALATION_TOPICS, DISQUALIFY_CRITERIA } from '@/lib/constants'
import { toast } from 'sonner'

export default function NewAgentPage() {
  const router = useRouter()
  const createAgent = useCreateAgent()
  const { data: accounts } = useAccounts()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      response_delay_min: 5,
      response_delay_max: 15,
      max_messages_per_conversation: 20,
      booking_cta: 'Buch dir hier ein kurzes Gespräch:',
      whatsapp_account_id: '',
    },
  })

  const selectedAccountId = watch('whatsapp_account_id')

  async function onSubmit(data: AgentFormData) {
    try {
      const { whatsapp_account_id, ...rest } = data
      const agent = await createAgent.mutateAsync({
        ...rest,
        whatsapp_account_id: whatsapp_account_id || null,
        script_steps: DEFAULT_SCRIPT_STEPS,
        faq_entries: [],
        escalation_topics: ESCALATION_TOPICS,
        escalation_message: 'Gute Frage – da muss ich kurz nachfragen. Ich melde mich gleich wieder!',
        disqualify_criteria: DISQUALIFY_CRITERIA,
        disqualify_message: 'Verstehe, dann bist du gerade an einem anderen Punkt. Melde dich gerne wieder!',
      })

      toast.success('Agent erfolgreich erstellt')
      router.push(`/agents/${agent.id}`)
    } catch (error) {
      toast.error('Fehler beim Erstellen des Agents')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuen Agent erstellen</h1>
          <p className="text-muted-foreground">
            Konfiguriere deinen neuen KI-Agenten
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Grundeinstellungen</CardTitle>
            <CardDescription>
              Allgemeine Informationen über den Agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Sales Agent"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Wofür wird dieser Agent verwendet?"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_account_id">WhatsApp Nummer</Label>
              <Select
                value={selectedAccountId || 'all'}
                onValueChange={(value) => setValue('whatsapp_account_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle Nummern (Standard)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Nummern</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.phone_number || account.instance_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional: Agent nur für eine bestimmte Nummer verwenden
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_name">Agent-Name *</Label>
              <Input
                id="agent_name"
                placeholder="z.B. Lisa"
                {...register('agent_name')}
              />
              {errors.agent_name && (
                <p className="text-sm text-destructive">{errors.agent_name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Name, mit dem sich der Agent vorstellt
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_info">Unternehmensinfo</Label>
              <Textarea
                id="company_info"
                placeholder="Beschreibe dein Unternehmen kurz..."
                {...register('company_info')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking</CardTitle>
            <CardDescription>
              Konfiguration für Terminbuchungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendly_link">Calendly Link</Label>
              <Input
                id="calendly_link"
                type="url"
                placeholder="https://calendly.com/..."
                {...register('calendly_link')}
              />
              {errors.calendly_link && (
                <p className="text-sm text-destructive">{errors.calendly_link.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking_cta">Booking CTA</Label>
              <Input
                id="booking_cta"
                placeholder="Buch dir hier ein kurzes Gespräch:"
                {...register('booking_cta')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verhalten</CardTitle>
            <CardDescription>
              Einstellungen für das Antwortverhalten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="response_delay_min">Min. Verzögerung (Sek.)</Label>
                <Input
                  id="response_delay_min"
                  type="number"
                  min={0}
                  max={60}
                  {...register('response_delay_min', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response_delay_max">Max. Verzögerung (Sek.)</Label>
                <Input
                  id="response_delay_max"
                  type="number"
                  min={0}
                  max={120}
                  {...register('response_delay_max', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_messages_per_conversation">Max. Nachrichten pro Konversation</Label>
              <Input
                id="max_messages_per_conversation"
                type="number"
                min={1}
                max={100}
                {...register('max_messages_per_conversation', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/agents">
            <Button type="button" variant="outline">
              Abbrechen
            </Button>
          </Link>
          <Button type="submit" disabled={createAgent.isPending}>
            Agent erstellen
          </Button>
        </div>
      </form>
    </div>
  )
}
