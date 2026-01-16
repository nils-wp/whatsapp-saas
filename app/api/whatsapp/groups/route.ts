import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createGroup,
  getGroups,
  getGroupInfo,
  updateGroupName,
  updateGroupDescription,
  addGroupParticipants,
  removeGroupParticipants,
  promoteGroupParticipants,
  demoteGroupParticipants,
  leaveGroup,
  getGroupInviteCode,
  revokeGroupInviteCode,
  sendGroupMessage,
} from '@/lib/evolution/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/whatsapp/groups?accountId=xxx - List all groups
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const groupId = searchParams.get('groupId')

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

    if (groupId) {
      // Get specific group info
      const result = await getGroupInfo(account.instance_name, groupId)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ success: true, data: result.data })
    }

    // List all groups
    const result = await getGroups(account.instance_name)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/whatsapp/groups - Create group or perform group action
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accountId, action, groupId, name, description, participants, message } = body

    if (!accountId || !action) {
      return NextResponse.json({ error: 'accountId and action required' }, { status: 400 })
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

    switch (action) {
      case 'create':
        if (!name || !participants || participants.length === 0) {
          return NextResponse.json({ error: 'name and participants required' }, { status: 400 })
        }
        result = await createGroup(instanceName, name, participants)
        break

      case 'updateName':
        if (!groupId || !name) {
          return NextResponse.json({ error: 'groupId and name required' }, { status: 400 })
        }
        result = await updateGroupName(instanceName, groupId, name)
        break

      case 'updateDescription':
        if (!groupId || !description) {
          return NextResponse.json({ error: 'groupId and description required' }, { status: 400 })
        }
        result = await updateGroupDescription(instanceName, groupId, description)
        break

      case 'addParticipants':
        if (!groupId || !participants || participants.length === 0) {
          return NextResponse.json({ error: 'groupId and participants required' }, { status: 400 })
        }
        result = await addGroupParticipants(instanceName, groupId, participants)
        break

      case 'removeParticipants':
        if (!groupId || !participants || participants.length === 0) {
          return NextResponse.json({ error: 'groupId and participants required' }, { status: 400 })
        }
        result = await removeGroupParticipants(instanceName, groupId, participants)
        break

      case 'promoteParticipants':
        if (!groupId || !participants || participants.length === 0) {
          return NextResponse.json({ error: 'groupId and participants required' }, { status: 400 })
        }
        result = await promoteGroupParticipants(instanceName, groupId, participants)
        break

      case 'demoteParticipants':
        if (!groupId || !participants || participants.length === 0) {
          return NextResponse.json({ error: 'groupId and participants required' }, { status: 400 })
        }
        result = await demoteGroupParticipants(instanceName, groupId, participants)
        break

      case 'leave':
        if (!groupId) {
          return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        }
        result = await leaveGroup(instanceName, groupId)
        break

      case 'getInviteCode':
        if (!groupId) {
          return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        }
        result = await getGroupInviteCode(instanceName, groupId)
        break

      case 'revokeInviteCode':
        if (!groupId) {
          return NextResponse.json({ error: 'groupId required' }, { status: 400 })
        }
        result = await revokeGroupInviteCode(instanceName, groupId)
        break

      case 'sendMessage':
        if (!groupId || !message) {
          return NextResponse.json({ error: 'groupId and message required' }, { status: 400 })
        }
        result = await sendGroupMessage(instanceName, groupId, message)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Group action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
