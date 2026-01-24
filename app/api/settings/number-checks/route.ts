import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    whatsapp_account_id: z.string().uuid().optional(),
})

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin client to bypass RLS recursion issues during tenant lookup
// Check if service role key exists
const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

// Admin client to bypass RLS (only if key is available)
const supabaseAdmin = hasServiceRole
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    : null

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let member
        let memberError

        if (supabaseAdmin) {
            const result = await supabaseAdmin
                .from('tenant_members')
                .select('tenant_id')
                .eq('user_id', user.id)
                .maybeSingle()
            member = result.data
            memberError = result.error
        } else {
            console.log('[API] Service Role Key missing in GET, using User Client')
            const result = await supabase
                .from('tenant_members')
                .select('tenant_id')
                .eq('user_id', user.id)
                .maybeSingle()
            member = result.data
            memberError = result.error
        }

        if (memberError) {
            console.error('[API] Error fetching tenant member:', memberError)
            return NextResponse.json({ error: 'Database error fetching tenant' }, { status: 500 })
        }

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
    console.log('[API] Check Number Config POST started')
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.log('[API] Unauthorized')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const client = supabaseAdmin || supabase
        const isServiceRole = !!supabaseAdmin
        console.log(`[API] Using ${isServiceRole ? 'Service Role' : 'User'} Client`)

        // 1. Get Tenant Member
        console.log('[API] Fetching tenant member...')
        const { data: member, error: memberError } = await client
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError) {
            const errorMsg = `Database error fetching tenant. ServiceRole: ${!!supabaseAdmin}. Details: ${memberError.message}`
            console.error('[API]', errorMsg)
            return NextResponse.json({ error: 'Database error', details: errorMsg }, { status: 500 })
        }

        if (!member) {
            const errorMsg = `No tenant member found for user: ${user.id}. ServiceRole: ${!!supabaseAdmin}`
            console.error('[API]', errorMsg)
            return NextResponse.json({ error: 'No tenant found', details: errorMsg }, { status: 404 })
        }
        console.log('[API] Tenant found:', member.tenant_id)

        // 2. Parse Body
        const json = await request.json()
        const body = createSchema.parse(json)
        console.log('[API] Body parsed:', body)

        // 3. Check Slug Uniqueness
        console.log('[API] Checking slug uniqueness...')
        const { data: existing, error: slugError } = await client
            .from('number_check_configs')
            .select('id')
            .eq('slug', body.slug)
            .maybeSingle()

        if (slugError) {
            console.error('[API] Error checking slug:', slugError)
            return NextResponse.json({ error: 'Database error checking slug', details: slugError.message }, { status: 500 })
        }

        if (existing) {
            console.log('[API] Slug already exists')
            return NextResponse.json(
                { error: 'Dieser URL-Slug ist bereits vergeben' },
                { status: 400 }
            )
        }

        // 4. Insert Config
        console.log('[API] Inserting config...')
        const { data: config, error: insertError } = await client
            .from('number_check_configs')
            .insert({
                tenant_id: member.tenant_id,
                name: body.name,
                slug: body.slug,
                whatsapp_account_id: body.whatsapp_account_id || null,
                allowed_origins: ['*'],
            })
            .select()
            .single()

        if (insertError) {
            console.error('[API] Error inserting config:', insertError)
            return NextResponse.json({ error: 'Database error inserting config', details: insertError.message }, { status: 500 })
        }

        console.log('[API] Success!')
        return NextResponse.json(config)

    } catch (error) {
        console.error('[API] Uncaught error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
