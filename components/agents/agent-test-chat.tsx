'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const scriptSteps = (agent.script_steps as ScriptStep[]) || []

  useEffect(() => {
    // Send initial greeting
    if (messages.length === 0 && scriptSteps.length > 0) {
      sendAgentMessage(1)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function replaceVariables(template: string): string {
    return template
      .replace(/\{\{contact_name\}\}/g, 'Test User')
      .replace(/\{\{booking_cta\}\}/g, agent.booking_cta)
      .replace(/\{\{calendly_link\}\}/g, agent.calendly_link || '[Calendly Link]')
      .replace(/\{\{colleague_name\}\}/g, agent.colleague_name || 'ein Kollege')
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

  function handleSend() {
    if (!input.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    // Check for escalation topics
    const isEscalation = agent.escalation_topics.some((topic) =>
      input.toLowerCase().includes(topic.toLowerCase())
    )

    if (isEscalation) {
      setIsTyping(true)
      setTimeout(() => {
        const escalationMessage: Message = {
          id: crypto.randomUUID(),
          content: replaceVariables(agent.escalation_message),
          sender: 'agent',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, escalationMessage])
        setIsTyping(false)
      }, 1000)
      return
    }

    // Move to next step
    if (currentStep < scriptSteps.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      sendAgentMessage(nextStep)
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
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
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
              disabled={isTyping}
            />
            <Button type="submit" disabled={isTyping || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
