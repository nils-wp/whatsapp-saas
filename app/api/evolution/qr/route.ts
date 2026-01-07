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

    // Create instance if it doesn't exist (ignore "already in use" error)
    const createResult = await createInstance(instanceName)
    console.log('[QR Route] Create instance result:', createResult)

    // If instance already exists, that's fine - just get QR code
    const isAlreadyInUse = createResult.error?.includes('already in use')
    if (!createResult.success && !isAlreadyInUse) {
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

    // Don't add prefix if it's already there
    let qrCode = qrResult.data?.base64 || null
    if (qrCode && !qrCode.startsWith('data:')) {
      qrCode = `data:image/png;base64,${qrCode}`
    }

    return NextResponse.json({ qrCode })
  } catch (error) {
    console.error('Error in QR route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
