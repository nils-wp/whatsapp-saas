'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConnectionStatus } from '@/components/accounts/connection-status'
import { WarmingProgress } from '@/components/accounts/warming-progress'
import { PageLoader } from '@/components/shared/loading-spinner'
import { useAccount } from '@/lib/hooks/use-accounts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Smartphone } from 'lucide-react'

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: account, isLoading } = useAccount(id)

  if (isLoading) {
    return <PageLoader />
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Account nicht gefunden</p>
        <Link href="/accounts">
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
          <Link href="/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {account.profile_picture_url ? (
                <AvatarImage src={account.profile_picture_url} />
              ) : null}
              <AvatarFallback>
                <Smartphone className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {account.display_name || account.instance_name}
              </h1>
              <p className="text-muted-foreground">
                {account.phone_number || 'Keine Nummer'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionStatus status={account.status as 'connected' | 'disconnected' | 'qr_pending'} />
          <Link href={`/accounts/${id}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Einstellungen
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WarmingProgress
          currentDay={account.warmup_day}
          currentLimit={account.daily_limit}
          messagesSentToday={account.messages_sent_today}
        />

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Instance Name</p>
                <p className="font-medium">{account.instance_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Instance ID</p>
                <p className="font-medium font-mono text-sm">
                  {account.instance_id || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Erstellt am</p>
                <p className="font-medium">
                  {new Date(account.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Letzte Nachricht</p>
                <p className="font-medium">
                  {account.last_message_at
                    ? new Date(account.last_message_at).toLocaleString('de-DE')
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
