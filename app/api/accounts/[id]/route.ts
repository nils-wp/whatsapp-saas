import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteInstance, disconnectInstance } from '@/lib/evolution/client'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

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

    // Delete from database
    const { error: deleteError } = await supabase
      .from('whatsapp_accounts')
      .delete()
      .eq('id', id)

    if (deleteError) {
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
