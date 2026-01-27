import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { substituteVariables, splitName, generateFirstMessage } from '@/lib/ai/agent-processor'
import { sendTextMessage } from '@/lib/evolution/client'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const { id } = await params
        const { test_phone, trigger_data } = await req.json()

        if (!test_phone) {
            return NextResponse.json({ error: 'Test phone number is required' }, { status: 400 })
        }

        // 1. Fetch trigger and agent
        const { data: trigger, error: triggerError } = await supabase
            .from('triggers')
            .select('*, agents(*), whatsapp_accounts(instance_name)')
            .eq('id', id)
            .single()

        if (triggerError || !trigger) {
            return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
        }

        const agent = trigger.agents
        const instanceName = trigger.whatsapp_accounts?.instance_name

        if (!instanceName) {
            return NextResponse.json({ error: 'No WhatsApp account linked to trigger' }, { status: 400 })
        }

        // 2. Generate the message
        let finalMessage: string
        const contactName = (trigger_data?.contact_name || trigger_data?.name || 'Test User') as string
        const { firstName, lastName } = splitName(contactName)

        if (agent) {
            // Use the logic that handles script steps/AI generation if template exists
            finalMessage = await generateFirstMessage(
                agent,
                contactName,
                trigger_data
            )
        } else {
            // Static substitution for simple triggers
            const variables = {
                name: contactName,
                contact_name: contactName,
                first_name: firstName,
                last_name: lastName,
                vorname: firstName,
                nachname: lastName,
                ...(trigger_data ? Object.fromEntries(
                    Object.entries(trigger_data)
                        .filter(([, v]) => v !== undefined && v !== null)
                        .map(([k, v]) => [k, String(v)])
                ) : {}),
            }
            finalMessage = substituteVariables(trigger.first_message, variables)
        }

        // 3. Send via Evolution API (handling sequences)
        const externalConfig = (trigger.external_config as Record<string, unknown>) || {}
        const firstMessageType = externalConfig.first_message_type || 'single'
        const sequenceDelaySeconds = Number(externalConfig.sequence_delay) || 2

        const messageParts = firstMessageType === 'sequence'
            ? finalMessage.split(/\n\s*---+\s*\n/).filter(p => p.trim() !== '')
            : [finalMessage]

        // 4. Find existing active conversation or create new one
        // Search for existing active conversation for this phone/tenant
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('*')
            .eq('tenant_id', trigger.tenant_id)
            .eq('contact_phone', test_phone)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        let conversation
        if (existingConv) {
            // Update existing conversation
            const { data: updated, error: updateError } = await supabase
                .from('conversations')
                .update({
                    contact_name: `Test: ${contactName}`,
                    last_message_at: new Date().toISOString(),
                    trigger_id: trigger.id,
                    trigger_data: trigger_data,
                    agent_id: trigger.agent_id || null,
                })
                .eq('id', existingConv.id)
                .select()
                .single()

            if (updateError) {
                console.error('Failed to update test conversation:', updateError)
                return NextResponse.json({ error: 'Failed to update test conversation' }, { status: 500 })
            }
            conversation = updated
        } else {
            // Create new conversation
            const { data: inserted, error: insertError } = await supabase
                .from('conversations')
                .insert({
                    tenant_id: trigger.tenant_id,
                    whatsapp_account_id: trigger.whatsapp_account_id,
                    contact_phone: test_phone,
                    contact_name: `Test: ${contactName}`,
                    status: 'active',
                    agent_id: trigger.agent_id || null,
                    trigger_id: trigger.id,
                    trigger_data: trigger_data,
                    last_message_at: new Date().toISOString(),
                    current_script_step: 1,
                })
                .select()
                .single()

            if (insertError) {
                console.error('Failed to create test conversation:', insertError)
                return NextResponse.json({ error: 'Failed to create test conversation' }, { status: 500 })
            }
            conversation = inserted
        }

        let firstMessageId: string | null = null

        // 5. Send each part
        for (let i = 0; i < messageParts.length; i++) {
            const partContent = messageParts[i].trim()
            if (!partContent) continue

            // Delay between messages in sequence
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, sequenceDelaySeconds * 1000))
            }

            const sendResult = await sendTextMessage(instanceName, test_phone, partContent)

            if (sendResult.success) {
                // Log each message part to the database
                const { data: msg } = await supabase
                    .from('messages')
                    .insert({
                        tenant_id: trigger.tenant_id,
                        conversation_id: conversation.id,
                        direction: 'outbound',
                        sender_type: agent ? 'agent' : 'human',
                        content: partContent,
                        status: 'sent',
                        whatsapp_message_id: (sendResult.data as any)?.key?.id,
                    })
                    .select()
                    .single()

                if (i === 0) firstMessageId = (sendResult.data as any)?.key?.id
            } else {
                return NextResponse.json({ error: `Failed to send part ${i + 1}: ${sendResult.error}` }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            message: finalMessage,
            whatsapp_message_id: firstMessageId
        })

    } catch (error) {
        console.error('Error sending test message:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
