'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, MessageSquare, Phone, Calendar, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageLoader } from '@/components/shared/loading-spinner'
import { useConversations } from '@/lib/hooks/use-conversations'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Contact {
  phone: string
  name: string | null
  pushName: string | null
  profilePicture: string | null
  conversationCount: number
  lastConversationId: string
  lastMessageAt: string | null
  status: string
  crmContactId: string | null
}

export default function ContactsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const { data: conversations, isLoading } = useConversations({})

  // Aggregate contacts from conversations
  const contacts = useMemo(() => {
    if (!conversations) return []

    const contactMap = new Map<string, Contact>()

    conversations.forEach((conv) => {
      const phone = conv.contact_phone
      const existing = contactMap.get(phone)

      if (!existing) {
        contactMap.set(phone, {
          phone,
          name: conv.contact_name,
          pushName: conv.contact_push_name,
          profilePicture: conv.profile_picture_url,
          conversationCount: 1,
          lastConversationId: conv.id,
          lastMessageAt: conv.last_message_at,
          status: conv.status,
          crmContactId: conv.crm_contact_id,
        })
      } else {
        existing.conversationCount++
        // Update with most recent data
        if (conv.last_message_at && (!existing.lastMessageAt || conv.last_message_at > existing.lastMessageAt)) {
          existing.lastMessageAt = conv.last_message_at
          existing.lastConversationId = conv.id
          existing.status = conv.status
        }
        if (conv.contact_name && !existing.name) {
          existing.name = conv.contact_name
        }
        if (conv.profile_picture_url && !existing.profilePicture) {
          existing.profilePicture = conv.profile_picture_url
        }
      }
    })

    return Array.from(contactMap.values()).sort((a, b) => {
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })
  }, [conversations])

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts

    const searchLower = search.toLowerCase()
    return contacts.filter(
      (c) =>
        c.phone.includes(search) ||
        c.name?.toLowerCase().includes(searchLower) ||
        c.pushName?.toLowerCase().includes(searchLower)
    )
  }, [contacts, search])

  const getDisplayName = (contact: Contact) => {
    return contact.name || contact.pushName || contact.phone
  }

  const getInitials = (contact: Contact) => {
    const name = contact.name || contact.pushName
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return contact.phone.slice(-2)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Aktiv', variant: 'default' },
      completed: { label: 'Abgeschlossen', variant: 'secondary' },
      escalated: { label: 'Eskaliert', variant: 'destructive' },
      booked: { label: 'Gebucht', variant: 'default' },
    }
    const config = variants[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Kontakte</h1>
          <p className="text-gray-400">
            {contacts.length} Kontakte aus {conversations?.length || 0} Konversationen
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Name oder Nummer suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Keine Kontakte gefunden' : 'Noch keine Kontakte'}
          description={
            search
              ? 'Versuche einen anderen Suchbegriff'
              : 'Kontakte erscheinen hier, sobald Konversationen stattfinden'
          }
        />
      ) : (
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Kontakt</TableHead>
                <TableHead className="text-slate-400">Telefon</TableHead>
                <TableHead className="text-slate-400 text-center">Konversationen</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Letzte Aktivität</TableHead>
                <TableHead className="text-slate-400 text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow
                  key={contact.phone}
                  className="border-slate-800 hover:bg-slate-900/50 cursor-pointer"
                  onClick={() => router.push(`/conversations/${contact.lastConversationId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.profilePicture || undefined} />
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-500">
                          {getInitials(contact)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{getDisplayName(contact)}</p>
                        {contact.name && contact.pushName && contact.name !== contact.pushName && (
                          <p className="text-xs text-slate-500">{contact.pushName}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                      <Phone className="h-3 w-3 text-slate-500" />
                      {contact.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {contact.conversationCount}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(contact.status)}</TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {contact.lastMessageAt ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(contact.lastMessageAt), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/conversations/${contact.lastConversationId}`)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                      {contact.crmContactId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                          title="Im CRM öffnen"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
