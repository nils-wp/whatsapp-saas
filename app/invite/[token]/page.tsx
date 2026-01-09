'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'found' | 'accepting' | 'success' | 'error' | 'login_required'>('loading')
  const [invite, setInvite] = useState<{ tenantName: string; role: string } | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function checkInvite() {
      const supabase = createClient()

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from('tenant_members')
        .select('id, tenant_id, role, invited_email, accepted_at, tenants(name)')
        .eq('invite_token', token)
        .single()

      if (inviteError || !inviteData) {
        setError('Invite not found or expired')
        setStatus('error')
        return
      }

      if (inviteData.accepted_at) {
        setError('This invite has already been used')
        setStatus('error')
        return
      }

      const tenantData = inviteData.tenants as { name: string } | { name: string }[] | null
      const tenantName = Array.isArray(tenantData) ? tenantData[0]?.name : tenantData?.name || 'Unknown'
      setInvite({ tenantName, role: inviteData.role })

      if (!user) {
        setStatus('login_required')
        return
      }

      // Check if user email matches invite
      if (inviteData.invited_email && user.email !== inviteData.invited_email) {
        setError(`This invite is for ${inviteData.invited_email}. Please login with that email.`)
        setStatus('error')
        return
      }

      setStatus('found')
    }

    checkInvite()
  }, [token])

  async function acceptInvite() {
    setStatus('accepting')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStatus('login_required')
      return
    }

    // Update invite to accept it
    const { error } = await supabase
      .from('tenant_members')
      .update({
        user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('invite_token', token)
      .is('accepted_at', null)

    if (error) {
      setError('Failed to accept invite')
      setStatus('error')
      return
    }

    setStatus('success')
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            {status === 'success' ? 'Welcome!' : status === 'error' ? 'Oops!' : 'Team Invite'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {status === 'success'
              ? 'You have joined the team'
              : status === 'error'
              ? error
              : invite
              ? `You've been invited to join "${invite.tenantName}"`
              : 'Processing invite...'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'found' && invite && (
            <>
              <div className="p-4 rounded-lg bg-[#252525] text-center">
                <p className="text-gray-400 text-sm">You will join as</p>
                <p className="text-white font-medium capitalize">{invite.role}</p>
              </div>
              <Button
                onClick={acceptInvite}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                Accept Invite
              </Button>
            </>
          )}

          {status === 'accepting' && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <p className="text-gray-400">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <Button asChild variant="outline" className="border-[#2a2a2a]">
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </div>
          )}

          {status === 'login_required' && invite && (
            <>
              <div className="p-4 rounded-lg bg-[#252525] text-center">
                <p className="text-gray-400 text-sm mb-2">You need to login to accept this invite</p>
                <p className="text-white">Join "{invite.tenantName}" as {invite.role}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                  <Link href={`/login?redirect=/invite/${token}`}>Login</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-[#2a2a2a]">
                  <Link href={`/signup?redirect=/invite/${token}`}>Sign Up</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
