/**
 * Azure OpenAI Client
 * DSGVO-konform - alle Daten bleiben in der EU
 */

interface AzureOpenAIConfig {
  endpoint: string
  apiKey: string
  deploymentName: string
  apiVersion: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  content: string
  finishReason: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// Default config from environment
function getConfig(): AzureOpenAIConfig {
  return {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  }
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    config?: Partial<AzureOpenAIConfig>
  }
): Promise<ChatCompletionResponse> {
  const config = { ...getConfig(), ...options?.config }

  const url = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${config.apiVersion}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Azure OpenAI Error:', error)
    throw new Error(`Azure OpenAI request failed: ${response.status}`)
  }

  const data = await response.json()

  return {
    content: data.choices[0]?.message?.content || '',
    finishReason: data.choices[0]?.finish_reason || 'unknown',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getConfig()
  const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002'

  const url = `${config.endpoint}/openai/deployments/${embeddingDeployment}/embeddings?api-version=${config.apiVersion}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey,
    },
    body: JSON.stringify({
      input: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Azure OpenAI embedding failed: ${response.status}`)
  }

  const data = await response.json()
  return data.data[0]?.embedding || []
}
