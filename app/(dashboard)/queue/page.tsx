'use client'

import { useState } from 'react'
import {
  Inbox,
  Clock,
  AlertTriangle,
  MessageSquare,
  Send,
  Check,
  X,
  ExternalLink,
  User,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/shared/empty-state'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

type QueueItem = {
  id: string
  type: 'outside_hours' | 'human_review'
  contactName: string
  contactPhone: string
  message: string
  reason?: string
  suggestedResponse?: string
  createdAt: Date
  conversationId: string
}

const MOCK_QUEUE: QueueItem[] = [
  {
    id: '1',
    type: 'human_review',
    contactName: 'Max Mustermann',
    contactPhone: '+49 151 12345678',
    message: 'How much does it cost? Do you also offer a guarantee?',
    reason: 'Price question detected',
    suggestedResponse: 'Great question! The investment depends on your situation, so we should discuss it in a personal call. Would you like to schedule a quick chat?',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    conversationId: 'conv_1',
  },
  {
    id: '2',
    type: 'human_review',
    contactName: 'Anna Schmidt',
    contactPhone: '+49 171 98765432',
    message: 'I want to complain, the last conversation was not helpful',
    reason: 'Complaint detected',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    conversationId: 'conv_2',
  },
  {
    id: '3',
    type: 'outside_hours',
    contactName: 'Peter Schulz',
    contactPhone: '+49 162 11223344',
    message: 'Hello, I saw your webinar and would like to learn more!',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    conversationId: 'conv_3',
  },
  {
    id: '4',
    type: 'outside_hours',
    contactName: 'Lisa Meyer',
    contactPhone: '+49 176 55667788',
    message: 'Hey, do you also have something for B2B?',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    conversationId: 'conv_4',
  },
]

export default function QueuePage() {
  const [items, setItems] = useState(MOCK_QUEUE)
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)
  const [response, setResponse] = useState('')

  const humanReviewItems = items.filter((i) => i.type === 'human_review')
  const outsideHoursItems = items.filter((i) => i.type === 'outside_hours')

  const handleSendResponse = () => {
    if (!selectedItem || !response.trim()) return

    toast.success('Response sent')
    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
    setSelectedItem(null)
    setResponse('')
  }

  const handleReturnToAgent = () => {
    if (!selectedItem) return

    toast.success('Returned to agent')
    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
    setSelectedItem(null)
    setResponse('')
  }

  const handleDismiss = () => {
    if (!selectedItem) return

    toast.success('Item removed')
    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
    setSelectedItem(null)
    setResponse('')
  }

  const selectItem = (item: QueueItem) => {
    setSelectedItem(item)
    setResponse(item.suggestedResponse || '')
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
          <Tabs defaultValue="human_review">
            <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
              <TabsTrigger value="human_review" className="gap-2 data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
                <AlertTriangle className="h-4 w-4" />
                Escalated
                {humanReviewItems.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {humanReviewItems.length}
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

            <TabsContent value="human_review" className="mt-4">
              {humanReviewItems.length === 0 ? (
                <EmptyState
                  icon={Check}
                  title="All done"
                  description="No escalated conversations"
                />
              ) : (
                <div className="space-y-2">
                  {humanReviewItems.map((item) => (
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
                        {selectedItem.contactName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base text-white">
                        {selectedItem.contactName}
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        {selectedItem.contactPhone}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="bg-transparent border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white">
                    <a href={`/conversations/${selectedItem.conversationId}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </a>
                  </Button>
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
                    <p className="text-sm text-white">{selectedItem.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(selectedItem.createdAt, {
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
                  {selectedItem.suggestedResponse && (
                    <p className="text-xs text-gray-500">
                      <Bot className="inline h-3 w-3 mr-1" />
                      AI suggestion inserted
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSendResponse} disabled={!response.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                  <Button variant="outline" onClick={handleReturnToAgent} className="bg-transparent border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white">
                    <Bot className="mr-2 h-4 w-4" />
                    Return to Agent
                  </Button>
                  <Button variant="ghost" onClick={handleDismiss} className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
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
  item: QueueItem
  selected: boolean
  onClick: () => void
}) {
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
              {item.contactName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate text-white">{item.contactName}</div>
            <div className="text-sm text-gray-500 truncate">
              {item.message}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(item.createdAt, {
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
