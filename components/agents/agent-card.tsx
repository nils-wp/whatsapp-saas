'use client'

import Link from 'next/link'
import { Bot, MoreVertical, Edit, Trash2, PlayCircle, PauseCircle, MessageSquare, HelpCircle } from 'lucide-react'
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
import type { ScriptStep, FAQEntry } from '@/types'

type Agent = Tables<'agents'>

interface AgentCardProps {
  agent: Agent
  onToggleActive?: (id: string, isActive: boolean) => void
  onDelete?: (id: string) => void
}

export function AgentCard({ agent, onToggleActive, onDelete }: AgentCardProps) {
  const scriptSteps = (agent.script_steps as ScriptStep[]) || []
  const faqEntries = (agent.faq_entries as FAQEntry[]) || []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <Link
              href={`/agents/${agent.id}`}
              className="font-semibold hover:underline"
            >
              {agent.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {agent.agent_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
            {agent.is_active ? 'Aktiv' : 'Inaktiv'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}/test`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Testen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onToggleActive?.(agent.id, !agent.is_active)}
              >
                {agent.is_active ? (
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
                onClick={() => onDelete?.(agent.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {agent.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {agent.description}
          </p>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{scriptSteps.length} Skript-Schritte</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            <span>{faqEntries.length} FAQ-Einträge</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
