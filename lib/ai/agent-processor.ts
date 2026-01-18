/**
 * AI Agent Processor
 * Verarbeitet eingehende Nachrichten und generiert Antworten
 * Mit Function Calling Support (n8n-style)
 */

import { chatCompletion, chatCompletionWithTools, type ChatMessage } from './azure-openai'
import { executeTool, getToolsForAgent, type ToolExecutionContext } from './agent-tools'
import { resolveSpintax } from '@/lib/utils/spintax'
import type { Tables } from '@/types/database'

type Agent = Tables<'agents'> & {
  escalation_topics?: string[]
  escalation_keywords?: string[]
  faq_entries?: Array<{ question: string; answer: string }>
  faq?: Array<{ question: string; answer: string }>
  personality?: string
  goal?: string
  company_info?: string
  office_hours?: Record<string, unknown>
  outside_hours_message?: string
  escalation_message?: string
  colleague_name?: string
  booking_cta?: string
  calendly_link?: string
}
type Conversation = Tables<'conversations'>
type Message = Tables<'messages'>

interface ScriptStep {
  step: number
  goal: string
  message_template: string
  wait_for_response: boolean
  conditions?: {
    keywords?: string[]
    next_step_on_match?: number
  }
}

export interface ProcessingResult {
  response: string
  shouldEscalate: boolean
  escalationReason?: string
  nextScriptStep?: number
  metadata?: Record<string, unknown>
}

interface ProcessingOptions {
  tenantId: string
  useTools?: boolean
  /** Variables available for substitution in responses */
  variables?: ConversationVariables
}

/** Variables extracted from conversation and trigger data */
export interface ConversationVariables {
  name?: string
  contact_name?: string
  first_name?: string
  last_name?: string
  vorname?: string      // German alias for first_name
  nachname?: string     // German alias for last_name
  contact_phone?: string
  agent_name?: string
  booking_cta?: string
  calendly_link?: string
  /** Custom variables from trigger data */
  [key: string]: string | undefined
}

/**
 * Splits a full name into first and last name
 */
export function splitName(fullName?: string): { firstName?: string; lastName?: string } {
  if (!fullName) return {}

  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }

  // First part is first name, rest is last name
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')

  return { firstName, lastName }
}

const MAX_TOOL_ITERATIONS = 5

/**
 * Ersetzt Variablen in einem Text
 * Unterstützt {{variable}} Format
 */
export function substituteVariables(text: string, variables: ConversationVariables): string {
  let result = text

  // Erst Spintax auflösen
  result = resolveSpintax(result)

  // Name Variablen (mit Fallbacks)
  const firstName = variables.first_name || variables.vorname
  const lastName = variables.last_name || variables.nachname
  const fullName = variables.name || variables.contact_name ||
                   (firstName && lastName ? `${firstName} ${lastName}` : firstName)

  // Vollständiger Name
  result = result.replace(/\{\{name\}\}/gi, fullName || 'du')
  result = result.replace(/\{\{contact_name\}\}/gi, fullName || 'du')

  // Vor- und Nachname
  result = result.replace(/\{\{first_name\}\}/gi, firstName || fullName || 'du')
  result = result.replace(/\{\{vorname\}\}/gi, firstName || fullName || 'du')
  result = result.replace(/\{\{last_name\}\}/gi, lastName || '')
  result = result.replace(/\{\{nachname\}\}/gi, lastName || '')

  // Andere Standard-Variablen
  result = result.replace(/\{\{contact_phone\}\}/gi, variables.contact_phone || '')
  result = result.replace(/\{\{agent_name\}\}/gi, variables.agent_name || '')
  result = result.replace(/\{\{booking_cta\}\}/gi, variables.booking_cta || '')
  result = result.replace(/\{\{calendly_link\}\}/gi, variables.calendly_link || '')

  // Alle anderen Variablen aus dem variables Objekt
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), String(value))
    }
  }

  // Nicht ersetzte Variablen entfernen
  result = result.replace(/\{\{[^}]+\}\}/g, '')

  return result.trim()
}

/**
 * Hauptfunktion: Verarbeitet eine eingehende Nachricht
 */
