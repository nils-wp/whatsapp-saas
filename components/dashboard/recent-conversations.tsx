'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'>

interface RecentConversationsProps {
  conversations: Conversation[]
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  escalated: 'bg-red-500',
  completed: 'bg-blue-500',
  disqualified: 'bg-gray-500',
}

const statusLabels: Record<string, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  escalated: 'Eskaliert',
  completed: 'Abgeschlossen',
  disqualified: 'Disqualifiziert',
}

export function RecentConversations({ conversations }: RecentConversationsProps) {
  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Letzte Konversationen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Noch keine Konversationen vorhanden
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Letzte Konversationen
        </CardTitle>
        <Link href="/conversations">
          <Button variant="ghost" size="sm">
            Alle anzeigen
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Avatar>
                <AvatarFallback>
                  {conversation.contact_name?.[0] || conversation.contact_phone.slice(-2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {conversation.contact_name || conversation.contact_phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {conversation.last_message_at
                    ? formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: de,
                      })
                    : 'Keine Nachrichten'}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`${statusColors[conversation.status]} text-white`}
              >
                {statusLabels[conversation.status]}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
