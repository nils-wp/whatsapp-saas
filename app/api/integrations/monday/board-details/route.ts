import { NextRequest, NextResponse } from 'next/server'
import * as monday from '@/lib/integrations/monday'

export async function POST(request: NextRequest) {
  try {
    const { apiToken, boardId } = await request.json()

    if (!apiToken || !boardId) {
      return NextResponse.json(
        { groups: [], columns: [] },
        { status: 400 }
      )
    }

    const config: monday.MondayConfig = { apiToken, boardId }

    const [groups, columns] = await Promise.all([
      monday.getBoardGroups(config),
      monday.getBoardColumns(config),
    ])

    return NextResponse.json({ groups, columns })
  } catch (error) {
    console.error('Monday board details error:', error)
    return NextResponse.json(
      { groups: [], columns: [] },
      { status: 500 }
    )
  }
}
