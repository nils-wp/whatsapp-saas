'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountCard } from '@/components/accounts/account-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useAccounts, useDeleteAccount } from '@/lib/hooks/use-accounts'
import { toast } from 'sonner'

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts()
  const deleteAccount = useDeleteAccount()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleDelete() {
    if (!deleteId) return

    try {
      await deleteAccount.mutateAsync(deleteId)
      toast.success('Account erfolgreich gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen des Accounts')
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
      toast.success('Account getrennt')
    } catch (error) {
      toast.error('Fehler beim Trennen des Accounts')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Accounts</h1>
          <p className="text-muted-foreground">
            Verwalte deine verbundenen WhatsApp-Nummern
          </p>
        </div>
        <Link href="/accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nummer verbinden
          </Button>
        </Link>
      </div>

      {!accounts || accounts.length === 0 ? (
        <EmptyState
          icon={Smartphone}
          title="Keine Accounts"
          description="Verbinde deine erste WhatsApp-Nummer, um loszulegen."
          action={{
            label: 'Nummer verbinden',
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
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Account löschen?"
        description="Bist du sicher, dass du diesen Account löschen möchtest? Alle zugehörigen Konversationen bleiben erhalten."
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteAccount.isPending}
      />
    </div>
  )
}
