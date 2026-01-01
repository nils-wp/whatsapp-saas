'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/shared/loading-spinner'
import { AgentTestChat } from '@/components/agents/agent-test-chat'
import { useAgent } from '@/lib/hooks/use-agents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ScriptStep } from '@/types'

export default function TestAgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: agent, isLoading } = useAgent(id)

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

  const scriptSteps = (agent.script_steps as ScriptStep[]) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/agents/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{agent.name} testen</h1>
          <p className="text-muted-foreground">
            Simuliere eine Konversation mit deinem Agent
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgentTestChat agent={agent} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Skript-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scriptSteps.map((step) => (
                  <div
                    key={step.step}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {step.step}
                    </span>
                    <div>
                      <p className="font-medium">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.goal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Eskalations-Themen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {agent.escalation_topics.map((topic, index) => (
                  <span
                    key={index}
                    className="bg-muted px-2 py-1 rounded text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Erwähne eines dieser Themen, um eine Eskalation zu testen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
