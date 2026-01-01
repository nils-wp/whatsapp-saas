import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/integrations/activecampaign'

export async function POST(request: Request) {
  try {
    const { apiUrl, apiKey } = await request.json()

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'API URL und API Key sind erforderlich' },
        { status: 400 }
      )
    }

    const success = await testConnection({ apiUrl, apiKey })

    if (success) {
      return NextResponse.json({ success: true, message: 'Verbindung erfolgreich!' })
    } else {
      return NextResponse.json(
        { error: 'Verbindung fehlgeschlagen. Bitte prüfe deine Credentials.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('ActiveCampaign test error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
