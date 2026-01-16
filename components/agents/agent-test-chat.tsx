'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { resolveSpintax } from '@/lib/utils/spintax'
import type { Tables } from '@/types/database'
import type { ScriptStep } from '@/types'

type Agent = Tables<'agents'>

interface Message {
  id: string
  content: string
  sender: 'user' | 'agent'
  timestamp: Date
  scriptStep?: number
}

interface AgentTestChatProps {
  agent: Agent
}

export function AgentTestChat({ agent }: AgentTestChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scriptSteps = (agent.script_steps as ScriptStep[]) || []

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    // Send initial greeting
    if (messages.length === 0 && scriptSteps.length > 0) {
      sendAgentMessage(1)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  function replaceVariables(template: string): string {
    // Erst Spintax auflösen {option1|option2|option3}
    const result = resolveSpintax(template)

    // Dann Variablen ersetzen {{variable}}
    return result
      .replace(/\{\{contact_name\}\}/g, 'Test User')
      .replace(/\{\{name\}\}/g, 'Test User')
      .replace(/\{\{booking_cta\}\}/g, agent.booking_cta || '')
      .replace(/\{\{calendly_link\}\}/g, agent.calendly_link || '[Calendly Link]')
      .replace(/\{\{colleague_name\}\}/g, agent.colleague_name || 'ein Kollege')
      .replace(/\{\{agent_name\}\}/g, agent.agent_name || agent.name)
  }

  function sendAgentMessage(step: number) {
    const scriptStep = scriptSteps.find((s) => s.step === step)
    if (!scriptStep) return

    setIsTyping(true)

    // Simulate typing delay
    const delay = Math.random() * 1000 + 500

    setTimeout(() => {
      const message: Message = {
        id: crypto.randomUUID(),
        content: replaceVariables(scriptStep.template),
        sender: 'agent',
        timestamp: new Date(),
        scriptStep: step,
      }

      setMessages((prev) => [...prev, message])
      setIsTyping(false)
    }, delay)
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    }

    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    const userInput = input
    setInput('')
    setIsTyping(true)
    setIsLoading(true)

    try {
      // Call AI API for real response
      const response = await fetch('/api/agents/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          userMessage: userInput,
          messages: currentMessages,
          currentStep,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const agentMessage: Message = {
        id: crypto.randomUUID(),
        content: replaceVariables(data.response),
        sender: 'agent',
        timestamp: new Date(),
        scriptStep: data.shouldEscalate ? undefined : currentStep,
      }

      setMessages((prev) => [...prev, agentMessage])

      if (data.shouldEscalate) {
        // Don't advance step on escalation
      } else if (data.nextStep && data.nextStep !== currentStep) {
        setCurrentStep(data.nextStep)
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      // Fallback to simple template-based response
      const nextStep = currentStep < scriptSteps.length ? currentStep + 1 : currentStep
      const scriptStep = scriptSteps.find((s) => s.step === nextStep)

      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        content: scriptStep
          ? replaceVariables(scriptStep.template)
          : 'Entschuldigung, es gab ein technisches Problem. Bitte versuche es erneut.',
        sender: 'agent',
        timestamp: new Date(),
        scriptStep: scriptStep ? nextStep : undefined,
      }
      setMessages((prev) => [...prev, fallbackMessage])
      if (scriptStep) {
        setCurrentStep(nextStep)
      }
    } finally {
      setIsTyping(false)
      setIsLoading(false)
    }
  }

  function handleReset() {
    setMessages([])
    setCurrentStep(1)
    setTimeout(() => sendAgentMessage(1), 100)
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle>Test Chat</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Schritt {currentStep} / {scriptSteps.length}
          </Badge>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
        <ScrollArea className="flex-1 p-4 h-full">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.scriptStep && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Schritt {message.scriptStep}:{' '}
                        {scriptSteps.find((s) => s.step === message.scriptStep)?.goal}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <span className="animate-pulse">Tippt...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nachricht eingeben..."
              disabled={isTyping || isLoading}
            />
            <Button type="submit" disabled={isTyping || isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
