'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgentCard } from '@/components/agents/agent-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useAgents, useUpdateAgent, useDeleteAgent } from '@/lib/hooks/use-agents'
import { toast } from 'sonner'

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateAgent.mutateAsync({ id, is_active: isActive })
      toast.success(isActive ? 'Agent aktiviert' : 'Agent deaktiviert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      await deleteAgent.mutateAsync(deleteId)
      toast.success('Agent erfolgreich gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen des Agents')
    } finally {
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Erstelle und verwalte deine KI-Agenten
          </p>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agent erstellen
          </Button>
        </Link>
      </div>

      {!agents || agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Keine Agents"
          description="Erstelle deinen ersten KI-Agenten, um automatisierte Konversationen zu führen."
          action={{
            label: 'Agent erstellen',
            onClick: () => window.location.href = '/agents/new',
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggleActive={handleToggleActive}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Agent löschen?"
        description="Bist du sicher, dass du diesen Agent löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteAgent.isPending}
      />
    </div>
  )
}
