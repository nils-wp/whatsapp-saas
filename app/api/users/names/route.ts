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
 * POST /api/users/names
 * Get user names for a list of user IDs
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 })
    }

    // Filter out null/undefined values
    const validIds = userIds.filter((id): id is string => !!id)

    if (validIds.length === 0) {
      return NextResponse.json({ users: {} })
    }

    // Get user details from auth.users via admin API
    const { data: usersData } = await serviceSupabase.auth.admin.listUsers()

    const usersMap: Record<string, { name: string | null; email: string }> = {}

    for (const id of validIds) {
      const userData = usersData?.users?.find(u => u.id === id)
      if (userData) {
        usersMap[id] = {
          name: userData.user_metadata?.full_name || userData.user_metadata?.name || null,
          email: userData.email || 'Unknown'
        }
      }
    }

    return NextResponse.json({ users: usersMap })

  } catch (error) {
    console.error('Get user names error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
