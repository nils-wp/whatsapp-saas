import { NextRequest, NextResponse } from 'next/server'
import * as monday from '@/lib/integrations/monday'

export async function POST(request: NextRequest) {
  try {
    const { apiToken } = await request.json()

    if (!apiToken) {
      return NextResponse.json(
        { success: false, error: 'API Token fehlt' },
        { status: 400 }
      )
    }

    const result = await monday.testConnection({ apiToken })

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
      })
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Verbindung fehlgeschlagen' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Monday test error:', error)
    return NextResponse.json(
      { success: false, error: 'Verbindungstest fehlgeschlagen' },
      { status: 500 }
    )
  }
}
