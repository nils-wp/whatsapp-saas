'use client'

import { useState } from 'react'
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Shield,
  UserCog,
  Trash2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type TeamMember = {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  avatar?: string
  status: 'active' | 'pending'
  invitedAt?: string
}

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Sebastian Müller',
    email: 'sebastian@wachstumspartner.de',
    role: 'owner',
    status: 'active',
  },
  {
    id: '2',
    name: 'Anna Schmidt',
    email: 'anna@wachstumspartner.de',
    role: 'admin',
    status: 'active',
  },
  {
    id: '3',
    name: '',
    email: 'max@wachstumspartner.de',
    role: 'member',
    status: 'pending',
    invitedAt: '2024-01-10',
  },
]

const ROLE_LABELS = {
  owner: { label: 'Owner', variant: 'default' as const },
  admin: { label: 'Admin', variant: 'secondary' as const },
  member: { label: 'Mitglied', variant: 'outline' as const },
}

export default function TeamPage() {
  const [members] = useState<TeamMember[]>(MOCK_MEMBERS)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')

  const handleInvite = () => {
    if (!inviteEmail) return
    toast.success(`Einladung an ${inviteEmail} gesendet`)
    setInviteEmail('')
    setShowInviteDialog(false)
  }

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    }
    return email[0].toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Verwalte dein Team und Berechtigungen.
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Einladen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Team-Mitglieder</CardTitle>
              <CardDescription>
                {members.length} Mitglied{members.length !== 1 && 'er'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {getInitials(member.name, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.name || member.email}
                      </span>
                      {member.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          Ausstehend
                        </Badge>
                      )}
                    </div>
                    {member.name && (
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={ROLE_LABELS[member.role].variant}>
                    {ROLE_LABELS[member.role].label}
                  </Badge>
                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCog className="mr-2 h-4 w-4" />
                          Rolle ändern
                        </DropdownMenuItem>
                        {member.status === 'pending' && (
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Erneut einladen
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Entfernen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roles Explanation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Rollen & Berechtigungen</CardTitle>
              <CardDescription>
                Übersicht der verschiedenen Berechtigungsstufen
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge>Owner</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Voller Zugriff auf alle Funktionen inkl. Abrechnung und Team-Verwaltung.
                Kann das Projekt löschen.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Admin</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Kann Agents, Triggers und Konversationen verwalten.
                Kann Team-Mitglieder einladen (außer Admins).
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Mitglied</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Kann Konversationen einsehen und manuell antworten.
                Kein Zugriff auf Einstellungen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team-Mitglied einladen</DialogTitle>
            <DialogDescription>
              Sende eine Einladung per E-Mail an ein neues Team-Mitglied.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="kollege@firma.de"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rolle</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Mitglied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Einladung senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
