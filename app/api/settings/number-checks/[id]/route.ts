import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { id } = await params

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

        const { error } = await supabase
            .from('number_check_configs')
            .delete()
            .eq('id', id)
            .eq('tenant_id', member.tenant_id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting check:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
