import { NextRequest, NextResponse } from 'next/server'
import * as close from '@/lib/integrations/close'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { leadStatuses: [], opportunityStatuses: [] },
        { status: 400 }
      )
    }

    const config = { apiKey }

    const [leadStatuses, opportunityStatuses] = await Promise.all([
      close.getLeadStatuses(config),
      close.getOpportunityStatuses(config),
    ])

    return NextResponse.json({
      leadStatuses,
      opportunityStatuses,
    })
  } catch (error) {
    console.error('Close statuses error:', error)
    return NextResponse.json(
      { leadStatuses: [], opportunityStatuses: [] },
      { status: 500 }
    )
  }
}
