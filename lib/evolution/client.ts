const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

interface EvolutionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

async function evolutionFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EvolutionResponse<T>> {
  try {
    const url = `${EVOLUTION_URL}${endpoint}`
    console.log(`[Evolution API] ${options.method || 'GET'} ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': EVOLUTION_API_KEY!,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const responseText = await response.text()
    console.log(`[Evolution API] Response ${response.status}: ${responseText.substring(0, 500)}`)

    if (!response.ok) {
      return { success: false, error: responseText }
    }

    const data = responseText ? JSON.parse(responseText) : {}
    return { success: true, data }
  } catch (error) {
    console.error('[Evolution API] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function createInstance(instanceName: string) {
  return evolutionFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
}

export async function getQRCode(instanceName: string) {
  // Evolution API v2 returns QR code in different formats
  const result = await evolutionFetch<{
    base64?: string
    code?: string
    qrcode?: { base64?: string; code?: string }
    pairingCode?: string
  }>(`/instance/connect/${instanceName}`)

  // Normalize the response
  if (result.success && result.data) {
    const data = result.data
    const base64 = data.base64 || data.qrcode?.base64 || data.code || data.qrcode?.code
    return { success: true, data: { base64 } }
  }

  return result
}

export async function getInstanceStatus(instanceName: string) {
  return evolutionFetch<{ state: string }>(`/instance/connectionState/${instanceName}`)
}

export async function disconnectInstance(instanceName: string) {
  return evolutionFetch(`/instance/logout/${instanceName}`, {
    method: 'DELETE',
  })
}

export async function deleteInstance(instanceName: string) {
  return evolutionFetch(`/instance/delete/${instanceName}`, {
    method: 'DELETE',
  })
}

export async function sendTextMessage(
  instanceName: string,
  phone: string,
  text: string
) {
  return evolutionFetch(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      text,
    }),
  })
}

export async function getInstanceInfo(instanceName: string) {
  return evolutionFetch(`/instance/fetchInstances?instanceName=${instanceName}`)
}

export interface WhatsAppCheckResult {
  exists: boolean
  jid: string | null
  number: string
}

export async function checkWhatsAppNumbers(
  instanceName: string,
  numbers: string[]
): Promise<EvolutionResponse<WhatsAppCheckResult[]>> {
  return evolutionFetch<WhatsAppCheckResult[]>(`/chat/whatsappNumbers/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ numbers }),
  })
}
