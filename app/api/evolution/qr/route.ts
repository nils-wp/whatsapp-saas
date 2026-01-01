import { NextResponse } from 'next/server'
import { createInstance, getQRCode, getInstanceStatus } from '@/lib/evolution/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { instanceName } = await request.json()

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      )
    }

    // Check if instance exists first
    const statusResult = await getInstanceStatus(instanceName)

    if (statusResult.success && statusResult.data?.state === 'open') {
      return NextResponse.json({ connected: true })
    }

    // Create instance if it doesn't exist
    await createInstance(instanceName)

    // Get QR code
    const qrResult = await getQRCode(instanceName)

    if (!qrResult.success) {
      return NextResponse.json(
        { error: 'Failed to get QR code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      qrCode: qrResult.data?.base64
        ? `data:image/png;base64,${qrResult.data.base64}`
        : null,
    })
  } catch (error) {
    console.error('Error in QR route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
