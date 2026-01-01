'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageLoader } from '@/components/shared/loading-spinner'
import { ConversationDetail } from '@/components/conversations/conversation-detail'
import { useConversation } from '@/lib/hooks/use-conversations'

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: conversation, isLoading } = useConversation(id)

  if (isLoading) {
    return <PageLoader />
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Konversation nicht gefunden</p>
        <Link href="/conversations">
          <Button variant="outline" className="mt-4">
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/conversations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {conversation.contact_name || conversation.contact_phone}
          </h1>
          <p className="text-muted-foreground">
            {conversation.agents?.name} &bull; {conversation.status}
          </p>
        </div>
      </div>

      <Card className="h-[calc(100vh-220px)]">
        <ConversationDetail conversation={conversation} />
      </Card>
    </div>
  )
}
