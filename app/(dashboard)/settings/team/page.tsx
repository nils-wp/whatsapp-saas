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

type TeamMember = {
  id: string
  name: string | null
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending'
  invitedAt?: string
}

const ROLE_LABELS = {
  owner: { label: 'Owner', variant: 'default' as const },
  admin: { label: 'Admin', variant: 'secondary' as const },
  member: { label: 'Member', variant: 'outline' as const },
}

export default function TeamPage() {
  const { currentTenant, user } = useTenant()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchMembers() {
      if (!currentTenant) return

      const supabase = createClient()

      // Get active members
      const { data: membersData } = await supabase
        .from('tenant_members')
        .select('id, user_id, role, invited_email, invited_at, accepted_at')
        .eq('tenant_id', currentTenant.id)

      if (!membersData) {
        setIsLoading(false)
        return
      }

      // Get user details for active members
      const membersList: TeamMember[] = []

      for (const m of membersData) {
        if (m.accepted_at && m.user_id) {
          // Active member - fetch user details
          const { data: userData } = await supabase
            .rpc('get_user_email', { user_id: m.user_id })

          membersList.push({
            id: m.id,
            name: null,
            email: userData || m.invited_email || 'Unknown',
            role: m.role as 'owner' | 'admin' | 'member',
            status: 'active',
          })
        } else if (m.invited_email) {
          // Pending invite
          membersList.push({
            id: m.id,
            name: null,
            email: m.invited_email,
            role: m.role as 'owner' | 'admin' | 'member',
            status: 'pending',
            invitedAt: m.invited_at,
          })
        }
      }

      setMembers(membersList)
      setIsLoading(false)
    }

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
      toast.success(`Invite created for ${inviteEmail}`)

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
    toast.success('Invite link copied!')
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
      toast.success('Invite cancelled')
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
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-400">
            Manage your team and permissions.
          </p>
        </div>
        {canInvite && (
          <Button onClick={() => setShowInviteDialog(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
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
              <CardTitle className="text-white">Team Members</CardTitle>
              <CardDescription className="text-gray-400">
                {members.length} member{members.length !== 1 && 's'}
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
                          Pending
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
                        <DropdownMenuItem className="text-gray-300 focus:text-white focus:bg-[#252525]">
                          <UserCog className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        {member.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleCancelInvite(member.id)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Invite
                          </DropdownMenuItem>
                        )}
                        {member.status === 'active' && (
                          <>
                            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                            <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
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
              <CardTitle className="text-white">Roles & Permissions</CardTitle>
              <CardDescription className="text-gray-400">
                Overview of different permission levels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge>Owner</Badge>
              </div>
              <p className="text-sm text-gray-400">
                Full access to all features including billing and team management.
                Can delete the project.
              </p>
            </div>
            <div className="rounded-lg border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Admin</Badge>
              </div>
              <p className="text-sm text-gray-400">
                Can manage agents, triggers, and conversations.
                Can invite team members (except admins).
              </p>
            </div>
            <div className="rounded-lg border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Member</Badge>
              </div>
              <p className="text-sm text-gray-400">
                Can view conversations and reply manually.
                No access to settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={closeDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              {inviteUrl
                ? 'Share this invite link with your team member.'
                : 'Send an invitation to a new team member.'}
            </DialogDescription>
          </DialogHeader>

          {!inviteUrl ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
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
                <Label htmlFor="role" className="text-gray-300">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
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
                This link can only be used once.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-[#2a2a2a]">
              {inviteUrl ? 'Done' : 'Cancel'}
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
                Create Invite
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
