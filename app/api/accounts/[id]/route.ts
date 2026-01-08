import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { deleteInstance, disconnectInstance } from '@/lib/evolution/client'

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    // Get account info first
    const { data: account, error: fetchError } = await supabase
      .from('whatsapp_accounts')
      .select('instance_name')
      .eq('id', id)
      .single()

    if (fetchError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Delete from Evolution API first
    try {
      await disconnectInstance(account.instance_name)
      await deleteInstance(account.instance_name)
      console.log(`[Delete Account] Deleted Evolution instance: ${account.instance_name}`)
    } catch (evoError) {
      console.error('[Delete Account] Evolution API error:', evoError)
      // Continue anyway - instance might not exist in Evolution
    }

    // Remove references from conversations (set whatsapp_account_id to NULL)
    await serviceSupabase
      .from('conversations')
      .update({ whatsapp_account_id: null })
      .eq('whatsapp_account_id', id)

    // Remove references from triggers
    await serviceSupabase
      .from('triggers')
      .update({ whatsapp_account_id: null })
      .eq('whatsapp_account_id', id)

    // Remove references from analytics_daily
    await serviceSupabase
      .from('analytics_daily')
      .update({ whatsapp_account_id: null })
      .eq('whatsapp_account_id', id)

    // Delete from database using service role (bypasses RLS)
    const { error: deleteError } = await serviceSupabase
      .from('whatsapp_accounts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[Delete Account] Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Delete Account] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
