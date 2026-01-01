export * from './database'

export type ScriptStep = {
  step: number
  name: string
  goal: string
  template: string
}

export type FAQEntry = {
  id: string
  question: string
  answer: string
  category?: string
}

export type ConversationStatus = 'active' | 'paused' | 'escalated' | 'completed' | 'disqualified'
export type MessageDirection = 'inbound' | 'outbound'
export type SenderType = 'contact' | 'agent' | 'human'
export type QueueType = 'outside_hours' | 'human_review'
export type AccountStatus = 'qr_pending' | 'connected' | 'disconnected'
export type TriggerType = 'webhook' | 'activecampaign' | 'close'

export type PlanLimits = {
  whatsapp_accounts: number
  monthly_messages: number
  agents: number
  team_members: number
}
