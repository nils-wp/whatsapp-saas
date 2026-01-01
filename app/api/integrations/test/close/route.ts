import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/integrations/close'

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key ist erforderlich' },
        { status: 400 }
      )
    }

    const success = await testConnection({ apiKey })

    if (success) {
      return NextResponse.json({ success: true, message: 'Verbindung erfolgreich!' })
    } else {
      return NextResponse.json(
        { error: 'Verbindung fehlgeschlagen. Bitte prüfe deinen API Key.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Close test error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
