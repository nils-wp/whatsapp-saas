import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/team/invite
 * Invite a user to the current tenant
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, tenantId, role = 'member' } = await request.json()

    if (!email || !tenantId) {
      return NextResponse.json({ error: 'Email and tenantId required' }, { status: 400 })
    }

    // Check if user is owner/admin of this tenant
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Not authorized to invite' }, { status: 403 })
    }

    // Check if user already exists using admin API
    const { data: usersList } = await serviceSupabase.auth.admin.listUsers()
    const existingUser = usersList?.users?.find(u => u.email === email)

    // Check if already a member or invited
    let existingMemberQuery = serviceSupabase
      .from('tenant_members')
      .select('id, user_id, invited_email')
      .eq('tenant_id', tenantId)

    if (existingUser?.id) {
      existingMemberQuery = existingMemberQuery.or(`user_id.eq.${existingUser.id},invited_email.eq.${email}`)
    } else {
      existingMemberQuery = existingMemberQuery.eq('invited_email', email)
    }

    const { data: existingMember } = await existingMemberQuery.maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'User already invited or member' }, { status: 400 })
    }

    // Create invite
    const { data: invite, error: inviteError } = await serviceSupabase
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: existingUser?.id || null,
        invited_email: email,
        invited_at: new Date().toISOString(),
        role: role,
      })
      .select('id, invite_token')
      .single()

    if (inviteError) {
      console.error('Invite error:', inviteError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Get tenant name for the invite link
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://chatsetter.io'}/invite/${invite.invite_token}`

    // TODO: Send email with invite link
    // For now, just return the invite URL

    return NextResponse.json({
      success: true,
      inviteUrl,
      message: `Invite created for ${email}`,
    })

  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/team/invite
 * Get all pending invites for a tenant
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pending invites (no accepted_at)
    const { data: invites, error } = await supabase
      .from('tenant_members')
      .select('id, invited_email, invited_at, role')
      .eq('tenant_id', tenantId)
      .not('invited_email', 'is', null)
      .is('accepted_at', null)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    return NextResponse.json({ invites })

  } catch (error) {
    console.error('Get invites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/team/invite
 * Cancel an invite
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteId, tenantId } = await request.json()

    // Check if user is owner/admin
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete the invite
    await serviceSupabase
      .from('tenant_members')
      .delete()
      .eq('id', inviteId)
      .is('accepted_at', null)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
