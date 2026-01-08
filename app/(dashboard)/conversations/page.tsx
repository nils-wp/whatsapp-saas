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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')

  const { data: conversations, isLoading } = useConversations({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    agentId: agentFilter !== 'all' ? agentFilter : undefined,
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Conversations</h1>
          <p className="text-gray-400">
            All conversations with your contacts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter:</span>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disqualified">Disqualified</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40 bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectItem value="all">All Agents</SelectItem>
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
            Reset filters
          </Button>
        )}
      </div>

      {!conversations || conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Conversations"
          description="Once conversations start, they will appear here."
        />
      ) : (
        <Card className="h-[600px] bg-[#1a1a1a] border-[#2a2a2a]">
          <ConversationList conversations={conversations} />
        </Card>
      )}
    </div>
  )
}
