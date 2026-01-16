'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Shield,
  UserCog,
  Trash2,
  Clock,
  Copy,
  Check,
  Loader2,
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
import { useTenant } from '@/providers/tenant-provider'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from '@/providers/locale-provider'

type TeamMember = {
  id: string
  userId?: string
  name: string | null
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending'
  invitedAt?: string
}

export default function TeamPage() {
  const { currentTenant, user } = useTenant()
  const t = useTranslations('team')
  const tCommon = useTranslations('common')

  const ROLE_LABELS = {
    owner: { label: t('role.owner'), variant: 'default' as const },
    admin: { label: t('role.admin'), variant: 'secondary' as const },
    member: { label: t('role.member'), variant: 'outline' as const },
  }
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const fetchMembers = async () => {
    if (!currentTenant) return

    try {
      const response = await fetch(`/api/team/members?tenantId=${currentTenant.id}`)
      const data = await response.json()

      if (response.ok && data.members) {
        setMembers(data.members.map((m: { id: string; userId?: string; name?: string; email: string; role: string; status: string; invitedAt?: string }) => ({
          id: m.id,
          userId: m.userId,
          name: m.name,
          email: m.email,
          role: m.role as 'owner' | 'admin' | 'member',
          status: m.status as 'active' | 'pending',
          invitedAt: m.invitedAt,
        })))
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [currentTenant])

  const handleInvite = async () => {
    if (!inviteEmail || !currentTenant) return

    setIsInviting(true)
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          tenantId: currentTenant.id,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to create invite')
        return
      }

      setInviteUrl(data.inviteUrl)
      toast.success(`${t('inviteCreated')} ${inviteEmail}`)

      // Add to members list
      setMembers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: null,
          email: inviteEmail,
          role: inviteRole,
          status: 'pending',
          invitedAt: new Date().toISOString(),
        },
      ])
    } catch {
      toast.error('Failed to send invite')
    } finally {
      setIsInviting(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success(t('inviteCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!currentTenant) return

    try {
      const response = await fetch('/api/team/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId,
          tenantId: currentTenant.id,
        }),
      })

      if (!response.ok) {
        toast.error('Failed to cancel invite')
        return
      }

      setMembers((prev) => prev.filter((m) => m.id !== inviteId))
      toast.success(t('inviteCancelled'))
    } catch {
      toast.error('Failed to cancel invite')
    }
  }

  const closeDialog = () => {
    setShowInviteDialog(false)
    setInviteEmail('')
    setInviteUrl(null)
    setCopied(false)
  }

  const openRoleDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setNewRole(member.role === 'owner' ? 'admin' : member.role)
    setShowRoleDialog(true)
  }

  const handleChangeRole = async () => {
    if (!selectedMember || !currentTenant) return

    setIsUpdatingRole(true)
    try {
      const response = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember.id,
          tenantId: currentTenant.id,
          newRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to change role')
        return
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id ? { ...m, role: newRole } : m
        )
      )
      toast.success(`${t('roleChanged')} ${t(`role.${newRole}`)}`)
      setShowRoleDialog(false)
    } catch {
      toast.error('Failed to change role')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleRemoveMember = async (member: TeamMember) => {
    if (!currentTenant) return

    if (!confirm(t('confirmRemove').replace('{name}', member.name || member.email))) return

    setIsRemoving(true)
    try {
      const response = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          tenantId: currentTenant.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to remove member')
        return
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      toast.success(t('memberRemoved'))
    } catch {
      toast.error('Failed to remove member')
    } finally {
      setIsRemoving(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    }
    return email[0].toUpperCase()
  }

  const currentUserRole = members.find((m) => m.email === user?.email)?.role
  const canInvite = currentUserRole === 'owner' || currentUserRole === 'admin'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
        </div>
        {canInvite && (
          <Button onClick={() => setShowInviteDialog(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <UserPlus className="mr-2 h-4 w-4" />
            {t('invite')}
          </Button>
        )}
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-white">{t('teamMembers')}</CardTitle>
              <CardDescription className="text-gray-400">
                {members.length} {t('members')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-[#2a2a2a] p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-[#3a3a3a]">
                    <AvatarFallback className="bg-emerald-500/10 text-emerald-500">
                      {getInitials(member.name, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {member.name || member.email}
                      </span>
                      {member.status === 'pending' && (
                        <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/50">
                          <Clock className="mr-1 h-3 w-3" />
                          {t('pending')}
                        </Badge>
                      )}
                    </div>
                    {member.name && (
                      <div className="text-sm text-gray-400">
                        {member.email}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={ROLE_LABELS[member.role].variant}>
                    {ROLE_LABELS[member.role].label}
                  </Badge>
                  {member.role !== 'owner' && canInvite && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {member.status === 'active' && currentUserRole === 'owner' && (
                          <DropdownMenuItem
                            onClick={() => openRoleDialog(member)}
                            className="text-gray-300 focus:text-white focus:bg-[#252525]"
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            {t('changeRole')}
                          </DropdownMenuItem>
                        )}
                        {member.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleCancelInvite(member.id)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('cancelInvite')}
                          </DropdownMenuItem>
                        )}
                        {member.status === 'active' && (
                          <>
                            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member)}
                              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('remove')}
                            </DropdownMenuItem>
                          </>
                        )}
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
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-white">{t('rolesAndPermissions')}</CardTitle>
              <CardDescription className="text-gray-400">
                {t('rolesOverview')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{t('role.owner')}</Badge>
              </div>
              <p className="text-sm text-gray-400">
                {t('ownerDesc')}
              </p>
            </div>
            <div className="rounded-lg border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{t('role.admin')}</Badge>
              </div>
              <p className="text-sm text-gray-400">
                {t('adminDesc')}
              </p>
            </div>
            <div className="rounded-lg border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{t('role.member')}</Badge>
              </div>
              <p className="text-sm text-gray-400">
                {t('memberDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={closeDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">{t('inviteTeamMember')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {inviteUrl
                ? t('shareInviteLink')
                : t('sendInvitation')}
            </DialogDescription>
          </DialogHeader>

          {!inviteUrl ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">{t('emailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2a2a2a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-300">{t('role.admin').split(' ')[0]}</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="admin">{t('role.admin')}</SelectItem>
                    <SelectItem value="member">{t('role.member')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-sm"
                />
                <Button onClick={handleCopyInvite} variant="outline" className="border-[#2a2a2a] shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('linkUsedOnce')}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-[#2a2a2a]">
              {inviteUrl ? t('done') : tCommon('cancel')}
            </Button>
            {!inviteUrl && (
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail || isInviting}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {isInviting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {t('createInvite')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">{t('changeRole')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('changeRoleFor')} {selectedMember?.name || selectedMember?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className="text-gray-300 mb-3 block">{t('selectNewRole')}</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'member')}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span>{t('role.admin')}</span>
                    <span className="text-xs text-gray-500">{t('adminRoleDesc')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="flex flex-col">
                    <span>{t('role.member')}</span>
                    <span className="text-xs text-gray-500">{t('memberRoleDesc')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="border-[#2a2a2a]">
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={isUpdatingRole || newRole === selectedMember?.role}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isUpdatingRole ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCog className="mr-2 h-4 w-4" />
              )}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