export async function processIncomingMessage(
  incomingMessage: string,
  conversation: Conversation,
  agent: Agent,
  messageHistory: Message[],
  options?: ProcessingOptions
): Promise<ProcessingResult> {
  const tenantId = options?.tenantId || conversation.tenant_id
  const useTools = options?.useTools !== false

  // Build variables for this conversation
  const { firstName, lastName } = splitName(conversation.contact_name || undefined)
  const variables: ConversationVariables = {
    name: conversation.contact_name || undefined,
    contact_name: conversation.contact_name || undefined,
    first_name: firstName,
    last_name: lastName,
    vorname: firstName,
    nachname: lastName,
    contact_phone: conversation.contact_phone,
    agent_name: agent.agent_name || agent.name,
    booking_cta: agent.booking_cta || undefined,
    calendly_link: agent.calendly_link || undefined,
    // Merge any custom variables from options
    ...options?.variables,
  }

  // 1. Prüfe auf Eskalations-Keywords
  const escalationTopics = agent.escalation_topics || agent.escalation_keywords || []
  const escalationCheck = checkEscalationKeywords(incomingMessage, escalationTopics)
  if (escalationCheck.shouldEscalate) {
    // Apply variable substitution to escalation response
    const escalationResponse = substituteVariables(getEscalationResponse(agent), variables)
    return {
      response: escalationResponse,
      shouldEscalate: true,
      escalationReason: escalationCheck.reason,
    }
  }

  // 2. Hole aktuellen Script-Step
  const scriptSteps = (agent.script_steps || []) as unknown as ScriptStep[]
  const currentStep = scriptSteps.find(s => s.step === conversation.current_script_step)

  // 3. Baue den System-Prompt (mit Variablen für Kontext)
  const systemPrompt = buildSystemPrompt(agent, currentStep, useTools, variables)

  // 4. Baue die Chat-History
  const chatMessages = buildChatHistory(messageHistory, systemPrompt)

  // 5. Füge die neue Nachricht hinzu
  chatMessages.push({ role: 'user', content: incomingMessage })

  // 6. Generiere AI Antwort (mit oder ohne Tools)
  let aiResponse: string
  let totalTokensUsed = 0
  let toolsUsed: string[] = []

  if (useTools) {
    const tools = await getToolsForAgent(tenantId, agent.id)
    const toolContext: ToolExecutionContext = {
      tenantId,
      agentId: agent.id,
      phone: conversation.contact_phone,
    }

    const result = await processWithTools(chatMessages, tools, toolContext)
    aiResponse = result.response
    totalTokensUsed = result.totalTokens
    toolsUsed = result.toolsUsed
  } else {
    const result = await chatCompletion(chatMessages, {
      temperature: 0.7,
      maxTokens: 500,
    })
    aiResponse = result.content
    totalTokensUsed = result.usage.totalTokens
  }

  // 7. Prüfe Guardrails
  const guardedResponse = applyGuardrails(aiResponse, agent)

  // 8. Wende Variable-Substitution an (falls {{variablen}} in der Antwort)
  const finalResponse = substituteVariables(guardedResponse, variables)

  // 9. Bestimme nächsten Script-Step
  const nextStep = determineNextStep(incomingMessage, currentStep, scriptSteps)

  return {
    response: finalResponse,
    shouldEscalate: false,
    nextScriptStep: nextStep,
    metadata: {
      tokensUsed: totalTokensUsed,
      scriptStep: conversation.current_script_step,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    },
  }
}

/**
 * Verarbeitet mit Tool-Calling Loop
 */
async function processWithTools(
  messages: ChatMessage[],
  tools: Awaited<ReturnType<typeof getToolsForAgent>>,
  context: ToolExecutionContext
): Promise<{ response: string; totalTokens: number; toolsUsed: string[] }> {
  let currentMessages = [...messages]
  let totalTokens = 0
  const toolsUsed: string[] = []
  let iterations = 0

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++

    const response = await chatCompletionWithTools(currentMessages, tools, {
      temperature: 0.7,
      maxTokens: 500,
    })

    totalTokens += response.usage.totalTokens

    // Check if the model wants to call tools
    if (response.toolCalls && response.toolCalls.length > 0) {
      // Add assistant message with tool calls
      currentMessages.push({
        role: 'assistant',
        content: response.content,
        tool_calls: response.toolCalls,
      })

      // Execute each tool and add results
      for (const toolCall of response.toolCalls) {
        const toolName = toolCall.function.name
        toolsUsed.push(toolName)

        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(toolCall.function.arguments)
        } catch {
          console.error('Failed to parse tool arguments:', toolCall.function.arguments)
        }

        const result = await executeTool(toolName, args, context)

        // Add tool result message
        currentMessages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        })
      }

      // Continue loop to get final response
      continue
    }

    // No more tool calls - return the final response
    if (response.content) {
      return { response: response.content, totalTokens, toolsUsed }
    }

    // Fallback if no content
    break
  }

  // If we hit max iterations or got no response
  return {
    response: 'Entschuldigung, ich konnte deine Anfrage nicht vollständig bearbeiten. Bitte versuche es noch einmal.',
    totalTokens,
    toolsUsed,
  }
}

/**
 * Baut den System-Prompt basierend auf Agent-Konfiguration
 */
