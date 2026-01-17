import { NextRequest, NextResponse } from 'next/server'
import * as ac from '@/lib/integrations/activecampaign'

export async function POST(request: NextRequest) {
  try {
    const { apiUrl, apiKey } = await request.json()

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'API URL and Key required' },
        { status: 400 }
      )
    }

    const config = { apiUrl, apiKey }

    // Fetch all metadata in parallel
    const [lists, pipelines, stages, forms, automations, campaigns, tags] = await Promise.all([
      ac.getLists(config),
      ac.getPipelines(config),
      ac.getStages(config),
      ac.getForms(config),
      ac.getAutomations(config),
      ac.getCampaigns(config),
      ac.getTags(config),
    ])

    return NextResponse.json({
      lists,
      pipelines,
      stages,
      forms,
      automations,
      campaigns,
      tags,
    })
  } catch (error) {
    console.error('ActiveCampaign metadata error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    )
  }
}
