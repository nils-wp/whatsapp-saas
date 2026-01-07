import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getInstanceStatus, getInstanceInfo } from '@/lib/evolution/client'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key)
}

interface InstanceInfo {
  // Evolution API v2 format
  ownerJid?: string
  profileName?: string
  profilePicUrl?: string
  // Legacy format
  instance?: {
    owner?: string
    profileName?: string
    profilePictureUrl?: string
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()

    if (!supabase) {
      console.error('[Sync Status] Missing Supabase credentials')
      return NextResponse.json(
        { error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const { accountIds } = await request.json()

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: 'Account IDs are required' },
        { status: 400 }
      )
    }

    // Get accounts from database
    const { data: accounts, error: fetchError } = await supabase
      .from('whatsapp_accounts')
      .select('id, instance_name, status, phone_number')
      .in('id', accountIds)

    if (fetchError || !accounts) {
      console.error('[Sync Status] Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    const updates: { id: string; status: string; phone_number?: string }[] = []

    // Check status for each account
    for (const account of accounts) {
      try {
        const statusResult = await getInstanceStatus(account.instance_name)
        console.log(`[Sync Status] ${account.instance_name} status:`, statusResult)

        let newStatus = account.status
        let phoneNumber = account.phone_number

        if (statusResult.success && statusResult.data?.state === 'open') {
          newStatus = 'connected'

          // Fetch phone number if not set
          if (!phoneNumber) {
            const infoResult = await getInstanceInfo(account.instance_name)
            console.log(`[Sync Status] ${account.instance_name} info:`, infoResult)

            if (infoResult.success && infoResult.data) {
              // Evolution API returns array of instances
              const instances = Array.isArray(infoResult.data) ? infoResult.data : [infoResult.data]
              const instance = instances[0] as InstanceInfo

              // Evolution API v2 uses ownerJid, legacy uses instance.owner
              const ownerJid = instance?.ownerJid || instance?.instance?.owner
              if (ownerJid) {
                // owner is the phone number with @s.whatsapp.net suffix
                phoneNumber = ownerJid.replace('@s.whatsapp.net', '')
                console.log(`[Sync Status] ${account.instance_name} phone:`, phoneNumber)
              }
            }
          }
        } else if (statusResult.success && statusResult.data?.state === 'close') {
          newStatus = 'disconnected'
        }

        // Update if status or phone number changed
        const statusChanged = newStatus !== account.status
        const phoneChanged = phoneNumber && phoneNumber !== account.phone_number

        if (statusChanged || phoneChanged) {
          const updateData: { status?: string; phone_number?: string } = {}
          if (statusChanged) updateData.status = newStatus
          if (phoneChanged) updateData.phone_number = phoneNumber

          const { error: updateError } = await supabase
            .from('whatsapp_accounts')
            .update(updateData)
            .eq('id', account.id)

          if (!updateError) {
            updates.push({ id: account.id, status: newStatus, phone_number: phoneNumber || undefined })
          } else {
            console.error(`[Sync Status] Update error for ${account.id}:`, updateError)
          }
        }
      } catch (err) {
        console.error(`[Sync Status] Error checking ${account.instance_name}:`, err)
      }
    }

    return NextResponse.json({ success: true, updates })
  } catch (error) {
    console.error('[Sync Status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
