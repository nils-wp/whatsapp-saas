'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Zap, Filter } from 'lucide-react'
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
  const [filterType, setFilterType] = useState<string | null>(null)

  const filteredTriggers = filterType
    ? triggers?.filter(t => t.type === filterType)
    : triggers

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateTrigger.mutateAsync({ id, is_active: isActive })
      toast.success(isActive ? 'Trigger activated' : 'Trigger deactivated')
    } catch {
      toast.error('Failed to update trigger')
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      await deleteTrigger.mutateAsync(deleteId)
      toast.success('Trigger deleted successfully')
    } catch {
      toast.error('Failed to delete trigger')
    } finally {
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  // Get unique trigger types for filter
  const triggerTypes = [...new Set(triggers?.map(t => t.type) || [])]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Triggers</h1>
          <p className="text-gray-400">
            Automate the start of conversations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {triggerTypes.length > 1 && (
            <div className="relative">
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value || null)}
                className="appearance-none pl-10 pr-8 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">All Types</option>
                {triggerTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'webhook' ? 'Webhook' : type === 'activecampaign' ? 'ActiveCampaign' : type === 'close' ? 'Close CRM' : type}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          )}
          <Link
            href="/triggers/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Trigger
          </Link>
        </div>
      </div>

      {!filteredTriggers || filteredTriggers.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No Triggers"
          description="Create your first trigger to automatically start conversations."
          action={{
            label: 'Create Trigger',
            onClick: () => window.location.href = '/triggers/new',
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredTriggers.map((trigger) => (
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
        title="Delete Trigger?"
        description="Are you sure? The webhook will no longer work."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteTrigger.isPending}
      />
    </div>
  )
}
