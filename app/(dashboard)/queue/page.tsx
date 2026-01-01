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
import { de } from 'date-fns/locale'

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
    message: 'Was kostet das ganze? Habt ihr auch eine Garantie?',
    reason: 'Preisfrage erkannt',
    suggestedResponse: 'Gute Frage! Die Investition besprechen wir am besten im persönlichen Gespräch, da sie von deiner Situation abhängt. Sollen wir kurz telefonieren?',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    conversationId: 'conv_1',
  },
  {
    id: '2',
    type: 'human_review',
    contactName: 'Anna Schmidt',
    contactPhone: '+49 171 98765432',
    message: 'Ich möchte mich beschweren, das letzte Gespräch war nicht hilfreich',
    reason: 'Beschwerde erkannt',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    conversationId: 'conv_2',
  },
  {
    id: '3',
    type: 'outside_hours',
    contactName: 'Peter Schulz',
    contactPhone: '+49 162 11223344',
    message: 'Hallo, ich habe euer Webinar gesehen und würde gerne mehr erfahren!',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    conversationId: 'conv_3',
  },
  {
    id: '4',
    type: 'outside_hours',
    contactName: 'Lisa Meyer',
    contactPhone: '+49 176 55667788',
    message: 'Hey, habt ihr auch was für B2B?',
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

    toast.success('Antwort gesendet')
    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
    setSelectedItem(null)
    setResponse('')
  }

  const handleReturnToAgent = () => {
    if (!selectedItem) return

    toast.success('Zurück an Agent übergeben')
    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
    setSelectedItem(null)
    setResponse('')
  }

  const handleDismiss = () => {
    if (!selectedItem) return

    toast.success('Item entfernt')
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
        <h1 className="text-2xl font-bold">Queue</h1>
        <p className="text-muted-foreground">
          Nachrichten die auf deine Aufmerksamkeit warten.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queue List */}
        <div className="space-y-4">
          <Tabs defaultValue="human_review">
            <TabsList className="bg-secondary">
              <TabsTrigger value="human_review" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Eskaliert
                {humanReviewItems.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {humanReviewItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="outside_hours" className="gap-2">
                <Clock className="h-4 w-4" />
                Außerhalb Geschäftszeit
                {outsideHoursItems.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {outsideHoursItems.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="human_review" className="mt-4">
              {humanReviewItems.length === 0 ? (
                <EmptyState
                  icon={Check}
                  title="Alles erledigt"
                  description="Keine eskalierten Konversationen"
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
                  title="Alles erledigt"
                  description="Keine Nachrichten außerhalb der Geschäftszeit"
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
        <Card className="h-fit lg:sticky lg:top-24">
          {selectedItem ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {selectedItem.contactName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {selectedItem.contactName}
                      </CardTitle>
                      <CardDescription>
                        {selectedItem.contactPhone}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/conversations/${selectedItem.conversationId}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Öffnen
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reason */}
                {selectedItem.reason && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      {selectedItem.reason}
                    </span>
                  </div>
                )}

                {/* Original Message */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Nachricht
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-sm">{selectedItem.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(selectedItem.createdAt, {
                        addSuffix: true,
                        locale: de,
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Response */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Deine Antwort
                  </div>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Schreibe eine Antwort..."
                    rows={4}
                  />
                  {selectedItem.suggestedResponse && (
                    <p className="text-xs text-muted-foreground">
                      <Bot className="inline h-3 w-3 mr-1" />
                      AI-Vorschlag wurde eingefügt
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSendResponse} disabled={!response.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Senden
                  </Button>
                  <Button variant="outline" onClick={handleReturnToAgent}>
                    <Bot className="mr-2 h-4 w-4" />
                    An Agent zurückgeben
                  </Button>
                  <Button variant="ghost" onClick={handleDismiss}>
                    <X className="mr-2 h-4 w-4" />
                    Entfernen
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Wähle eine Nachricht aus der Queue um zu antworten
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
          ? 'border-primary bg-primary/5'
          : 'hover:border-primary/50 hover:bg-accent'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback>
              {item.contactName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate">{item.contactName}</div>
            <div className="text-sm text-muted-foreground truncate">
              {item.message}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(item.createdAt, {
              addSuffix: true,
              locale: de,
            })}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {item.reason && (
        <div className="mt-2">
          <Badge variant="outline" className="text-xs text-destructive border-destructive/50">
            {item.reason}
          </Badge>
        </div>
      )}
    </button>
  )
}
