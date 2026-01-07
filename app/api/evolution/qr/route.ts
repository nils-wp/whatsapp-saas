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
    const createResult = await createInstance(instanceName)
    console.log('[QR Route] Create instance result:', createResult)

    if (!createResult.success) {
      return NextResponse.json(
        { error: `Failed to create instance: ${createResult.error}` },
        { status: 500 }
      )
    }

    // Get QR code
    const qrResult = await getQRCode(instanceName)
    console.log('[QR Route] QR code result:', qrResult)

    if (!qrResult.success) {
      return NextResponse.json(
        { error: `Failed to get QR code: ${qrResult.error}` },
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
