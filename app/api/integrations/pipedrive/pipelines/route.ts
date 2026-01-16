import { NextRequest, NextResponse } from 'next/server'
import * as pipedrive from '@/lib/integrations/pipedrive'

export async function POST(request: NextRequest) {
  try {
    const { apiToken } = await request.json()

    if (!apiToken) {
      return NextResponse.json(
        { pipelines: [], stages: [] },
        { status: 400 }
      )
    }

    const config: pipedrive.PipedriveConfig = { apiToken }

    const pipelines = await pipedrive.getPipelines(config)

    // Lade Stages für alle Pipelines
    const allStages: Array<{ id: string; name: string; pipeline_id: string }> = []

    for (const pipeline of pipelines) {
      const stages = await pipedrive.getPipelineStages(config, pipeline.id.toString())
      allStages.push(
        ...stages.map(s => ({
          id: s.id.toString(),
          name: s.name,
          pipeline_id: pipeline.id.toString(),
        }))
      )
    }

    return NextResponse.json({
      pipelines: pipelines.map(p => ({ id: p.id.toString(), name: p.name })),
      stages: allStages,
    })
  } catch (error) {
    console.error('Pipedrive pipelines error:', error)
    return NextResponse.json(
      { pipelines: [], stages: [] },
      { status: 500 }
    )
  }
}
