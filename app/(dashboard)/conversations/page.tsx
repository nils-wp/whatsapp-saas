'use client'

import { useState } from 'react'
import { MessageSquare, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ConversationList } from '@/components/conversations/conversation-list'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { useConversations } from '@/lib/hooks/use-conversations'
import { useAgents } from '@/lib/hooks/use-agents'
import { useAccounts } from '@/lib/hooks/use-accounts'

export default function ConversationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [agentFilter, setAgentFilter] = useState<string>('')

  const { data: conversations, isLoading } = useConversations({
    status: statusFilter || undefined,
    agentId: agentFilter || undefined,
  })
  const { data: agents } = useAgents()
  const { data: accounts } = useAccounts()

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Konversationen</h1>
          <p className="text-muted-foreground">
            Alle Gespräche mit deinen Kontakten
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="paused">Pausiert</SelectItem>
            <SelectItem value="escalated">Eskaliert</SelectItem>
            <SelectItem value="completed">Abgeschlossen</SelectItem>
            <SelectItem value="disqualified">Disqualifiziert</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Agents</SelectItem>
            {agents?.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter || agentFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('')
              setAgentFilter('')
            }}
          >
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {!conversations || conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Keine Konversationen"
          description="Sobald Gespräche gestartet werden, erscheinen sie hier."
        />
      ) : (
        <Card className="h-[600px]">
          <ConversationList conversations={conversations} />
        </Card>
      )}
    </div>
  )
}
