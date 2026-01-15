# Azure OpenAI Expert

You are an expert in Azure OpenAI for AI-powered conversations.

## Azure OpenAI Configuration

This project uses Azure OpenAI (EU region) for GDPR compliance.

### Environment Variables
```
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o  # or gpt-4o-mini
```

### Client Location

`lib/ai/azure-openai.ts`

```typescript
import { AzureOpenAI } from 'openai'

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-08-01-preview'
})
```

## Chat Completions API

### Basic Usage
```typescript
const response = await client.chat.completions.create({
  model: deployment,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  temperature: 0.7,
  max_tokens: 500
})

const reply = response.choices[0].message.content
```

### System Prompt Structure (Agent)

```typescript
const systemPrompt = `
Du bist ${agentName}, ein KI-Assistent für ${companyName}.

PERSÖNLICHKEIT:
${personality}

ZIEL:
${goal}

AKTUELLER SCHRITT:
${currentScriptStep.goal}
${currentScriptStep.message_template}

FAQ:
${faq.map(f => `F: ${f.question}\nA: ${f.answer}`).join('\n')}

REGELN:
- Antworte nur auf Deutsch
- Halte Antworten kurz (max 2-3 Sätze)
- Bei Eskalations-Keywords → Human Handoff
- Versuche das Ziel zu erreichen
`
```

### Message History Context

```typescript
// Load last 10 messages for context
const messages = await getConversationHistory(conversationId, 10)

const chatMessages = [
  { role: 'system', content: systemPrompt },
  ...messages.map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.content
  })),
  { role: 'user', content: newMessage }
]
```

## Agent Processing Flow

Location: `lib/ai/agent-processor.ts`

```
1. Load agent config (personality, goal, script_steps, faq)
2. Build system prompt with current script step
3. Load message history (last 10)
4. Call Azure OpenAI chat completion
5. Apply guardrails (blocked patterns, length)
6. Check for escalation keywords
7. Determine script step progression
8. Return response
```

## Best Practices

### Temperature Settings
- `0.3` - Factual, consistent responses
- `0.7` - Balanced creativity (default)
- `0.9` - More varied, creative responses

### Token Limits
- Input: Consider context window (128k for GPT-4o)
- Output: `max_tokens: 500` for short responses
- Message history: Limit to 10-20 messages

### Error Handling
```typescript
try {
  const response = await client.chat.completions.create(...)
  return response.choices[0].message.content
} catch (error) {
  console.error('Azure OpenAI error:', error)
  // Fallback to template response
  return agent.script_steps[currentStep]?.message_template ||
         'Entschuldigung, es gab ein Problem. Bitte versuchen Sie es später erneut.'
}
```

## Common Tasks

### Adjust agent behavior
1. Modify `personality` in agent config
2. Update system prompt in `agent-processor.ts`
3. Test with `/api/agents/test-chat`

### Add structured output
```typescript
const response = await client.chat.completions.create({
  model: deployment,
  messages: [...],
  response_format: { type: 'json_object' }
})
```

### Implement function calling
```typescript
const tools = [{
  type: 'function',
  function: {
    name: 'book_appointment',
    description: 'Book an appointment for the customer',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        time: { type: 'string' }
      }
    }
  }
}]
```
