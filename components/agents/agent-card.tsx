'use client'

import Link from 'next/link'
import { Bot, MoreVertical, Edit, Trash2, PlayCircle, PauseCircle, MessageSquare, HelpCircle, Zap, User, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/providers/locale-provider'
import type { Tables } from '@/types/database'
import type { ScriptStep, FAQEntry } from '@/types'

type Agent = Tables<'agents'> & {
  created_by?: string | null
  updated_by?: string | null
  whatsapp_account_id?: string | null
  whatsapp_accounts?: {
    phone_number: string | null
    instance_name: string | null
  } | null
}

interface AgentCardProps {
  agent: Agent
  onToggleActive?: (id: string, isActive: boolean) => void
  onDelete?: (id: string) => void
  createdByName?: string | null
  updatedByName?: string | null
}

export function AgentCard({ agent, onToggleActive, onDelete, createdByName, updatedByName }: AgentCardProps) {
  const t = useTranslations('agents')
  const tCommon = useTranslations('common')
  const scriptSteps = (agent.script_steps as ScriptStep[]) || []
  const faqEntries = (agent.faq_entries as FAQEntry[]) || []
  const displayName = updatedByName || createdByName

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 hover:border-[#3a3a3a] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <Link
              href={`/agents/${agent.id}`}
              className="font-semibold text-white hover:text-emerald-400 transition-colors"
            >
              {agent.name}
            </Link>
            <p className="text-sm text-gray-500">
              {agent.agent_name || t('aiAssistant')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              agent.is_active
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-gray-500/10 text-gray-500'
            )}
          >
            {agent.is_active ? t('active') : t('inactive')}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
              <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-[#252525]">
                <Link href={`/agents/${agent.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {tCommon('edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-[#252525]">
                <Link href={`/agents/${agent.id}/test`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {t('test')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem
                onClick={() => onToggleActive?.(agent.id, !agent.is_active)}
                className="text-gray-300 focus:text-white focus:bg-[#252525]"
              >
                {agent.is_active ? (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    {t('deactivate')}
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {t('activate')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem
                onClick={() => onDelete?.(agent.id)}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {agent.description}
        </p>
      )}

      {/* Linked Account */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]">
        <Phone className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-gray-400">
          {agent.whatsapp_accounts
            ? (agent.whatsapp_accounts.phone_number || agent.whatsapp_accounts.instance_name)
            : t('allNumbers')}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-gray-400">
            <MessageSquare className="h-4 w-4" />
            <span>{scriptSteps.length} {t('scriptSteps')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <HelpCircle className="h-4 w-4" />
            <span>{faqEntries.length} {t('faqEntries')}</span>
          </div>
        </div>
        {displayName && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <User className="h-3.5 w-3.5" />
            <span className="text-xs">{t('by')} {displayName}</span>
          </div>
        )}
      </div>
    </div>
  )
}
