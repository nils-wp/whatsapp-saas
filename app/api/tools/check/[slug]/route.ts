import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkWhatsAppNumbers } from '@/lib/evolution/client'
import { formatPhoneNumber } from '@/lib/utils/phone'

// Create admin client lazily to avoid build-time env access
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * OPTIONS Handler for CORS preflight
 */
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

/**
 * POST /api/tools/check/[slug]
 * Public endpoint to check if a number exists on WhatsApp
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    try {
        const { slug } = await params
        const body = await request.json()
        const { phone } = body

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400, headers })
        }

        // 1. Find config by slug
        const supabaseAdmin = getSupabaseAdmin()
        const { data: config } = await supabaseAdmin
            .from('number_check_configs')
            .select('*, whatsapp_accounts(instance_name, status)')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (!config) {
            return NextResponse.json({ error: 'Configuration not found or inactive' }, { status: 404, headers })
        }

        // 2. Resolve WhatsApp Account to use
        let instanceName = config.whatsapp_accounts?.instance_name

        // If no specific account linked, find first connected one for tenant
        if (!instanceName) {
            const { data: accounts } = await supabaseAdmin
                .from('whatsapp_accounts')
                .select('instance_name')
                .eq('tenant_id', config.tenant_id)
                .eq('status', 'connected')
                .limit(1)

            if (accounts && accounts.length > 0) {
                instanceName = accounts[0].instance_name
            }
        }

        if (!instanceName) {
            return NextResponse.json(
                { error: 'No connected WhatsApp account available for validation' },
                { status: 503, headers }
            )
        }

        // 3. Clean phone number
        const cleanPhone = phone.replace(/\D/g, '')

        if (cleanPhone.length < 5) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400, headers }
            )
        }

        // 4. Validate via Evolution API
        const checkResult = await checkWhatsAppNumbers(instanceName, [cleanPhone])

        if (!checkResult.success) {
            console.error('Evolution API check failed:', checkResult.error)
            return NextResponse.json(
                { error: 'Validation service unavailable' },
                { status: 503, headers }
            )
        }

        const numberCheck = checkResult.data?.[0]
        const exists = numberCheck?.exists ?? false

        // 5. Response
        return NextResponse.json({
            exists,
            formatted: formatPhoneNumber(cleanPhone),
            jid: exists ? numberCheck?.jid : null,
        }, { headers })

    } catch (error) {
        console.error('Public number check error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers }
        )
    }
}
