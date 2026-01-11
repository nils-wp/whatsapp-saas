'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Phone, RefreshCw, MessageSquare, Clock } from 'lucide-react'
import { AccountCard } from '@/components/accounts/account-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useAccounts, useDeleteAccount, useSyncAccountStatuses } from '@/lib/hooks/use-accounts'
import { useTranslations } from '@/providers/locale-provider'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts()
  const deleteAccount = useDeleteAccount()
  const syncStatuses = useSyncAccountStatuses()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')

  // Calculate stats
  const activeNumbers = accounts?.filter(a => a.status === 'connected').length || 0
  const totalMessages = accounts?.reduce((sum, a) => sum + (a.messages_sent_today || 0), 0) || 0
  const avgResponseTime = '< 1 min' // Placeholder - could be calculated from analytics

  async function handleDelete() {
    if (!deleteId) return

    try {
      await deleteAccount.mutateAsync(deleteId)
      toast.success(t('deleted'))
    } catch {
      toast.error(t('deleteFailed'))
    } finally {
      setDeleteId(null)
    }
  }

  async function handleDisconnect(id: string) {
    try {
      const response = await fetch('/api/evolution/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: id }),
      })

      if (!response.ok) throw new Error('Failed to disconnect')
      toast.success(t('disconnected'))
    } catch {
      toast.error(t('disconnectFailed'))
    }
  }

  async function handleRefreshStatuses() {
    if (!accounts || accounts.length === 0) return

    try {
      await syncStatuses.mutateAsync(accounts.map(a => a.id))
      toast.success(t('statusUpdated'))
    } catch {
      toast.error(t('statusUpdateFailed'))
    }
  }

  async function handleSyncChats(accountId: string) {
    setSyncingAccountId(accountId)
    try {
      const response = await fetch('/api/evolution/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('syncFailed'))
      }

      if (data.skipped > 0 && data.skippedReasons?.length > 0) {
        console.log('Skipped reasons:', data.skippedReasons)
        toast.success(`${t('synced')} ${data.synced} ${t('chats')} (${data.skipped} ${t('skipped')})`)
      } else {
        toast.success(`${t('synced')} ${data.synced} ${t('chats')}`)
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('syncFailed'))
    } finally {
      setSyncingAccountId(null)
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
        <div className="flex items-center gap-3">
          {accounts && accounts.length > 0 && (
            <button
              onClick={handleRefreshStatuses}
              disabled={syncStatuses.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:bg-[#252525] hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncStatuses.isPending ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          )}
          <Link
            href="/accounts/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('connectNumber')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {accounts && accounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{t('activeNumbers')}</p>
                <p className="text-2xl font-bold text-white mt-1">{activeNumbers}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{t('messagesToday')}</p>
                <p className="text-2xl font-bold text-white mt-1">{totalMessages}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{t('avgResponseTime')}</p>
                <p className="text-2xl font-bold text-white mt-1">{avgResponseTime}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!accounts || accounts.length === 0 ? (
        <EmptyState
          icon={Phone}
          title={t('noNumbers')}
          description={t('noNumbersDesc')}
          action={{
            label: t('connectNumber'),
            onClick: () => window.location.href = '/accounts/new',
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDisconnect={handleDisconnect}
              onDelete={setDeleteId}
              onSync={handleSyncChats}
              isSyncing={syncingAccountId === account.id}
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
        isLoading={deleteAccount.isPending}
      />
    </div>
  )
}
