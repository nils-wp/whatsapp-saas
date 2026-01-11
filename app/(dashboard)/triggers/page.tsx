'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Zap, Filter } from 'lucide-react'
import { TriggerCard } from '@/components/triggers/trigger-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useTriggers, useUpdateTrigger, useDeleteTrigger } from '@/lib/hooks/use-triggers'
import { useUserNames, getUserDisplayName } from '@/lib/hooks/use-user-names'
import { useTranslations } from '@/providers/locale-provider'
import { toast } from 'sonner'

export default function TriggersPage() {
  const { data: triggers, isLoading } = useTriggers()
  const updateTrigger = useUpdateTrigger()
  const deleteTrigger = useDeleteTrigger()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const t = useTranslations('triggers')
  const tCommon = useTranslations('common')

  // Collect all user IDs for name lookup
  const userIds = useMemo(() => {
    if (!triggers) return []
    const ids: string[] = []
    triggers.forEach(trigger => {
      if (trigger.created_by) ids.push(trigger.created_by)
      if (trigger.updated_by) ids.push(trigger.updated_by)
    })
    return [...new Set(ids)]
  }, [triggers])

  const { data: userNames } = useUserNames(userIds)

  const filteredTriggers = filterType
    ? triggers?.filter(t => t.type === filterType)
    : triggers

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateTrigger.mutateAsync({ id, is_active: isActive })
      toast.success(isActive ? t('activated') : t('deactivated'))
    } catch {
      toast.error(t('updateFailed'))
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      await deleteTrigger.mutateAsync(deleteId)
      toast.success(t('deleted'))
    } catch {
      toast.error(t('deleteFailed'))
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
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('title')}</h1>
          <p className="text-gray-400">
            {t('subtitle')}
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
                <option value="">{t('allTypes')}</option>
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
            {t('newTrigger')}
          </Link>
        </div>
      </div>

      {!filteredTriggers || filteredTriggers.length === 0 ? (
        <EmptyState
          icon={Zap}
          title={t('noTriggers')}
          description={t('noTriggersDesc')}
          action={{
            label: t('createTrigger'),
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
              createdByName={getUserDisplayName(userNames, trigger.created_by)}
              updatedByName={getUserDisplayName(userNames, trigger.updated_by)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('deleteTitle')}
        description={t('deleteDesc')}
        confirmLabel={tCommon('delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteTrigger.isPending}
      />
    </div>
  )
}
