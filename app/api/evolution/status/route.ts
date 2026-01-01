import { NextResponse } from 'next/server'
import { getInstanceStatus } from '@/lib/evolution/client'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

    if (!result.success) {
      return NextResponse.json({ status: 'disconnected' })
    }

    const state = result.data?.state

    // Update database if connected
    if (state === 'open') {
      const supabase = getSupabase()
      await supabase
        .from('whatsapp_accounts')
        .update({ status: 'connected' })
        .eq('instance_name', instanceName)
    }

    return NextResponse.json({
      status: state === 'open' ? 'connected' : 'disconnected',
    })
  } catch (error) {
    console.error('Error in status route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
