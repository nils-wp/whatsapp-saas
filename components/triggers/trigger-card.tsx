'use client'

import Link from 'next/link'
import { Zap, MoreVertical, Edit, Trash2, PlayCircle, PauseCircle, Bot, Phone, User } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  created_by?: string | null
  updated_by?: string | null
}

interface TriggerCardProps {
  trigger: Trigger
  onToggleActive?: (id: string, isActive: boolean) => void
  onDelete?: (id: string) => void
  createdByName?: string | null
  updatedByName?: string | null
}

const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
  webhook: { label: 'Webhook', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  activecampaign: { label: 'ActiveCampaign', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  close: { label: 'Close CRM', bg: 'bg-orange-500/10', text: 'text-orange-400' },
}

export function TriggerCard({ trigger, onToggleActive, onDelete, createdByName, updatedByName }: TriggerCardProps) {
  const typeStyle = typeConfig[trigger.type] || { label: trigger.type, bg: 'bg-gray-500/10', text: 'text-gray-400' }
  const conversionRate = trigger.total_triggered > 0
    ? Math.round((trigger.total_bookings / trigger.total_triggered) * 100)
    : 0
  const displayName = updatedByName || createdByName

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="relative">
          <div className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center',
            trigger.is_active ? 'bg-emerald-500/10' : 'bg-gray-500/10'
          )}>
            <Zap className={cn(
              'h-5 w-5',
              trigger.is_active ? 'text-emerald-500' : 'text-gray-500'
            )} />
          </div>
          {trigger.is_active && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

        {/* Name & Type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/triggers/${trigger.id}`}
              className="font-semibold text-white hover:text-emerald-400 transition-colors truncate"
            >
              {trigger.name}
            </Link>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-medium shrink-0',
              typeStyle.bg,
              typeStyle.text
            )}>
              {typeStyle.label}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {trigger.whatsapp_accounts?.phone_number || trigger.whatsapp_accounts?.instance_name || 'No number'}
            </span>
            <span className="flex items-center gap-1">
              <Bot className="h-3.5 w-3.5" />
              {trigger.agents?.name || 'No agent'}
            </span>
            {displayName && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                by {displayName}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-center">
          <div>
            <p className="text-lg font-bold text-white">{trigger.total_conversations}</p>
            <p className="text-xs text-gray-500">Responses</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{trigger.total_bookings}</p>
            <p className="text-xs text-gray-500">Conversions</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-400">{conversionRate}%</p>
            <p className="text-xs text-gray-500">Rate</p>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
            <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-[#252525]">
              <Link href={`/triggers/${trigger.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleActive?.(trigger.id, !trigger.is_active)}
              className="text-gray-300 focus:text-white focus:bg-[#252525]"
            >
              {trigger.is_active ? (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
            <DropdownMenuItem
              onClick={() => onDelete?.(trigger.id)}
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Stats */}
      <div className="sm:hidden flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a2a]">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{trigger.total_conversations}</p>
          <p className="text-xs text-gray-500">Responses</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{trigger.total_bookings}</p>
          <p className="text-xs text-gray-500">Conversions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-400">{conversionRate}%</p>
          <p className="text-xs text-gray-500">Rate</p>
        </div>
      </div>
    </div>
  )
}
