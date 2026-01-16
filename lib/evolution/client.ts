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
      // Device name shown in WhatsApp "Linked Devices"
      browserName: 'chatsetter',
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
  const result = await evolutionFetch<{ instance?: { state: string }; state?: string }>(`/instance/connectionState/${instanceName}`)

  // Normalize response - Evolution API returns state under instance.state
  if (result.success && result.data) {
    const state = result.data.instance?.state || result.data.state
    return { success: true, data: { state } }
  }

  return result
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

// ============================================================
// MEDIA MESSAGES
// ============================================================

export async function sendMediaMessage(
  instanceName: string,
  phone: string,
  options: {
    mediatype: 'image' | 'video' | 'audio' | 'document'
    media: string // URL or base64
    caption?: string
    fileName?: string
    mimetype?: string
  }
) {
  return evolutionFetch(`/message/sendMedia/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      mediatype: options.mediatype,
      media: options.media,
      caption: options.caption,
      fileName: options.fileName,
      mimetype: options.mimetype,
    }),
  })
}

export async function sendImageMessage(
  instanceName: string,
  phone: string,
  imageUrl: string,
  caption?: string
) {
  return sendMediaMessage(instanceName, phone, {
    mediatype: 'image',
    media: imageUrl,
    caption,
  })
}

export async function sendVideoMessage(
  instanceName: string,
  phone: string,
  videoUrl: string,
  caption?: string
) {
  return sendMediaMessage(instanceName, phone, {
    mediatype: 'video',
    media: videoUrl,
    caption,
  })
}

export async function sendAudioMessage(
  instanceName: string,
  phone: string,
  audioUrl: string
) {
  return sendMediaMessage(instanceName, phone, {
    mediatype: 'audio',
    media: audioUrl,
  })
}

export async function sendDocumentMessage(
  instanceName: string,
  phone: string,
  documentUrl: string,
  fileName: string,
  caption?: string
) {
  return sendMediaMessage(instanceName, phone, {
    mediatype: 'document',
    media: documentUrl,
    fileName,
    caption,
  })
}

// ============================================================
// LOCATION & CONTACT MESSAGES
// ============================================================

export async function sendLocationMessage(
  instanceName: string,
  phone: string,
  latitude: number,
  longitude: number,
  name?: string,
  address?: string
) {
  return evolutionFetch(`/message/sendLocation/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      latitude,
      longitude,
      name,
      address,
    }),
  })
}

export async function sendContactMessage(
  instanceName: string,
  phone: string,
  contacts: Array<{
    fullName: string
    phoneNumber: string
    organization?: string
  }>
) {
  return evolutionFetch(`/message/sendContact/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      contact: contacts,
    }),
  })
}

// ============================================================
// MESSAGE REACTIONS & REPLIES
// ============================================================

export async function sendReaction(
  instanceName: string,
  messageId: string,
  phone: string,
  emoji: string
) {
  return evolutionFetch(`/message/sendReaction/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        id: messageId,
      },
      reaction: emoji,
    }),
  })
}

export async function sendTextWithQuote(
  instanceName: string,
  phone: string,
  text: string,
  quotedMessageId: string
) {
  return evolutionFetch(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      text,
      quoted: {
        key: {
          remoteJid: `${phone}@s.whatsapp.net`,
          id: quotedMessageId,
        },
      },
    }),
  })
}

// ============================================================
// GROUP MANAGEMENT
// ============================================================

export async function createGroup(
  instanceName: string,
  name: string,
  participants: string[]
) {
  return evolutionFetch(`/group/create/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      subject: name,
      participants: participants.map(p => `${p}@s.whatsapp.net`),
    }),
  })
}

export async function getGroups(instanceName: string) {
  return evolutionFetch(`/group/fetchAllGroups/${instanceName}`, {
    method: 'GET',
  })
}

export async function getGroupInfo(instanceName: string, groupId: string) {
  return evolutionFetch(`/group/findGroupInfos/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ groupJid: groupId }),
  })
}

export async function updateGroupName(
  instanceName: string,
  groupId: string,
  name: string
) {
  return evolutionFetch(`/group/updateGroupSubject/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      groupJid: groupId,
      subject: name,
    }),
  })
}

export async function updateGroupDescription(
  instanceName: string,
  groupId: string,
  description: string
) {
  return evolutionFetch(`/group/updateGroupDescription/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      groupJid: groupId,
      description,
    }),
  })
}

export async function addGroupParticipants(
  instanceName: string,
  groupId: string,
  participants: string[]
) {
  return evolutionFetch(`/group/updateParticipant/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      groupJid: groupId,
      action: 'add',
      participants: participants.map(p => `${p}@s.whatsapp.net`),
    }),
  })
}

export async function removeGroupParticipants(
  instanceName: string,
  groupId: string,
  participants: string[]
) {
  return evolutionFetch(`/group/updateParticipant/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      groupJid: groupId,
      action: 'remove',
      participants: participants.map(p => `${p}@s.whatsapp.net`),
    }),
  })
}

export async function promoteGroupParticipants(
  instanceName: string,
  groupId: string,
  participants: string[]
) {
  return evolutionFetch(`/group/updateParticipant/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      groupJid: groupId,
      action: 'promote',
      participants: participants.map(p => `${p}@s.whatsapp.net`),
    }),
  })
}

export async function demoteGroupParticipants(
  instanceName: string,
  groupId: string,
  participants: string[]
) {
  return evolutionFetch(`/group/updateParticipant/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      groupJid: groupId,
      action: 'demote',
      participants: participants.map(p => `${p}@s.whatsapp.net`),
    }),
  })
}

