import { NextRequest, NextResponse } from 'next/server'
import * as hubspot from '@/lib/integrations/hubspot'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access Token fehlt' },
        { status: 400 }
      )
    }

    const result = await hubspot.testConnection({ accessToken })

    if (result.success) {
      return NextResponse.json({
        success: true,
        portalId: result.portalId,
      })
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Verbindung fehlgeschlagen' },
      { status: 400 }
    )
  } catch (error) {
    console.error('HubSpot test error:', error)
    return NextResponse.json(
      { success: false, error: 'Verbindungstest fehlgeschlagen' },
      { status: 500 }
    )
  }
}
