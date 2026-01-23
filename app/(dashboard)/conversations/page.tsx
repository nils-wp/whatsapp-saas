'use client'

import { useState } from 'react'
import { MessageSquare, Filter, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ConversationList } from '@/components/conversations/conversation-list'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useConversations, useDeleteConversation, useCleanupOrphanedConversations } from '@/lib/hooks/use-conversations'
import { useAgents } from '@/lib/hooks/use-agents'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useTranslations } from '@/providers/locale-provider'
import { toast } from 'sonner'

export default function ConversationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const t = useTranslations('conversations')
  const tCommon = useTranslations('common')

  const { data: conversations, isLoading } = useConversations({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    agentId: agentFilter !== 'all' ? agentFilter : undefined,
  })
  const { data: agents } = useAgents()
  const { data: accounts } = useAccounts()
  const deleteConversation = useDeleteConversation()
  const cleanupOrphaned = useCleanupOrphanedConversations()

  // Count orphaned conversations
  const orphanedCount = conversations?.filter(c => !c.whatsapp_account_id).length || 0

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteConversation.mutateAsync(deleteId)
      toast.success(t('deleted'))
    } catch {
      toast.error(t('deleteFailed'))
    } finally {
      setDeleteId(null)
    }
  }

  async function handleCleanup() {
    try {
      const result = await cleanupOrphaned.mutateAsync()
      toast.success(result.message || `Deleted ${result.deleted} orphaned conversations`)
    } catch {
      toast.error(t('cleanupFailed'))
    } finally {
      setShowCleanupDialog(false)
    }
  }

  async function handleSyncProfiles() {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/conversations/sync-profiles', {
        method: 'POST',
      })
      const result = await response.json()
      if (response.ok) {
        toast.success(`Profilbilder aktualisiert: ${result.updated} von ${result.total}`)
      } else {
        toast.error(result.error || 'Sync fehlgeschlagen')
      }
    } catch {
      toast.error('Fehler beim Synchronisieren')
    } finally {
      setIsSyncing(false)
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSyncProfiles}
            disabled={isSyncing}
            className="border-[#00a884]/50 text-[#00a884] hover:bg-[#00a884]/10 hover:text-[#00a884]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisiere...' : 'Profile sync'}
          </Button>
          {orphanedCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowCleanupDialog(true)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('cleanup')} ({orphanedCount} {t('orphaned')})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">{t('filter')}:</span>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            <SelectItem value="active">{t('status.active')}</SelectItem>
            <SelectItem value="paused">{t('status.paused')}</SelectItem>
            <SelectItem value="escalated">{t('status.escalated')}</SelectItem>
            <SelectItem value="completed">{t('status.completed')}</SelectItem>
            <SelectItem value="disqualified">{t('status.disqualified')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40 bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectItem value="all">{t('allAgents')}</SelectItem>
            {agents?.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || agentFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('all')
              setAgentFilter('all')
            }}
            className="text-gray-400 hover:text-white"
          >
            {t('resetFilters')}
          </Button>
        )}
      </div>

      {!conversations || conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={t('noConversations')}
          description={t('noConversationsDesc')}
        />
      ) : (
        <Card className="h-[600px] bg-[#1a1a1a] border-[#2a2a2a]">
          <ConversationList
            conversations={conversations}
            onDelete={setDeleteId}
          />
        </Card>
      )}

      {/* Delete Conversation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('deleteTitle')}
        description={t('deleteDesc')}
        confirmLabel={tCommon('delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteConversation.isPending}
      />

      {/* Cleanup Orphaned Dialog */}
      <ConfirmDialog
        open={showCleanupDialog}
        onOpenChange={setShowCleanupDialog}
        title={t('cleanupTitle')}
        description={t('cleanupDesc', { count: orphanedCount })}
        confirmLabel={t('deleteAll')}
        variant="destructive"
        onConfirm={handleCleanup}
        isLoading={cleanupOrphaned.isPending}
      />
    </div>
  )
}
