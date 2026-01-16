import { NextRequest, NextResponse } from 'next/server'
import * as monday from '@/lib/integrations/monday'

export async function POST(request: NextRequest) {
  try {
    const { apiToken } = await request.json()

    if (!apiToken) {
      return NextResponse.json(
        { boards: [] },
        { status: 400 }
      )
    }

    const config: monday.MondayConfig = { apiToken }
    const boards = await monday.getBoards(config)

    return NextResponse.json({ boards })
  } catch (error) {
    console.error('Monday boards error:', error)
    return NextResponse.json(
      { boards: [] },
      { status: 500 }
    )
  }
}
