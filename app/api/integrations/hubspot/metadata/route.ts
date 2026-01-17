import { NextRequest, NextResponse } from 'next/server'
import * as hubspot from '@/lib/integrations/hubspot'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    const config = { accessToken }

    // Fetch all metadata in parallel
    const [pipelines, forms, contactProperties, ticketPipelines] = await Promise.all([
      hubspot.getPipelinesWithStages(config),
      hubspot.getForms(config),
      hubspot.getContactProperties(config),
      hubspot.getTicketPipelines(config),
    ])

    // Flatten stages from all pipelines
    const allStages = pipelines.flatMap(p =>
      p.stages.map(s => ({ ...s, pipelineId: p.id, pipelineLabel: p.label }))
    )

    // Flatten ticket stages from all ticket pipelines
    const allTicketStages = ticketPipelines.flatMap(p =>
      p.stages.map(s => ({ ...s, pipelineId: p.id, pipelineLabel: p.label }))
    )

    return NextResponse.json({
      pipelines: pipelines.map(p => ({ id: p.id, label: p.label })),
      stages: allStages,
      forms,
      contactProperties,
      ticketPipelines: ticketPipelines.map(p => ({ id: p.id, label: p.label })),
      ticketStages: allTicketStages,
    })
  } catch (error) {
    console.error('HubSpot metadata error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    )
  }
}
