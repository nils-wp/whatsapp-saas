import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

export const agentSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  description: z.string().optional(),
  agent_name: z.string().min(2, 'Agent-Name muss mindestens 2 Zeichen lang sein'),
  colleague_name: z.string().optional(),
  company_info: z.string().optional(),
  calendly_link: z.string().url('Bitte gib eine gültige URL ein').optional().or(z.literal('')),
  booking_cta: z.string().optional(),
  response_delay_min: z.number().min(0).max(60),
  response_delay_max: z.number().min(0).max(120),
  max_messages_per_conversation: z.number().min(1).max(100),
  whatsapp_account_id: z.string().optional(),
})

export const triggerTypeEnum = z.enum(['webhook', 'activecampaign', 'close', 'pipedrive', 'hubspot', 'monday'])
export type TriggerType = z.infer<typeof triggerTypeEnum>

// CRM-specific trigger events
export const CRM_EVENTS: Record<TriggerType, Array<{ value: string; label: string; description: string }>> = {
  webhook: [
    { value: 'incoming', label: 'Eingehender Webhook', description: 'Beliebige Daten per HTTP POST empfangen' },
  ],
  close: [
    { value: 'lead_status_changed', label: 'Lead-Status geändert', description: 'Wenn ein Lead-Status geändert wird' },
    { value: 'opportunity_status_changed', label: 'Opportunity-Status geändert', description: 'Wenn ein Opportunity-Status geändert wird' },
    { value: 'call_completed', label: 'Anruf abgeschlossen', description: 'Nach einem abgeschlossenen Anruf' },
    { value: 'sms_received', label: 'SMS empfangen', description: 'Wenn eine SMS empfangen wird' },
    { value: 'task_completed', label: 'Aufgabe erledigt', description: 'Wenn eine Aufgabe abgeschlossen wird' },
    { value: 'lead_created', label: 'Neuer Lead', description: 'Wenn ein neuer Lead erstellt wird' },
  ],
  activecampaign: [
    { value: 'contact_tag_added', label: 'Tag hinzugefügt', description: 'Wenn einem Kontakt ein Tag hinzugefügt wird' },
    { value: 'contact_tag_removed', label: 'Tag entfernt', description: 'Wenn ein Tag entfernt wird' },
    { value: 'deal_stage_changed', label: 'Deal-Stage geändert', description: 'Wenn ein Deal in eine andere Stage wechselt' },
    { value: 'form_submitted', label: 'Formular eingereicht', description: 'Wenn ein Formular ausgefüllt wird' },
    { value: 'automation_started', label: 'Automation gestartet', description: 'Wenn eine Automation startet' },
    { value: 'contact_created', label: 'Neuer Kontakt', description: 'Wenn ein neuer Kontakt erstellt wird' },
  ],
  pipedrive: [
    { value: 'deal_stage_changed', label: 'Deal-Stage geändert', description: 'Wenn ein Deal in eine andere Stage wechselt' },
    { value: 'deal_created', label: 'Neuer Deal', description: 'Wenn ein neuer Deal erstellt wird' },
    { value: 'deal_won', label: 'Deal gewonnen', description: 'Wenn ein Deal als gewonnen markiert wird' },
    { value: 'deal_lost', label: 'Deal verloren', description: 'Wenn ein Deal als verloren markiert wird' },
    { value: 'activity_completed', label: 'Aktivität abgeschlossen', description: 'Wenn eine Aktivität erledigt wird' },
    { value: 'person_created', label: 'Neue Person', description: 'Wenn eine neue Person erstellt wird' },
  ],
  hubspot: [
    { value: 'contact_property_changed', label: 'Kontakt-Eigenschaft geändert', description: 'Wenn eine Kontakt-Eigenschaft geändert wird' },
    { value: 'deal_stage_changed', label: 'Deal-Stage geändert', description: 'Wenn ein Deal in eine andere Stage wechselt' },
    { value: 'deal_created', label: 'Neuer Deal', description: 'Wenn ein neuer Deal erstellt wird' },
    { value: 'form_submitted', label: 'Formular eingereicht', description: 'Wenn ein Formular ausgefüllt wird' },
    { value: 'meeting_booked', label: 'Meeting gebucht', description: 'Wenn ein Meeting gebucht wird' },
    { value: 'contact_created', label: 'Neuer Kontakt', description: 'Wenn ein neuer Kontakt erstellt wird' },
  ],
  monday: [
    { value: 'item_status_changed', label: 'Item-Status geändert', description: 'Wenn der Status eines Items geändert wird' },
    { value: 'item_moved_to_group', label: 'Item in Gruppe verschoben', description: 'Wenn ein Item in eine andere Gruppe verschoben wird' },
    { value: 'column_value_changed', label: 'Spaltenwert geändert', description: 'Wenn ein Spaltenwert geändert wird' },
    { value: 'item_created', label: 'Neues Item', description: 'Wenn ein neues Item erstellt wird' },
    { value: 'subitem_created', label: 'Neues Subitem', description: 'Wenn ein neues Subitem erstellt wird' },
  ],
}

export const triggerSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  type: triggerTypeEnum,
  trigger_event: z.string().optional(),
  whatsapp_account_id: z.string().uuid('Bitte wähle einen WhatsApp-Account'),
  agent_id: z.string().uuid('Bitte wähle einen Agent'),
  first_message: z.string().min(10, 'Erste Nachricht muss mindestens 10 Zeichen lang sein'),
  first_message_delay_seconds: z.number().min(0).max(300),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type AgentFormData = z.infer<typeof agentSchema>
export type TriggerFormData = z.infer<typeof triggerSchema>
