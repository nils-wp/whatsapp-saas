import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Debug endpoint to check what's stored in conversations
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, contact_phone, contact_name, profile_picture_url, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Stats
    const withName = conversations?.filter(c => c.contact_name) || []
    const withPicture = conversations?.filter(c => c.profile_picture_url) || []

    return NextResponse.json({
      total: conversations?.length || 0,
      withName: withName.length,
      withPicture: withPicture.length,
      conversations: conversations?.map(c => ({
        phone: c.contact_phone,
        name: c.contact_name,
        hasPicture: !!c.profile_picture_url,
        pictureUrl: c.profile_picture_url?.substring(0, 50) + '...',
      }))
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
