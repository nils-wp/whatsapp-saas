/**
 * AI Agent Processor
 * Verarbeitet eingehende Nachrichten und generiert Antworten
 */

import { chatCompletion } from './azure-openai'
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

interface ProcessingResult {
  response: string
  shouldEscalate: boolean
  escalationReason?: string
  nextScriptStep?: number
  metadata?: Record<string, unknown>
}

/**
 * Hauptfunktion: Verarbeitet eine eingehende Nachricht
 */
export async function processIncomingMessage(
  incomingMessage: string,
  conversation: Conversation,
  agent: Agent,
  messageHistory: Message[]
): Promise<ProcessingResult> {
  // 1. Prüfe auf Eskalations-Keywords
  const escalationTopics = agent.escalation_topics || agent.escalation_keywords || []
  const escalationCheck = checkEscalationKeywords(incomingMessage, escalationTopics)
  if (escalationCheck.shouldEscalate) {
    return {
      response: getEscalationResponse(agent),
      shouldEscalate: true,
      escalationReason: escalationCheck.reason,
    }
  }

  // 2. Hole aktuellen Script-Step
  const scriptSteps = (agent.script_steps || []) as unknown as ScriptStep[]
  const currentStep = scriptSteps.find(s => s.step === conversation.current_script_step)

  // 3. Baue den System-Prompt
  const systemPrompt = buildSystemPrompt(agent, currentStep)

  // 4. Baue die Chat-History
  const chatMessages = buildChatHistory(messageHistory, systemPrompt)

  // 5. Füge die neue Nachricht hinzu
  chatMessages.push({ role: 'user', content: incomingMessage })

  // 6. Generiere AI Antwort
  const aiResponse = await chatCompletion(chatMessages, {
    temperature: 0.7,
    maxTokens: 500,
  })

  // 7. Prüfe Guardrails
  const guardedResponse = applyGuardrails(aiResponse.content, agent)

  // 8. Bestimme nächsten Script-Step
  const nextStep = determineNextStep(incomingMessage, currentStep, scriptSteps)

  return {
    response: guardedResponse,
    shouldEscalate: false,
    nextScriptStep: nextStep,
    metadata: {
      tokensUsed: aiResponse.usage.totalTokens,
      scriptStep: conversation.current_script_step,
    },
  }
}

/**
 * Baut den System-Prompt basierend auf Agent-Konfiguration
 */
function buildSystemPrompt(agent: Agent, currentStep?: ScriptStep): string {
  const faqEntries = agent.faq_entries || agent.faq || []
  const faqSection = buildFAQSection(faqEntries)

  const personality = agent.personality || 'Freundlich und professionell'
  const goal = agent.goal || agent.company_info || 'Hilf dem Kunden und beantworte seine Fragen'

  let prompt = `Du bist ${agent.agent_name || agent.name}, ein KI-Assistent für WhatsApp.

PERSÖNLICHKEIT:
${personality}

ZIEL:
${goal}

WICHTIGE REGELN:
- Antworte immer auf Deutsch
- Halte dich kurz und prägnant (WhatsApp-Style)
- Sei freundlich aber professionell
- Verwende keine Emojis außer wenn es passt
- Wenn du etwas nicht weißt, sag es ehrlich
- Versuche das Gespräch zum Ziel zu führen`

  if (currentStep) {
    prompt += `

AKTUELLER GESPRÄCHSSCHRITT (${currentStep.step}):
Ziel: ${currentStep.goal}
${currentStep.message_template ? `Vorlage: ${currentStep.message_template}` : ''}`
  }

  if (faqSection) {
    prompt += `

HÄUFIGE FRAGEN (FAQ):
${faqSection}`
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
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
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
function checkEscalationKeywords(
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
function getEscalationResponse(agent: Agent): string {
  return `Ich verstehe, dass du mit einem Mitarbeiter sprechen möchtest. Ich leite das Gespräch weiter und jemand wird sich so schnell wie möglich bei dir melden. Vielen Dank für deine Geduld!`
}

/**
 * Wendet Guardrails auf die AI-Antwort an
 */
function applyGuardrails(response: string, agent: Agent): string {
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
    // Ersetze Variablen in der Vorlage
    let message = firstStep.message_template

    // Erst Spintax auflösen {option1|option2|option3}
    message = resolveSpintax(message)

    // Dann Variablen ersetzen {{variable}}
    message = message.replace(/\{\{name\}\}/g, contactName || 'du')
    message = message.replace(/\{\{contact_name\}\}/g, contactName || 'du')
    message = message.replace(/\{\{agent_name\}\}/g, agent.agent_name || agent.name)
    message = message.replace(/\{\{colleague_name\}\}/g, agent.colleague_name || 'ein Kollege')
    message = message.replace(/\{\{booking_cta\}\}/g, agent.booking_cta || '')
    message = message.replace(/\{\{calendly_link\}\}/g, agent.calendly_link || '')

    // Custom trigger data
    if (triggerData) {
      for (const [key, value] of Object.entries(triggerData)) {
        message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
      }
    }

    return message
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
