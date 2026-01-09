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

export const triggerSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  type: z.enum(['webhook', 'activecampaign', 'close']),
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
