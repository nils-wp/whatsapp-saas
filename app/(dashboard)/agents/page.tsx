'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Bot, Search } from 'lucide-react'
import { AgentCard } from '@/components/agents/agent-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useAgents, useUpdateAgent, useDeleteAgent } from '@/lib/hooks/use-agents'
import { useUserNames, getUserDisplayName } from '@/lib/hooks/use-user-names'
import { useTranslations } from '@/providers/locale-provider'
import { toast } from 'sonner'

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const t = useTranslations('agents')
  const tCommon = useTranslations('common')

  // Collect all user IDs for name lookup
  const userIds = useMemo(() => {
    if (!agents) return []
    const ids: string[] = []
    agents.forEach(agent => {
      if (agent.created_by) ids.push(agent.created_by)
      if (agent.updated_by) ids.push(agent.updated_by)
    })
    return [...new Set(ids)]
  }, [agents])

  const { data: userNames } = useUserNames(userIds)

  const filteredAgents = agents?.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.agent_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateAgent.mutateAsync({ id, is_active: isActive })
      toast.success(isActive ? t('activated') : t('deactivated'))
    } catch {
      toast.error(t('updateFailed'))
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      await deleteAgent.mutateAsync(deleteId)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('title')}</h1>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
        </div>
        <Link
          href="/agents/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('newAgent')}
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder={t('searchAgents')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {!filteredAgents || filteredAgents.length === 0 ? (
        searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">{t('noAgentsFound')} &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <EmptyState
            icon={Bot}
            title={t('noAgents')}
            description={t('noAgentsDesc')}
            action={{
              label: t('createAgent'),
              onClick: () => window.location.href = '/agents/new',
            }}
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggleActive={handleToggleActive}
              onDelete={setDeleteId}
              createdByName={getUserDisplayName(userNames, agent.created_by)}
              updatedByName={getUserDisplayName(userNames, agent.updated_by)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDesc')}
        confirmLabel={tCommon('delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteAgent.isPending}
      />
    </div>
  )
}