function buildSystemPrompt(
  agent: Agent,
  currentStep?: ScriptStep,
  useTools: boolean = false,
  variables?: ConversationVariables
): string {
  const personality = agent.personality || 'Freundlich und professionell'
  const goal = agent.goal || agent.company_info || 'Hilf dem Kunden und beantworte seine Fragen'
  const contactName = variables?.name || variables?.contact_name

  let prompt = `Du bist ${agent.agent_name || agent.name}, ein KI-Assistent für WhatsApp.

PERSÖNLICHKEIT:
${personality}

ZIEL:
${goal}
${contactName ? `\nAKTUELLER KONTAKT:\nName: ${contactName}` : ''}

WICHTIGE REGELN:
- Antworte immer auf Deutsch
- Halte dich kurz und prägnant (WhatsApp-Style)
- Sei freundlich aber professionell
- Verwende keine Emojis außer wenn es passt
- Wenn du etwas nicht weißt, sag es ehrlich
- Versuche das Gespräch zum Ziel zu führen${contactName ? `\n- Sprich den Kontakt wenn passend mit seinem Namen "${contactName}" an` : ''}`

  if (currentStep) {
    prompt += `

AKTUELLER GESPRÄCHSSCHRITT (${currentStep.step}):
Ziel: ${currentStep.goal}
${currentStep.message_template ? `Vorlage: ${currentStep.message_template}` : ''}`
  }

  // Only include inline FAQ if not using tools (tools will fetch FAQ dynamically)
  if (!useTools) {
    const faqEntries = agent.faq_entries || agent.faq || []
    const faqSection = buildFAQSection(faqEntries)
    if (faqSection) {
      prompt += `

HÄUFIGE FRAGEN (FAQ):
${faqSection}`
    }
  } else {
    prompt += `

TOOLS:
Du hast Zugriff auf Tools, um Informationen abzurufen:
- get_sms_logs: Hole vorherige Nachrichten mit diesem Kontakt aus dem CRM
- get_faq_document: Lese die FAQ-Wissensdatenbank
- update_faq: Füge neue Fragen/Antworten zur FAQ hinzu wenn du etwas Neues lernst

Nutze diese Tools wenn nötig, um bessere Antworten zu geben.`
  }

  prompt += `

WICHTIG: Antworte NUR mit der Nachricht, die du senden würdest. Keine Erklärungen, keine Metakommentare.`

  return prompt
}

/**
 * Baut die FAQ-Sektion für den Prompt
 */
function buildFAQSection(faq: Array<{ question: string; answer: string }>): string {
  if (!faq || faq.length === 0) return ''

  return faq
    .map(item => `F: ${item.question}\nA: ${item.answer}`)
    .join('\n\n')
}

/**
 * Baut die Chat-History für den API Call
 */
function buildChatHistory(
  messages: Message[],
  systemPrompt: string
): ChatMessage[] {
  const history: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Letzte 10 Nachrichten für Kontext
  const recentMessages = messages.slice(-10)

  for (const msg of recentMessages) {
    if (msg.direction === 'inbound') {
      history.push({ role: 'user', content: msg.content })
    } else {
      history.push({ role: 'assistant', content: msg.content })
    }
  }

  return history
}

/**
 * Prüft auf Eskalations-Keywords
 */
export function checkEscalationKeywords(
  message: string,
  keywords: string[]
): { shouldEscalate: boolean; reason?: string } {
  const lowerMessage = message.toLowerCase()

  // Standard-Eskalations-Keywords
  const defaultKeywords = ['mensch', 'mitarbeiter', 'chef', 'manager', 'beschwerde', 'anwalt', 'rechtsanwalt']
  const allKeywords = [...new Set([...keywords, ...defaultKeywords])]

  for (const keyword of allKeywords) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return {
        shouldEscalate: true,
        reason: `Keyword erkannt: "${keyword}"`,
      }
    }
  }

  return { shouldEscalate: false }
}

/**
 * Generiert eine Eskalations-Antwort
 */
export function getEscalationResponse(agent: Agent): string {
  if (agent.escalation_message) {
    return agent.escalation_message
  }
  return `Ich verstehe, dass du mit einem Mitarbeiter sprechen möchtest. Ich leite das Gespräch weiter und jemand wird sich so schnell wie möglich bei dir melden. Vielen Dank für deine Geduld!`
}

/**
 * Wendet Guardrails auf die AI-Antwort an
 */