export async function leaveGroup(instanceName: string, groupId: string) {
  return evolutionFetch(`/group/leaveGroup/${instanceName}`, {
    method: 'DELETE',
    body: JSON.stringify({ groupJid: groupId }),
  })
}

export async function getGroupInviteCode(instanceName: string, groupId: string) {
  return evolutionFetch(`/group/inviteCode/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ groupJid: groupId }),
  })
}

export async function revokeGroupInviteCode(instanceName: string, groupId: string) {
  return evolutionFetch(`/group/revokeInviteCode/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ groupJid: groupId }),
  })
}

export async function sendGroupMessage(
  instanceName: string,
  groupId: string,
  text: string
) {
  return evolutionFetch(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: groupId,
      text,
    }),
  })
}

// ============================================================
// STATUS/STORIES
// ============================================================

export async function sendTextStatus(
  instanceName: string,
  text: string,
  backgroundColor?: string,
  font?: number
) {
  return evolutionFetch(`/message/sendStatus/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'text',
      content: text,
      backgroundColor: backgroundColor || '#00FF00',
      font: font || 1,
      allContacts: true,
    }),
  })
}

export async function sendImageStatus(
  instanceName: string,
  imageUrl: string,
  caption?: string
) {
  return evolutionFetch(`/message/sendStatus/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'image',
      content: imageUrl,
      caption,
      allContacts: true,
    }),
  })
}

export async function sendVideoStatus(
  instanceName: string,
  videoUrl: string,
  caption?: string
) {
  return evolutionFetch(`/message/sendStatus/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'video',
      content: videoUrl,
      caption,
      allContacts: true,
    }),
  })
}

export async function sendAudioStatus(instanceName: string, audioUrl: string) {
  return evolutionFetch(`/message/sendStatus/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'audio',
      content: audioUrl,
      allContacts: true,
    }),
  })
}

// ============================================================
// PROFILE & UTILITIES
// ============================================================

export async function getProfilePicture(instanceName: string, phone: string) {
  return evolutionFetch(`/chat/fetchProfilePictureUrl/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ number: phone }),
  })
}

export async function getBusinessProfile(instanceName: string, phone: string) {
  return evolutionFetch(`/chat/fetchBusinessProfile/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ number: phone }),
  })
}

export async function updateProfileName(instanceName: string, name: string) {
  return evolutionFetch(`/chat/updateProfileName/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateProfilePicture(instanceName: string, imageUrl: string) {
  return evolutionFetch(`/chat/updateProfilePicture/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ picture: imageUrl }),
  })
}

export async function updateProfileStatus(instanceName: string, status: string) {
  return evolutionFetch(`/chat/updateProfileStatus/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

// ============================================================
// CHAT MANAGEMENT
// ============================================================

export async function getChats(instanceName: string) {
  return evolutionFetch(`/chat/findChats/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function getMessages(
  instanceName: string,
  phone: string,
  limit: number = 20
) {
  return evolutionFetch(`/chat/findMessages/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      where: {
        key: {
          remoteJid: `${phone}@s.whatsapp.net`,
        },
      },
      limit,
    }),
  })
}

export async function markAsRead(instanceName: string, phone: string) {
  return evolutionFetch(`/chat/markMessageAsRead/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      readMessages: [
        {
          remoteJid: `${phone}@s.whatsapp.net`,
        },
      ],
    }),
  })
}

export async function archiveChat(instanceName: string, phone: string, archive: boolean = true) {
  return evolutionFetch(`/chat/archiveChat/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      chat: `${phone}@s.whatsapp.net`,
      archive,
    }),
  })
}

export async function deleteMessage(
  instanceName: string,
  phone: string,
  messageId: string,
  forEveryone: boolean = false
) {
  return evolutionFetch(`/chat/deleteMessageForEveryone/${instanceName}`, {
    method: 'DELETE',
    body: JSON.stringify({
      remoteJid: `${phone}@s.whatsapp.net`,
      messageId,
      fromMe: true,
      onlyForMe: !forEveryone,
    }),
  })
}

// ============================================================
// LABELS (Business Feature)
// ============================================================

export async function getLabels(instanceName: string) {
  return evolutionFetch(`/label/findLabels/${instanceName}`, {
    method: 'GET',
  })
}

export async function addLabelToChat(
  instanceName: string,
  phone: string,
  labelId: string
) {
  return evolutionFetch(`/label/handleLabel/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      chatId: `${phone}@s.whatsapp.net`,
      labelId,
      action: 'add',
    }),
  })
}

export async function removeLabelFromChat(
  instanceName: string,
  phone: string,
  labelId: string
) {
  return evolutionFetch(`/label/handleLabel/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      chatId: `${phone}@s.whatsapp.net`,
      labelId,
      action: 'remove',
    }),
  })
}

// ============================================================
// TYPING & PRESENCE
// ============================================================

export async function sendTyping(
  instanceName: string,
  phone: string,
  duration: number = 3000
) {
  return evolutionFetch(`/chat/sendPresence/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      presence: 'composing',
      delay: duration,
    }),
  })
}

export async function sendRecording(
  instanceName: string,
  phone: string,
  duration: number = 3000
) {
  return evolutionFetch(`/chat/sendPresence/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      presence: 'recording',
      delay: duration,
    }),
  })
}
