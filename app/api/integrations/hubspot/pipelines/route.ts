import { NextRequest, NextResponse } from 'next/server'
import * as hubspot from '@/lib/integrations/hubspot'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { pipelines: [], stages: [] },
        { status: 400 }
      )
    }

    const config: hubspot.HubSpotConfig = { accessToken }

    const pipelines = await hubspot.getPipelines(config)

    // Lade Stages für alle Pipelines
    const allStages: Array<{ id: string; label: string; pipeline_id: string }> = []

    for (const pipeline of pipelines) {
      const stages = await hubspot.getPipelineStages(config, pipeline.id)
      allStages.push(
        ...stages.map(s => ({
          id: s.id,
          label: s.label,
          pipeline_id: pipeline.id,
        }))
      )
    }

    return NextResponse.json({
      pipelines,
      stages: allStages,
    })
  } catch (error) {
    console.error('HubSpot pipelines error:', error)
    return NextResponse.json(
      { pipelines: [], stages: [] },
      { status: 500 }
    )
  }
}
