import { NextResponse } from 'next/server'
import { getInstanceStatus, getInstanceInfo } from '@/lib/evolution/client'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.warn('[Status API] Missing Supabase credentials, skipping DB update')
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get('instanceName')

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      )
    }

    const result = await getInstanceStatus(instanceName)
    console.log(`[Status API] ${instanceName} result:`, JSON.stringify(result))

    if (!result.success) {
      console.log(`[Status API] ${instanceName} not successful, returning disconnected`)
      return NextResponse.json({ status: 'disconnected' })
    }

    const state = result.data?.state
    console.log(`[Status API] ${instanceName} state:`, state)

    // Update database if connected
    if (state === 'open') {
      const supabase = getSupabase()

      if (supabase) {
        // Also fetch phone number from instance info
        let phoneNumber: string | undefined
        try {
          const infoResult = await getInstanceInfo(instanceName)
          console.log(`[Status Route] ${instanceName} info:`, infoResult)

          if (infoResult.success && infoResult.data) {
            const instances = Array.isArray(infoResult.data) ? infoResult.data : [infoResult.data]
            const instance = instances[0] as InstanceInfo

            // Evolution API v2 uses ownerJid, legacy uses instance.owner
            const ownerJid = instance?.ownerJid || instance?.instance?.owner
            if (ownerJid) {
              phoneNumber = ownerJid.replace('@s.whatsapp.net', '')
              console.log(`[Status Route] ${instanceName} phone:`, phoneNumber)
            }
          }
        } catch (err) {
          console.error('[Status Route] Error fetching instance info:', err)
        }

        const updateData: { status: string; phone_number?: string } = { status: 'connected' }
        if (phoneNumber) {
          updateData.phone_number = phoneNumber
        }

        await supabase
          .from('whatsapp_accounts')
          .update(updateData)
          .eq('instance_name', instanceName)
      }
    }

    // Return appropriate status based on state
    let mappedStatus = 'disconnected'
    if (state === 'open') {
      mappedStatus = 'connected'
    } else if (state === 'connecting') {
      mappedStatus = 'connecting'
    }

    return NextResponse.json({
      status: mappedStatus,
    })
  } catch (error) {
    console.error('Error in status route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
