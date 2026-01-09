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
 * GET /api/team/members
 * Get all team members with their user details
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all members
    const { data: membersData, error } = await supabase
      .from('tenant_members')
      .select('id, user_id, role, invited_email, invited_at, accepted_at')
      .eq('tenant_id', tenantId)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Get user details from auth.users via admin API
    const { data: usersData } = await serviceSupabase.auth.admin.listUsers()
    const usersMap = new Map(
      usersData?.users?.map(u => [u.id, {
        email: u.email,
        name: u.user_metadata?.full_name || u.user_metadata?.name || null
      }]) || []
    )

    // Build members list with user details
    const members = membersData?.map(m => {
      const userData = m.user_id ? usersMap.get(m.user_id) : null

      return {
        id: m.id,
        userId: m.user_id,
        name: userData?.name || null,
        email: userData?.email || m.invited_email || 'Unknown',
        role: m.role,
        status: m.accepted_at ? 'active' : 'pending',
        invitedAt: m.invited_at,
        acceptedAt: m.accepted_at,
      }
    }) || []

    return NextResponse.json({ members })

  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/team/members
 * Update a member's role
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId, tenantId, newRole } = await request.json()

    if (!memberId || !tenantId || !newRole) {
      return NextResponse.json({ error: 'memberId, tenantId, and newRole required' }, { status: 400 })
    }

    if (!['admin', 'member'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin or member' }, { status: 400 })
    }

    // Check if current user is owner of this tenant
    const { data: currentMembership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!currentMembership || currentMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can change roles' }, { status: 403 })
    }

    // Get target member to check they're not the owner
    const { data: targetMember } = await supabase
      .from('tenant_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
    }

    // Update the role
    const { error: updateError } = await serviceSupabase
      .from('tenant_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (updateError) {
      console.error('Update role error:', updateError)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newRole })

  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/team/members
 * Remove a member from the team
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId, tenantId } = await request.json()

    if (!memberId || !tenantId) {
      return NextResponse.json({ error: 'memberId and tenantId required' }, { status: 400 })
    }

    // Check if current user is owner or admin
    const { data: currentMembership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get target member
    const { data: targetMember } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 })
    }

    // Admins can only remove members, not other admins
    if (currentMembership.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot remove other admins' }, { status: 403 })
    }

    // Delete the member
    const { error: deleteError } = await serviceSupabase
      .from('tenant_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Delete member error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
