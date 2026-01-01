'use client'

import Link from 'next/link'
import { Zap, MoreVertical, Edit, Trash2, PlayCircle, PauseCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tables } from '@/types/database'

type Trigger = Tables<'triggers'> & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string } | null
}

interface TriggerCardProps {
  trigger: Trigger
  onToggleActive?: (id: string, isActive: boolean) => void
  onDelete?: (id: string) => void
}

const typeLabels: Record<string, string> = {
  webhook: 'Webhook',
  activecampaign: 'ActiveCampaign',
  close: 'Close CRM',
}

export function TriggerCard({ trigger, onToggleActive, onDelete }: TriggerCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <Link
              href={`/triggers/${trigger.id}`}
              className="font-semibold hover:underline"
            >
              {trigger.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {typeLabels[trigger.type] || trigger.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
            {trigger.is_active ? 'Aktiv' : 'Inaktiv'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/triggers/${trigger.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleActive?.(trigger.id, !trigger.is_active)}
              >
                {trigger.is_active ? (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Deaktivieren
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Aktivieren
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(trigger.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Account</p>
            <p className="font-medium">
              {trigger.whatsapp_accounts?.phone_number ||
                trigger.whatsapp_accounts?.instance_name ||
                '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Agent</p>
            <p className="font-medium">{trigger.agents?.name || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-sm">
          <div>
            <p className="text-2xl font-bold">{trigger.total_triggered}</p>
            <p className="text-xs text-muted-foreground">Ausgelöst</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{trigger.total_conversations}</p>
            <p className="text-xs text-muted-foreground">Konversationen</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{trigger.total_bookings}</p>
            <p className="text-xs text-muted-foreground">Buchungen</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
