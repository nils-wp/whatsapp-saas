/**
 * AI Agent Tools
 * Function calling tools for the AI agent (n8n-style)
 */

import { createClient } from '@supabase/supabase-js'
import type { FunctionTool } from './azure-openai'
import { getTenantIntegrations } from '@/lib/integrations/crm-sync'
import * as close from '@/lib/integrations/close'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ===========================================
// Tool Definitions
// ===========================================

export const AGENT_TOOLS: FunctionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_sms_logs',
      description: 'Retrieve previous SMS/WhatsApp conversation history from CRM to understand context and past interactions with this contact. Use this to check what was discussed before.',
      parameters: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'The phone number to get conversation logs for',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of messages to retrieve (default: 20)',
          },
        },
        required: ['phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_faq_document',
      description: 'Read the FAQ knowledge base document to find answers to common questions. Use this when the customer asks something that might be in the FAQ.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_faq',
      description: 'Add a new question and answer pair to the FAQ document. Use this when you learn something new that should be remembered for future conversations.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The question to add',
          },
          answer: {
            type: 'string',
            description: 'The answer to add',
          },
        },
        required: ['question', 'answer'],
      },
    },
  },
]

// ===========================================
// Tool Execution
// ===========================================

export interface ToolExecutionContext {
  tenantId: string
  agentId: string
  phone: string
}

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  try {
    switch (toolName) {
      case 'get_sms_logs':
        return await getSmsLogs(
          context.tenantId,
          (args.phone as string) || context.phone,
          (args.limit as number) || 20
        )

      case 'get_faq_document':
        return await getFaqDocument(context.agentId)

      case 'update_faq':
        return await updateFaqDocument(
          context.agentId,
          args.question as string,
          args.answer as string
        )

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` })
    }
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error)
    return JSON.stringify({
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
}

// ===========================================
// Tool Implementations
// ===========================================

/**
 * Get SMS/WhatsApp logs from CRM for conversation context
 */
async function getSmsLogs(
  tenantId: string,
  phone: string,
  limit: number = 20
): Promise<string> {
  const integrations = await getTenantIntegrations(tenantId)
  if (!integrations) {
    return JSON.stringify({ logs: [], count: 0, message: 'No CRM integrations configured' })
  }

  const logs: Array<{
    date: string
    direction: string
    text: string
    source: string
  }> = []

  // Try Close CRM first
  if (integrations.close_enabled && integrations.close_api_key) {
    const config = { apiKey: integrations.close_api_key }
    const lead = await close.findLeadByPhone(config, phone)

    if (lead) {
      const smsActivities = await close.getSmsActivities(config, lead.id, limit)

      for (const sms of smsActivities) {
        logs.push({
          date: sms.createdAt,
          direction: sms.direction === 'inbound' ? 'Kunde' : 'Agent',
          text: sms.text,
          source: 'Close CRM',
        })
      }
    }
  }

  // Also get from local database
  const supabase = getSupabase()
  const { data: messages } = await supabase
    .from('messages')
    .select('content, direction, created_at, sender_type')
    .eq('tenant_id', tenantId)
    .or(`conversation_id.in.(select id from conversations where contact_phone.eq.${phone})`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (messages) {
    for (const msg of messages) {
      // Avoid duplicates
      const exists = logs.some(
        l => l.text === msg.content && Math.abs(new Date(l.date).getTime() - new Date(msg.created_at).getTime()) < 60000
      )
      if (!exists) {
        logs.push({
          date: msg.created_at,
          direction: msg.direction === 'inbound' ? 'Kunde' : 'Agent',
          text: msg.content,
          source: 'WhatsApp',
        })
      }
    }
  }

  // Sort by date descending
  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Format for AI consumption
  const formatted = logs.slice(0, limit).map(l => {
    const date = new Date(l.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
    return `[${date}] ${l.direction}: ${l.text}`
  }).join('\n')

  return JSON.stringify({
    count: logs.length,
    logs: formatted || 'Keine vorherigen Nachrichten gefunden.',
  })
}

/**
 * Get FAQ document from agent configuration
 */
async function getFaqDocument(agentId: string): Promise<string> {
  const supabase = getSupabase()

  const { data: agent, error } = await supabase
    .from('agents')
    .select('faq_entries, faq, name')
    .eq('id', agentId)
    .single()

  if (error || !agent) {
    return JSON.stringify({ error: 'Agent not found' })
  }

  const faqEntries = (agent.faq_entries || agent.faq || []) as Array<{ question: string; answer: string }>

  if (faqEntries.length === 0) {
    return JSON.stringify({
      content: 'Keine FAQ-Einträge vorhanden.',
      count: 0,
    })
  }

  // Format for AI consumption
  const formatted = faqEntries.map((entry, i) =>
    `${i + 1}. Frage: ${entry.question}\n   Antwort: ${entry.answer}`
  ).join('\n\n')

  return JSON.stringify({
    content: formatted,
    count: faqEntries.length,
    agentName: agent.name,
  })
}

/**
 * Update FAQ document with new Q&A pair
 */
async function updateFaqDocument(
  agentId: string,
  question: string,
  answer: string
): Promise<string> {
  const supabase = getSupabase()

  // Get current FAQ
  const { data: agent, error: fetchError } = await supabase
    .from('agents')
    .select('faq_entries, faq')
    .eq('id', agentId)
    .single()

  if (fetchError || !agent) {
    return JSON.stringify({ success: false, error: 'Agent not found' })
  }

  const currentFaq = (agent.faq_entries || agent.faq || []) as Array<{ question: string; answer: string }>

  // Check for duplicate questions
  const exists = currentFaq.some(
    entry => entry.question.toLowerCase().trim() === question.toLowerCase().trim()
  )

  if (exists) {
    return JSON.stringify({
      success: false,
      error: 'Diese Frage existiert bereits in der FAQ.',
    })
  }

  // Add new entry
  const updatedFaq = [...currentFaq, { question, answer }]

  // Update database
  const { error: updateError } = await supabase
    .from('agents')
    .update({ faq_entries: updatedFaq })
    .eq('id', agentId)

  if (updateError) {
    console.error('FAQ update error:', updateError)
    return JSON.stringify({ success: false, error: 'Failed to update FAQ' })
  }

  return JSON.stringify({
    success: true,
    message: `FAQ wurde um die Frage "${question}" erweitert.`,
    totalEntries: updatedFaq.length,
  })
}

// ===========================================
// Helper to get tools for an agent
// ===========================================

/**
 * Get the tools available for an agent based on tenant configuration
 */
export async function getToolsForAgent(
  tenantId: string,
  _agentId: string
): Promise<FunctionTool[]> {
  const integrations = await getTenantIntegrations(tenantId)

  // Base tools always available
  const tools: FunctionTool[] = [
    AGENT_TOOLS.find(t => t.function.name === 'get_faq_document')!,
    AGENT_TOOLS.find(t => t.function.name === 'update_faq')!,
  ]

  // Add SMS logs tool if any CRM is enabled
  if (
    integrations?.close_enabled ||
    integrations?.hubspot_enabled ||
    integrations?.pipedrive_enabled
  ) {
    tools.unshift(AGENT_TOOLS.find(t => t.function.name === 'get_sms_logs')!)
  }

  return tools
}
