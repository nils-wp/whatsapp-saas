'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ScriptBuilder } from '@/components/agents/script-builder'
import { FAQEditor } from '@/components/agents/faq-editor'
import { useAgent, useUpdateAgent } from '@/lib/hooks/use-agents'
import { agentSchema, type AgentFormData } from '@/lib/utils/validation'
import { toast } from 'sonner'
import type { ScriptStep, FAQEntry } from '@/types'

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: agent, isLoading } = useAgent(id)
  const updateAgent = useUpdateAgent()

  const [scriptSteps, setScriptSteps] = useState<ScriptStep[]>([])
  const [faqEntries, setFaqEntries] = useState<FAQEntry[]>([])
  const [escalationTopics, setEscalationTopics] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
  })

  // Initialize form when agent data loads
  useState(() => {
    if (agent) {
      reset({
        name: agent.name,
        description: agent.description || '',
        agent_name: agent.agent_name,
        colleague_name: agent.colleague_name || '',
        company_info: agent.company_info || '',
        calendly_link: agent.calendly_link || '',
        booking_cta: agent.booking_cta,
        response_delay_min: agent.response_delay_min,
        response_delay_max: agent.response_delay_max,
        max_messages_per_conversation: agent.max_messages_per_conversation,
      })
      setScriptSteps((agent.script_steps as ScriptStep[]) || [])
      setFaqEntries((agent.faq_entries as FAQEntry[]) || [])
      setEscalationTopics(agent.escalation_topics || [])
      setIsActive(agent.is_active)
    }
  })

  async function onSubmit(data: AgentFormData) {
    try {
      await updateAgent.mutateAsync({
        id,
        ...data,
        is_active: isActive,
        script_steps: scriptSteps,
        faq_entries: faqEntries,
        escalation_topics: escalationTopics,
      })
      toast.success('Agent gespeichert')
    } catch (error) {
      toast.error('Fehler beim Speichern')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Agent nicht gefunden</p>
        <Link href="/agents">
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
          <Link href="/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-muted-foreground">
              Agent bearbeiten
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              id="is_active"
            />
            <Label htmlFor="is_active">
              {isActive ? 'Aktiv' : 'Inaktiv'}
            </Label>
          </div>
          <Link href={`/agents/${id}/test`}>
            <Button variant="outline">Testen</Button>
          </Link>
          <Button onClick={handleSubmit(onSubmit)} disabled={updateAgent.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="script">Skript</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="escalation">Eskalation</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grundeinstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea id="description" {...register('description')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_name">Agent-Name</Label>
                  <Input id="agent_name" {...register('agent_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colleague_name">Kollegen-Name</Label>
                  <Input id="colleague_name" {...register('colleague_name')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_info">Unternehmensinfo</Label>
                <Textarea id="company_info" {...register('company_info')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendly_link">Calendly Link</Label>
                <Input id="calendly_link" {...register('calendly_link')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking_cta">Booking CTA</Label>
                <Input id="booking_cta" {...register('booking_cta')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script">
          <ScriptBuilder steps={scriptSteps} onChange={setScriptSteps} />
        </TabsContent>

        <TabsContent value="faq">
          <FAQEditor entries={faqEntries} onChange={setFaqEntries} />
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eskalations-Themen</CardTitle>
              <CardDescription>
                Bei diesen Themen wird die Konversation eskaliert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {escalationTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full"
                  >
                    <span className="text-sm">{topic}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEscalationTopics(escalationTopics.filter((_, i) => i !== index))
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <Input
                  placeholder="Thema hinzufügen..."
                  className="w-40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const value = e.currentTarget.value.trim()
                      if (value && !escalationTopics.includes(value)) {
                        setEscalationTopics([...escalationTopics, value])
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Verhalten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. Verzögerung (Sek.)</Label>
                  <Input
                    type="number"
                    {...register('response_delay_min', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max. Verzögerung (Sek.)</Label>
                  <Input
                    type="number"
                    {...register('response_delay_max', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max. Nachrichten pro Konversation</Label>
                <Input
                  type="number"
                  {...register('max_messages_per_conversation', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
