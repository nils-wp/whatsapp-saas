import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Delete orphaned conversations (where whatsapp_account_id is NULL)
 */
export async function POST() {
  try {
    const supabase = getSupabase()

    // Find orphaned conversations
    const { data: orphaned, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .is('whatsapp_account_id', null)

    if (findError) {
      console.error('Failed to find orphaned conversations:', findError)
      return NextResponse.json({ error: 'Failed to find orphaned conversations' }, { status: 500 })
    }

    if (!orphaned || orphaned.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: 'No orphaned conversations found' })
    }

    const conversationIds = orphaned.map(c => c.id)

    // Delete messages first
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds)

    if (messagesError) {
      console.error('Failed to delete messages:', messagesError)
      return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 })
    }

    // Delete conversations
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .is('whatsapp_account_id', null)

    if (conversationsError) {
      console.error('Failed to delete conversations:', conversationsError)
      return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: conversationIds.length,
      message: `Deleted ${conversationIds.length} orphaned conversations`
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
