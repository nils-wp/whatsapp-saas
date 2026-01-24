import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    whatsapp_account_id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
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

        const { data: configs, error } = await supabase
            .from('number_check_configs')
            .select(`
        *,
        whatsapp_account:whatsapp_accounts(id, instance_name, display_name)
      `)
            .eq('tenant_id', member.tenant_id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(configs)
    } catch (error) {
        console.error('Error fetching checks:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
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

        const json = await request.json()
        const body = createSchema.parse(json)

        // Check slug uniqueness
        const { data: existing } = await supabase
            .from('number_check_configs')
            .select('id')
            .eq('slug', body.slug)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: 'Dieser URL-Slug ist bereits vergeben' },
                { status: 400 }
            )
        }

        const { data: config, error } = await supabase
            .from('number_check_configs')
            .insert({
                tenant_id: member.tenant_id,
                name: body.name,
                slug: body.slug,
                whatsapp_account_id: body.whatsapp_account_id || null,
                allowed_origins: ['*'], // Default to all
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(config)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 })
        }
        console.error('Error creating check:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
