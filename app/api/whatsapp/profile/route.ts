import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getProfilePicture,
  getBusinessProfile,
  updateProfileName,
  updateProfilePicture,
  updateProfileStatus,
} from '@/lib/evolution/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/whatsapp/profile?accountId=xxx&phone=xxx - Get profile info
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const phone = searchParams.get('phone')
    const type = searchParams.get('type') || 'picture'

    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('instance_name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 })
    }

    let result
    if (type === 'business') {
      result = await getBusinessProfile(account.instance_name, phone)
    } else {
      result = await getProfilePicture(account.instance_name, phone)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/whatsapp/profile - Update own profile
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { accountId, field, value } = body

    if (!accountId || !field || !value) {
      return NextResponse.json(
        { error: 'accountId, field, and value required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('instance_name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const instanceName = account.instance_name
    let result

    switch (field) {
      case 'name':
        result = await updateProfileName(instanceName, value)
        break

      case 'picture':
        result = await updateProfilePicture(instanceName, value)
        break

      case 'status':
        result = await updateProfileStatus(instanceName, value)
        break

      default:
        return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
