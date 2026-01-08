'use client'

import { useState } from 'react'
import {
  Inbox,
  Clock,
  AlertTriangle,
  Send,
  Check,
  X,
  ExternalLink,
  Bot,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useMessageQueue, useResolveQueueItem, useSendQueueResponse } from '@/lib/hooks/use-message-queue'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'>

interface QueueItemWithConversation {
  id: string
  tenant_id: string
  conversation_id: string | null
  queue_type: string
  status: string
  priority: number
  original_message: string
  reason: string | null
  suggested_response: string | null
  resolved_by: string | null
  resolved_at: string | null
  resolution_message: string | null
  scheduled_for: string | null
  created_at: string
  conversation: Pick<Conversation, 'id' | 'contact_name' | 'contact_phone'> | null
}

export default function QueuePage() {
  const { data: allItems, isLoading } = useMessageQueue()
  const resolveItem = useResolveQueueItem()
  const sendResponse = useSendQueueResponse()

  const [selectedItem, setSelectedItem] = useState<QueueItemWithConversation | null>(null)
  const [response, setResponse] = useState('')

  const escalatedItems = allItems?.filter((i) => i.queue_type === 'escalated') || []
  const outsideHoursItems = allItems?.filter((i) => i.queue_type === 'outside_hours') || []

  const handleSendResponse = async () => {
    if (!selectedItem || !response.trim()) return

    try {
      await sendResponse.mutateAsync({
        queueItem: selectedItem,
        message: response,
      })
      toast.success('Response sent')
      setSelectedItem(null)
      setResponse('')
    } catch (error) {
      toast.error('Failed to send response')
    }
  }

  const handleReturnToAgent = async () => {
    if (!selectedItem) return

    try {
      await resolveItem.mutateAsync({
        id: selectedItem.id,
        status: 'resolved',
        resolution_message: 'Returned to agent',
      })
      toast.success('Returned to agent')
      setSelectedItem(null)
      setResponse('')
    } catch (error) {
      toast.error('Failed to return to agent')
    }
  }

  const handleDismiss = async () => {
    if (!selectedItem) return

    try {
      await resolveItem.mutateAsync({
        id: selectedItem.id,
        status: 'dismissed',
      })
      toast.success('Item removed')
      setSelectedItem(null)
      setResponse('')
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const selectItem = (item: QueueItemWithConversation) => {
    setSelectedItem(item)
    setResponse(item.suggested_response || '')
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Queue</h1>
        <p className="text-gray-400">
          Messages waiting for your attention
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queue List */}
        <div className="space-y-4">
          <Tabs defaultValue="escalated">
            <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
              <TabsTrigger value="escalated" className="gap-2 data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
                <AlertTriangle className="h-4 w-4" />
                Escalated
                {escalatedItems.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {escalatedItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="outside_hours" className="gap-2 data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
                <Clock className="h-4 w-4" />
                Outside Hours
                {outsideHoursItems.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 bg-gray-600">
                    {outsideHoursItems.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="escalated" className="mt-4">
              {escalatedItems.length === 0 ? (
                <EmptyState
                  icon={Check}
                  title="All done"
                  description="No escalated conversations"
                />
              ) : (
                <div className="space-y-2">
                  {escalatedItems.map((item) => (
                    <QueueCard
                      key={item.id}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => selectItem(item)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="outside_hours" className="mt-4">
              {outsideHoursItems.length === 0 ? (
                <EmptyState
                  icon={Check}
                  title="All done"
                  description="No messages outside business hours"
                />
              ) : (
                <div className="space-y-2">
                  {outsideHoursItems.map((item) => (
                    <QueueCard
                      key={item.id}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => selectItem(item)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Response Panel */}
        <Card className="h-fit lg:sticky lg:top-24 bg-[#1a1a1a] border-[#2a2a2a]">
          {selectedItem ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#2a2a2a] text-white">
                        {(selectedItem.conversation?.contact_name || 'U')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base text-white">
                        {selectedItem.conversation?.contact_name || 'Unknown Contact'}
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        {selectedItem.conversation?.contact_phone || 'No phone'}
                      </CardDescription>
                    </div>
                  </div>
                  {selectedItem.conversation_id && (
                    <Button variant="outline" size="sm" asChild className="bg-transparent border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white">
                      <a href={`/conversations/${selectedItem.conversation_id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reason */}
                {selectedItem.reason && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      {selectedItem.reason}
                    </span>
                  </div>
                )}

                {/* Original Message */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-400">
                    Message
                  </div>
                  <div className="rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] p-3">
                    <p className="text-sm text-white">{selectedItem.original_message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(selectedItem.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* Response */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-400">
                    Your Response
                  </div>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Write a response..."
                    rows={4}
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-gray-500"
                  />
                  {selectedItem.suggested_response && (
                    <p className="text-xs text-gray-500">
                      <Bot className="inline h-3 w-3 mr-1" />
                      AI suggestion inserted
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleSendResponse}
                    disabled={!response.trim() || sendResponse.isPending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReturnToAgent}
                    disabled={resolveItem.isPending}
                    className="bg-transparent border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Return to Agent
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    disabled={resolveItem.isPending}
                    className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Inbox className="h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-500 text-center">
                Select a message from the queue to respond
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

function QueueCard({
  item,
  selected,
  onClick,
}: {
  item: QueueItemWithConversation
  selected: boolean
  onClick: () => void
}) {
  const contactName = item.conversation?.contact_name || 'Unknown Contact'
  const initials = contactName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-colors ${
        selected
          ? 'border-emerald-500 bg-emerald-500/5'
          : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#252525]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-[#2a2a2a] text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate text-white">{contactName}</div>
            <div className="text-sm text-gray-500 truncate">
              {item.original_message}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
            })}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </div>
      </div>
      {item.reason && (
        <div className="mt-2">
          <Badge variant="outline" className="text-xs text-red-500 border-red-500/50">
            {item.reason}
          </Badge>
        </div>
      )}
    </button>
  )
}
