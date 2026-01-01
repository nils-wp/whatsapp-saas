'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TriggerCard } from '@/components/triggers/trigger-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useTriggers, useUpdateTrigger, useDeleteTrigger } from '@/lib/hooks/use-triggers'
import { toast } from 'sonner'

export default function TriggersPage() {
  const { data: triggers, isLoading } = useTriggers()
  const updateTrigger = useUpdateTrigger()
  const deleteTrigger = useDeleteTrigger()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateTrigger.mutateAsync({ id, is_active: isActive })
      toast.success(isActive ? 'Trigger aktiviert' : 'Trigger deaktiviert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      await deleteTrigger.mutateAsync(deleteId)
      toast.success('Trigger erfolgreich gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen')
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
          <h1 className="text-3xl font-bold tracking-tight">Triggers</h1>
          <p className="text-muted-foreground">
            Automatisiere den Start von Konversationen
          </p>
        </div>
        <Link href="/triggers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Trigger erstellen
          </Button>
        </Link>
      </div>

      {!triggers || triggers.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Keine Triggers"
          description="Erstelle deinen ersten Trigger, um automatisch Konversationen zu starten."
          action={{
            label: 'Trigger erstellen',
            onClick: () => window.location.href = '/triggers/new',
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {triggers.map((trigger) => (
            <TriggerCard
              key={trigger.id}
              trigger={trigger}
              onToggleActive={handleToggleActive}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Trigger löschen?"
        description="Bist du sicher? Der Webhook wird nicht mehr funktionieren."
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteTrigger.isPending}
      />
    </div>
  )
}
