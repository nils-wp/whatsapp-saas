import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chatCompletion } from '@/lib/ai/azure-openai'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface TestMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ScriptStep {
  step: number
  goal: string
  template: string
  message_template?: string
}

interface FAQEntry {
  question: string
  answer: string
}

/**
 * POST /api/agents/test-chat
 * Generate AI response for test chat
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agentId, userMessage, messages, currentStep } = body

    if (!agentId || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Fetch agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check for escalation keywords
    const escalationTopics = (agent as any).escalation_topics || []
    const defaultKeywords = ['mensch', 'mitarbeiter', 'chef', 'manager', 'beschwerde', 'anwalt']
    const allKeywords = [...new Set([...escalationTopics, ...defaultKeywords])]

    const lowerMessage = userMessage.toLowerCase()
    for (const keyword of allKeywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return NextResponse.json({
          response: agent.escalation_message || 'Ich verstehe, dass du mit einem Mitarbeiter sprechen möchtest. Ich leite das Gespräch weiter.',
          shouldEscalate: true,
          escalationReason: `Keyword: ${keyword}`,
        })
      }
    }

    // Build system prompt
    const scriptSteps = (agent.script_steps || []) as ScriptStep[]
    const currentScriptStep = scriptSteps.find(s => s.step === currentStep)
    const faqEntries = ((agent as any).faq_entries || []) as FAQEntry[]

    const personality = (agent as any).personality || 'Freundlich und professionell'
    const goal = (agent as any).goal || (agent as any).company_info || 'Hilf dem Kunden und beantworte seine Fragen'

    let systemPrompt = `Du bist ${agent.agent_name || agent.name}, ein KI-Assistent für WhatsApp.

PERSÖNLICHKEIT:
${personality}

ÜBERGEORDNETES ZIEL:
${goal}

WICHTIGE REGELN:
- Antworte immer auf Deutsch
- Halte dich kurz und prägnant (WhatsApp-Style)
- Sei freundlich aber professionell
- Verwende keine Emojis außer wenn es passt
- Wenn du etwas nicht weißt, sag es ehrlich
- WICHTIG: Gehe IMMER auf das ein, was der Kunde schreibt! Beantworte seine Fragen direkt.
- Versuche das Gespräch zum Ziel zu führen, aber reagiere natürlich auf Kundenfragen
- Du bist ein echter Gesprächspartner, kein Skript-Bot`

    if (currentScriptStep) {
      systemPrompt += `

AKTUELLER GESPRÄCHSSCHRITT (${currentScriptStep.step}):
Ziel dieses Schritts: ${currentScriptStep.goal}
${currentScriptStep.template || currentScriptStep.message_template ? `Vorlage zur Orientierung: ${currentScriptStep.template || currentScriptStep.message_template}` : ''}

WICHTIG: Die Vorlage ist nur eine ORIENTIERUNG. Passe deine Antwort an das an, was der Kunde sagt!`
    }

    if (faqEntries.length > 0) {
      const faqSection = faqEntries
        .map(item => `F: ${item.question}\nA: ${item.answer}`)
        .join('\n\n')

      systemPrompt += `

HÄUFIGE FRAGEN (FAQ) - Nutze diese Informationen um Kundenfragen zu beantworten:
${faqSection}`
    }

    systemPrompt += `

WICHTIG: Antworte NUR mit der Nachricht, die du senden würdest. Keine Erklärungen, keine Metakommentare.`

    // Build chat messages
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ]

    // Add message history
    if (messages && Array.isArray(messages)) {
      for (const msg of messages.slice(-10)) {
        chatMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      }
    }

    // Add current message
    chatMessages.push({ role: 'user', content: userMessage })

    // Generate AI response
    const aiResponse = await chatCompletion(chatMessages, {
      temperature: 0.7,
      maxTokens: 500,
    })

    // Apply basic guardrails
    let response = aiResponse.content

    // Remove AI-typical prefixes
    response = response.replace(/^(Hier ist meine Antwort:|Natürlich!|Gerne!|Klar!)\s*/i, '')

    // Trim and limit length
    response = response.trim()
    if (response.length > 1000) {
      response = response.substring(0, 1000) + '...'
    }

    // Determine next step
    let nextStep = currentStep
    if (currentScriptStep && currentStep < scriptSteps.length) {
      nextStep = currentStep + 1
    }

    return NextResponse.json({
      response,
      shouldEscalate: false,
      nextStep,
    })

  } catch (error) {
    console.error('Test chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
