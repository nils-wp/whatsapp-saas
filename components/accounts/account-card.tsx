'use client'

import Link from 'next/link'
import { Smartphone, MoreVertical, Settings, Trash2, Unplug } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Tables } from '@/types/database'

type WhatsAppAccount = Tables<'whatsapp_accounts'>

interface AccountCardProps {
  account: WhatsAppAccount
  onDisconnect?: (id: string) => void
  onDelete?: (id: string) => void
}

const statusConfig = {
  connected: {
    label: 'Verbunden',
    color: 'bg-green-500',
    variant: 'default' as const,
  },
  qr_pending: {
    label: 'QR-Code ausstehend',
    color: 'bg-yellow-500',
    variant: 'secondary' as const,
  },
  disconnected: {
    label: 'Getrennt',
    color: 'bg-red-500',
    variant: 'destructive' as const,
  },
}

export function AccountCard({ account, onDisconnect, onDelete }: AccountCardProps) {
  const status = statusConfig[account.status as keyof typeof statusConfig] || statusConfig.disconnected
  const warmupProgress = Math.min((account.warmup_day / 30) * 100, 100)
  const usageProgress = (account.messages_sent_today / account.daily_limit) * 100

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {account.profile_picture_url ? (
              <AvatarImage src={account.profile_picture_url} alt={account.display_name || ''} />
            ) : null}
            <AvatarFallback>
              <Smartphone className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {account.display_name || account.instance_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {account.phone_number || 'Keine Nummer'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={status.color}>
            {status.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/accounts/${account.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              {account.status === 'connected' && (
                <DropdownMenuItem onClick={() => onDisconnect?.(account.id)}>
                  <Unplug className="mr-2 h-4 w-4" />
                  Trennen
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(account.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Tageslimit</span>
            <span>
              {account.messages_sent_today} / {account.daily_limit}
            </span>
          </div>
          <Progress value={usageProgress} className="h-2" />
        </div>

        {/* Warmup Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Warmup</span>
            <span>Tag {account.warmup_day} / 30</span>
          </div>
          <Progress value={warmupProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
