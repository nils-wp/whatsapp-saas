import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfilePicture } from '@/lib/evolution/client'

/**
 * POST /api/conversations/sync-profiles
 * Synchronisiert Profilbilder für alle Konversationen ohne Bild
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user's tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    // Get all conversations without profile picture
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        id,
        contact_phone,
        whatsapp_account_id,
        whatsapp_accounts!inner(instance_name)
      `)
      .eq('tenant_id', member.tenant_id)
      .is('profile_picture_url', null)

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    let updated = 0
    let failed = 0

    for (const conv of conversations) {
      try {
        const account = conv.whatsapp_accounts as unknown as { instance_name: string }
        if (!account?.instance_name || !conv.contact_phone) continue

        const result = await getProfilePicture(account.instance_name, conv.contact_phone)

        if (result.success && result.data) {
          const pictureUrl = (result.data as { profilePictureUrl?: string })?.profilePictureUrl ||
                             (result.data as { url?: string })?.url ||
                             (result.data as { picture?: string })?.picture

          if (pictureUrl) {
            await supabase
              .from('conversations')
              .update({ profile_picture_url: pictureUrl })
              .eq('id', conv.id)

            updated++
          }
        }
      } catch (error) {
        console.error(`Failed to fetch profile for conversation ${conv.id}:`, error)
        failed++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      total: conversations.length,
      updated,
      failed,
    })
  } catch (error) {
    console.error('Sync profiles error:', error)
    return NextResponse.json(
      { error: 'Failed to sync profiles' },
      { status: 500 }
    )
  }
}
