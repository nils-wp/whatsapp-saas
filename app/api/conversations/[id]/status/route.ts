import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateCRMStatus, syncConversationToCRM } from '@/lib/integrations/crm-sync'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * PATCH /api/conversations/[id]/status
 * Updates conversation status and syncs to CRM
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase()

  try {
    const { status, note } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status ist erforderlich' },
        { status: 400 }
      )
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation nicht gefunden' },
        { status: 404 }
      )
    }

    // Update conversation in database
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Map conversation status to CRM outcome
    let crmOutcome: 'contacted' | 'booked' | 'not_interested' | 'escalated' | null = null

    switch (status) {
      case 'booked':
      case 'appointment_booked':
        crmOutcome = 'booked'
        break
      case 'not_interested':
      case 'disqualified':
        crmOutcome = 'not_interested'
        break
      case 'escalated':
        crmOutcome = 'escalated'
        break
      case 'completed':
        // Sync full conversation to CRM on completion
        syncConversationToCRM({
          tenantId: conversation.tenant_id,
          conversationId: id,
        }).catch(err => console.error('CRM sync error:', err))
        break
    }

    // Update CRM status if applicable
    if (crmOutcome) {
      await updateCRMStatus({
        tenantId: conversation.tenant_id,
        phone: conversation.contact_phone,
        outcome: crmOutcome,
        note: note || `Status geändert zu: ${status}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Status aktualisiert',
      crmSynced: !!crmOutcome,
    })

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