function applyGuardrails(response: string, _agent: Agent): string {
  let filtered = response

  // Entferne potentiell problematische Inhalte
  const blockedPatterns = [
    /\b(passwort|password|kennwort)\b/gi,
    /\b(kreditkarte|credit\s*card)\b/gi,
    /\b(sozialversicherung|ssn)\b/gi,
  ]

  for (const pattern of blockedPatterns) {
    if (pattern.test(filtered)) {
      return 'Entschuldigung, ich kann bei dieser Anfrage leider nicht helfen. Bitte wende dich direkt an unser Team.'
    }
  }

  // Kürze zu lange Antworten
  if (filtered.length > 1000) {
    filtered = filtered.substring(0, 1000) + '...'
  }

  // Entferne AI-typische Präfixe
  filtered = filtered.replace(/^(Hier ist meine Antwort:|Natürlich!|Gerne!)\s*/i, '')

  return filtered.trim()
}

/**
 * Bestimmt den nächsten Script-Step
 */
function determineNextStep(
  message: string,
  currentStep: ScriptStep | undefined,
  allSteps: ScriptStep[]
): number {
  if (!currentStep) return 1

  // Prüfe Conditions
  if (currentStep.conditions?.keywords) {
    const lowerMessage = message.toLowerCase()
    for (const keyword of currentStep.conditions.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return currentStep.conditions.next_step_on_match || currentStep.step + 1
      }
    }
  }

  // Standard: Nächster Step
  const nextStepNumber = currentStep.step + 1
  const nextStepExists = allSteps.some(s => s.step === nextStepNumber)

  return nextStepExists ? nextStepNumber : currentStep.step
}

/**
 * Generiert die erste Nachricht für eine neue Conversation
 */
export async function generateFirstMessage(
  agent: Agent,
  contactName?: string,
  triggerData?: Record<string, unknown>
): Promise<string> {
  const scriptSteps = (agent.script_steps || []) as unknown as ScriptStep[]
  const firstStep = scriptSteps.find(s => s.step === 1)

  if (firstStep?.message_template) {
    // Build variables from agent and trigger data
    const { firstName, lastName } = splitName(contactName)
    const variables: ConversationVariables = {
      name: contactName,
      contact_name: contactName,
      first_name: firstName,
      last_name: lastName,
      vorname: firstName,
      nachname: lastName,
      agent_name: agent.agent_name || agent.name,
      booking_cta: agent.booking_cta || undefined,
      calendly_link: agent.calendly_link || undefined,
    }

    // Add trigger data as custom variables (may include first_name, last_name from CRM)
    if (triggerData) {
      for (const [key, value] of Object.entries(triggerData)) {
        if (value !== undefined && value !== null) {
          variables[key] = String(value)
        }
      }
    }

    // Use the centralized substituteVariables function
    return substituteVariables(firstStep.message_template, variables)
  }

  // Fallback: Generiere mit AI
  const agentGoal = agent.goal || agent.company_info || 'Kunden helfen'
  const agentPersonality = agent.personality || 'freundlich und professionell'

  const prompt = `Du bist ${agent.agent_name || agent.name}. Schreibe eine kurze, freundliche erste Nachricht an ${contactName || 'einen neuen Kontakt'}.
Ziel: ${agentGoal}
Persönlichkeit: ${agentPersonality}

Antworte NUR mit der Nachricht, nichts anderes.`

  const response = await chatCompletion([
    { role: 'system', content: prompt },
  ], { temperature: 0.8, maxTokens: 200 })

  return response.content
}

/**
 * Generiert einen Antwortvorschlag für Eskalations-Queue
 */
export async function generateSuggestedResponse(
  originalMessage: string,
  agent: Agent,
  messageHistory: Message[]
): Promise<string> {
  const faqEntries = agent.faq_entries || agent.faq || []
  const faqSection = buildFAQSection(faqEntries)

  const conversationContext = messageHistory
    .slice(-5)
    .map(m => `${m.direction === 'inbound' ? 'Kunde' : 'Agent'}: ${m.content}`)
    .join('\n')

  const prompt = `Du bist ein Assistent, der einem menschlichen Mitarbeiter hilft, auf eine eskalierte Kundenanfrage zu antworten.

KONTEXT:
${conversationContext}

NEUE NACHRICHT VOM KUNDEN:
${originalMessage}

${faqSection ? `FAQ-WISSEN:\n${faqSection}\n\n` : ''}

Schreibe einen professionellen, hilfreichen Antwortvorschlag, den der Mitarbeiter als Basis nutzen kann.
Die Antwort sollte empathisch sein und das Anliegen des Kunden ernst nehmen.
Halte sie kurz (WhatsApp-Style) aber vollständig.

NUR die Antwortnachricht ausgeben, keine Erklärungen.`

  const response = await chatCompletion([
    { role: 'system', content: prompt },
  ], { temperature: 0.7, maxTokens: 300 })

  return response.content
}
