import { NextResponse } from 'next/server'
import { processQueuedMessages, getQueueStats } from '@/lib/ai/queue-processor'

// POST /api/cron/process-queue
//
// Verarbeitet Nachrichten aus der Message Queue.
// Prüft für jeden Eintrag die individuellen Arbeitszeiten des Agents.
//
// WICHTIG: Sollte häufig laufen (alle 15 Min), NICHT nur um 08:00 Uhr!
// Der Processor prüft selbst, ob die Arbeitszeiten des jeweiligen Agents offen sind.
//
// Authentifizierung via CRON_SECRET Environment Variable.
//
// Beispiel Cron (Coolify/Vercel):
// - Schedule: jeden 15. Minute (cron: star-slash-15 * * * *)
// - URL: POST /api/cron/process-queue
// - Header: Authorization: Bearer CRON_SECRET
export async function POST(request: Request) {
  try {
    // Authenticate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process queued messages
    const result = await processQueuedMessages()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Cron process-queue error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/process-queue
 *
 * Gibt Queue-Statistiken zurück (für Monitoring).
 * Auch hier Authentifizierung erforderlich.
 */
export async function GET(request: Request) {
  try {
    // Authenticate request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stats = await getQueueStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Cron stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
