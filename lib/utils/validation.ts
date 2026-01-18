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

// CRM-specific trigger events - ALL available triggers per CRM
export const CRM_EVENTS: Record<TriggerType, Array<{ value: string; label: string; description: string; category?: string }>> = {
  webhook: [
    { value: 'incoming', label: 'Eingehender Webhook', description: 'Beliebige Daten per HTTP POST empfangen' },
  ],
  close: [
    // Leads
    { value: 'lead_created', label: 'Lead erstellt', description: 'Wenn ein neuer Lead erstellt wird', category: 'Leads' },
    { value: 'lead_updated', label: 'Lead aktualisiert', description: 'Wenn ein Lead aktualisiert wird', category: 'Leads' },
    { value: 'lead_deleted', label: 'Lead gelöscht', description: 'Wenn ein Lead gelöscht wird', category: 'Leads' },
    { value: 'lead_status_changed', label: 'Lead-Status geändert', description: 'Wenn der Lead-Status geändert wird', category: 'Leads' },
    { value: 'lead_merged', label: 'Lead zusammengeführt', description: 'Wenn Leads zusammengeführt werden', category: 'Leads' },
    // Contacts
    { value: 'contact_created', label: 'Kontakt erstellt', description: 'Wenn ein neuer Kontakt erstellt wird', category: 'Kontakte' },
    { value: 'contact_updated', label: 'Kontakt aktualisiert', description: 'Wenn ein Kontakt aktualisiert wird', category: 'Kontakte' },
    { value: 'contact_deleted', label: 'Kontakt gelöscht', description: 'Wenn ein Kontakt gelöscht wird', category: 'Kontakte' },
    // Opportunities
    { value: 'opportunity_created', label: 'Opportunity erstellt', description: 'Wenn eine neue Opportunity erstellt wird', category: 'Opportunities' },
    { value: 'opportunity_updated', label: 'Opportunity aktualisiert', description: 'Wenn eine Opportunity aktualisiert wird', category: 'Opportunities' },
    { value: 'opportunity_deleted', label: 'Opportunity gelöscht', description: 'Wenn eine Opportunity gelöscht wird', category: 'Opportunities' },
    { value: 'opportunity_status_changed', label: 'Opportunity-Status geändert', description: 'Wenn der Opportunity-Status geändert wird', category: 'Opportunities' },
    { value: 'opportunity_won', label: 'Opportunity gewonnen', description: 'Wenn eine Opportunity gewonnen wird', category: 'Opportunities' },
    { value: 'opportunity_lost', label: 'Opportunity verloren', description: 'Wenn eine Opportunity verloren wird', category: 'Opportunities' },
    // Activities
    { value: 'call_completed', label: 'Anruf abgeschlossen', description: 'Nach einem abgeschlossenen Anruf', category: 'Aktivitäten' },
    { value: 'call_created', label: 'Anruf erstellt', description: 'Wenn ein Anruf protokolliert wird', category: 'Aktivitäten' },
    { value: 'sms_sent', label: 'SMS gesendet', description: 'Wenn eine SMS gesendet wird', category: 'Aktivitäten' },
    { value: 'sms_received', label: 'SMS empfangen', description: 'Wenn eine SMS empfangen wird', category: 'Aktivitäten' },
    { value: 'email_opened', label: 'E-Mail geöffnet', description: 'Wenn eine E-Mail geöffnet wird', category: 'Aktivitäten' },
    { value: 'email_clicked', label: 'E-Mail-Link geklickt', description: 'Wenn ein Link in einer E-Mail geklickt wird', category: 'Aktivitäten' },
    { value: 'email_replied', label: 'E-Mail beantwortet', description: 'Wenn auf eine E-Mail geantwortet wird', category: 'Aktivitäten' },
    { value: 'email_sent', label: 'E-Mail gesendet', description: 'Wenn eine E-Mail gesendet wird', category: 'Aktivitäten' },
    { value: 'meeting_scheduled', label: 'Meeting geplant', description: 'Wenn ein Meeting geplant wird', category: 'Aktivitäten' },
    { value: 'meeting_completed', label: 'Meeting abgeschlossen', description: 'Wenn ein Meeting stattgefunden hat', category: 'Aktivitäten' },
    { value: 'note_created', label: 'Notiz erstellt', description: 'Wenn eine Notiz erstellt wird', category: 'Aktivitäten' },
    // Tasks
    { value: 'task_created', label: 'Aufgabe erstellt', description: 'Wenn eine Aufgabe erstellt wird', category: 'Aufgaben' },
    { value: 'task_completed', label: 'Aufgabe erledigt', description: 'Wenn eine Aufgabe abgeschlossen wird', category: 'Aufgaben' },
    { value: 'task_deleted', label: 'Aufgabe gelöscht', description: 'Wenn eine Aufgabe gelöscht wird', category: 'Aufgaben' },
    // Custom
    { value: 'custom_activity_created', label: 'Custom Activity erstellt', description: 'Wenn eine benutzerdefinierte Aktivität erstellt wird', category: 'Custom' },
  ],
  activecampaign: [
    // Contacts
    { value: 'contact_created', label: 'Kontakt erstellt', description: 'Wenn ein neuer Kontakt erstellt wird', category: 'Kontakte' },
    { value: 'contact_updated', label: 'Kontakt aktualisiert', description: 'Wenn ein Kontakt aktualisiert wird', category: 'Kontakte' },
    { value: 'contact_tag_added', label: 'Tag hinzugefügt', description: 'Wenn einem Kontakt ein Tag hinzugefügt wird', category: 'Kontakte' },
    { value: 'contact_tag_removed', label: 'Tag entfernt', description: 'Wenn ein Tag von einem Kontakt entfernt wird', category: 'Kontakte' },
    { value: 'contact_subscribed', label: 'Kontakt angemeldet', description: 'Wenn sich ein Kontakt für eine Liste anmeldet', category: 'Kontakte' },
    { value: 'contact_unsubscribed', label: 'Kontakt abgemeldet', description: 'Wenn sich ein Kontakt abmeldet', category: 'Kontakte' },
    { value: 'contact_bounced', label: 'E-Mail bounced', description: 'Wenn eine E-Mail nicht zugestellt werden kann', category: 'Kontakte' },
    // Deals
    { value: 'deal_created', label: 'Deal erstellt', description: 'Wenn ein neuer Deal erstellt wird', category: 'Deals' },
    { value: 'deal_updated', label: 'Deal aktualisiert', description: 'Wenn ein Deal aktualisiert wird', category: 'Deals' },
    { value: 'deal_stage_changed', label: 'Deal-Stage geändert', description: 'Wenn ein Deal in eine andere Stage wechselt', category: 'Deals' },
    { value: 'deal_won', label: 'Deal gewonnen', description: 'Wenn ein Deal als gewonnen markiert wird', category: 'Deals' },
    { value: 'deal_lost', label: 'Deal verloren', description: 'Wenn ein Deal als verloren markiert wird', category: 'Deals' },
    { value: 'deal_task_completed', label: 'Deal-Aufgabe erledigt', description: 'Wenn eine Deal-Aufgabe abgeschlossen wird', category: 'Deals' },
    { value: 'deal_note_added', label: 'Deal-Notiz hinzugefügt', description: 'Wenn eine Notiz zu einem Deal hinzugefügt wird', category: 'Deals' },
    // Forms & Campaigns
    { value: 'form_submitted', label: 'Formular eingereicht', description: 'Wenn ein Formular ausgefüllt wird', category: 'Formulare' },
    { value: 'campaign_opened', label: 'Kampagne geöffnet', description: 'Wenn eine Kampagnen-E-Mail geöffnet wird', category: 'Kampagnen' },
    { value: 'campaign_clicked', label: 'Kampagnen-Link geklickt', description: 'Wenn ein Link in einer Kampagne geklickt wird', category: 'Kampagnen' },
    { value: 'campaign_replied', label: 'Auf Kampagne geantwortet', description: 'Wenn auf eine Kampagnen-E-Mail geantwortet wird', category: 'Kampagnen' },
    { value: 'campaign_bounced', label: 'Kampagne bounced', description: 'Wenn eine Kampagnen-E-Mail bounced', category: 'Kampagnen' },
    // Automations
    { value: 'automation_started', label: 'Automation gestartet', description: 'Wenn ein Kontakt eine Automation startet', category: 'Automations' },
    { value: 'automation_ended', label: 'Automation beendet', description: 'Wenn ein Kontakt eine Automation beendet', category: 'Automations' },
    { value: 'goal_reached', label: 'Ziel erreicht', description: 'Wenn ein Automation-Ziel erreicht wird', category: 'Automations' },
    // SMS
    { value: 'sms_sent', label: 'SMS gesendet', description: 'Wenn eine SMS gesendet wird', category: 'SMS' },
    { value: 'sms_received', label: 'SMS empfangen', description: 'Wenn eine SMS empfangen wird', category: 'SMS' },
    { value: 'sms_replied', label: 'SMS beantwortet', description: 'Wenn auf eine SMS geantwortet wird', category: 'SMS' },
  ],
  pipedrive: [
    // Deals
    { value: 'deal_created', label: 'Deal erstellt', description: 'Wenn ein neuer Deal erstellt wird', category: 'Deals' },
    { value: 'deal_updated', label: 'Deal aktualisiert', description: 'Wenn ein Deal aktualisiert wird', category: 'Deals' },
    { value: 'deal_deleted', label: 'Deal gelöscht', description: 'Wenn ein Deal gelöscht wird', category: 'Deals' },
    { value: 'deal_stage_changed', label: 'Deal-Stage geändert', description: 'Wenn ein Deal in eine andere Stage wechselt', category: 'Deals' },
    { value: 'deal_won', label: 'Deal gewonnen', description: 'Wenn ein Deal als gewonnen markiert wird', category: 'Deals' },
    { value: 'deal_lost', label: 'Deal verloren', description: 'Wenn ein Deal als verloren markiert wird', category: 'Deals' },
    { value: 'deal_merged', label: 'Deal zusammengeführt', description: 'Wenn Deals zusammengeführt werden', category: 'Deals' },
    // Persons
    { value: 'person_created', label: 'Person erstellt', description: 'Wenn eine neue Person erstellt wird', category: 'Personen' },
    { value: 'person_updated', label: 'Person aktualisiert', description: 'Wenn eine Person aktualisiert wird', category: 'Personen' },
    { value: 'person_deleted', label: 'Person gelöscht', description: 'Wenn eine Person gelöscht wird', category: 'Personen' },
    { value: 'person_merged', label: 'Person zusammengeführt', description: 'Wenn Personen zusammengeführt werden', category: 'Personen' },
    // Organizations
    { value: 'organization_created', label: 'Organisation erstellt', description: 'Wenn eine neue Organisation erstellt wird', category: 'Organisationen' },
    { value: 'organization_updated', label: 'Organisation aktualisiert', description: 'Wenn eine Organisation aktualisiert wird', category: 'Organisationen' },
    { value: 'organization_deleted', label: 'Organisation gelöscht', description: 'Wenn eine Organisation gelöscht wird', category: 'Organisationen' },
    { value: 'organization_merged', label: 'Organisation zusammengeführt', description: 'Wenn Organisationen zusammengeführt werden', category: 'Organisationen' },
    // Activities
    { value: 'activity_created', label: 'Aktivität erstellt', description: 'Wenn eine neue Aktivität erstellt wird', category: 'Aktivitäten' },
    { value: 'activity_updated', label: 'Aktivität aktualisiert', description: 'Wenn eine Aktivität aktualisiert wird', category: 'Aktivitäten' },
    { value: 'activity_deleted', label: 'Aktivität gelöscht', description: 'Wenn eine Aktivität gelöscht wird', category: 'Aktivitäten' },
    { value: 'activity_completed', label: 'Aktivität abgeschlossen', description: 'Wenn eine Aktivität als erledigt markiert wird', category: 'Aktivitäten' },
    // Notes
    { value: 'note_created', label: 'Notiz erstellt', description: 'Wenn eine neue Notiz erstellt wird', category: 'Notizen' },
    { value: 'note_updated', label: 'Notiz aktualisiert', description: 'Wenn eine Notiz aktualisiert wird', category: 'Notizen' },
    { value: 'note_deleted', label: 'Notiz gelöscht', description: 'Wenn eine Notiz gelöscht wird', category: 'Notizen' },
    // Products
    { value: 'product_created', label: 'Produkt erstellt', description: 'Wenn ein neues Produkt erstellt wird', category: 'Produkte' },
    { value: 'product_updated', label: 'Produkt aktualisiert', description: 'Wenn ein Produkt aktualisiert wird', category: 'Produkte' },
    { value: 'product_deleted', label: 'Produkt gelöscht', description: 'Wenn ein Produkt gelöscht wird', category: 'Produkte' },
    // Pipelines
    { value: 'pipeline_created', label: 'Pipeline erstellt', description: 'Wenn eine neue Pipeline erstellt wird', category: 'Pipelines' },
    { value: 'pipeline_updated', label: 'Pipeline aktualisiert', description: 'Wenn eine Pipeline aktualisiert wird', category: 'Pipelines' },
    { value: 'pipeline_deleted', label: 'Pipeline gelöscht', description: 'Wenn eine Pipeline gelöscht wird', category: 'Pipelines' },
    { value: 'stage_created', label: 'Stage erstellt', description: 'Wenn eine neue Stage erstellt wird', category: 'Pipelines' },
    { value: 'stage_updated', label: 'Stage aktualisiert', description: 'Wenn eine Stage aktualisiert wird', category: 'Pipelines' },
    { value: 'stage_deleted', label: 'Stage gelöscht', description: 'Wenn eine Stage gelöscht wird', category: 'Pipelines' },
  ],
  hubspot: [
    // Contacts
    { value: 'contact_created', label: 'Kontakt erstellt', description: 'Wenn ein neuer Kontakt erstellt wird', category: 'Kontakte' },
    { value: 'contact_updated', label: 'Kontakt aktualisiert', description: 'Wenn ein Kontakt aktualisiert wird', category: 'Kontakte' },
    { value: 'contact_deleted', label: 'Kontakt gelöscht', description: 'Wenn ein Kontakt gelöscht wird', category: 'Kontakte' },
    { value: 'contact_property_changed', label: 'Kontakt-Eigenschaft geändert', description: 'Wenn eine bestimmte Kontakt-Eigenschaft geändert wird', category: 'Kontakte' },
    { value: 'contact_merged', label: 'Kontakt zusammengeführt', description: 'Wenn Kontakte zusammengeführt werden', category: 'Kontakte' },
    { value: 'contact_associated', label: 'Kontakt verknüpft', description: 'Wenn ein Kontakt mit einem anderen Objekt verknüpft wird', category: 'Kontakte' },
    // Companies
    { value: 'company_created', label: 'Unternehmen erstellt', description: 'Wenn ein neues Unternehmen erstellt wird', category: 'Unternehmen' },
    { value: 'company_updated', label: 'Unternehmen aktualisiert', description: 'Wenn ein Unternehmen aktualisiert wird', category: 'Unternehmen' },
    { value: 'company_deleted', label: 'Unternehmen gelöscht', description: 'Wenn ein Unternehmen gelöscht wird', category: 'Unternehmen' },
    { value: 'company_property_changed', label: 'Unternehmens-Eigenschaft geändert', description: 'Wenn eine Unternehmens-Eigenschaft geändert wird', category: 'Unternehmen' },
    // Deals
    { value: 'deal_created', label: 'Deal erstellt', description: 'Wenn ein neuer Deal erstellt wird', category: 'Deals' },
    { value: 'deal_updated', label: 'Deal aktualisiert', description: 'Wenn ein Deal aktualisiert wird', category: 'Deals' },
    { value: 'deal_deleted', label: 'Deal gelöscht', description: 'Wenn ein Deal gelöscht wird', category: 'Deals' },
    { value: 'deal_stage_changed', label: 'Deal-Stage geändert', description: 'Wenn ein Deal in eine andere Stage wechselt', category: 'Deals' },
    { value: 'deal_property_changed', label: 'Deal-Eigenschaft geändert', description: 'Wenn eine Deal-Eigenschaft geändert wird', category: 'Deals' },
    { value: 'deal_won', label: 'Deal gewonnen', description: 'Wenn ein Deal als gewonnen markiert wird', category: 'Deals' },
    { value: 'deal_lost', label: 'Deal verloren', description: 'Wenn ein Deal als verloren markiert wird', category: 'Deals' },
    // Tickets
    { value: 'ticket_created', label: 'Ticket erstellt', description: 'Wenn ein neues Ticket erstellt wird', category: 'Tickets' },
    { value: 'ticket_updated', label: 'Ticket aktualisiert', description: 'Wenn ein Ticket aktualisiert wird', category: 'Tickets' },
    { value: 'ticket_deleted', label: 'Ticket gelöscht', description: 'Wenn ein Ticket gelöscht wird', category: 'Tickets' },
    { value: 'ticket_status_changed', label: 'Ticket-Status geändert', description: 'Wenn der Ticket-Status geändert wird', category: 'Tickets' },
    // Forms
    { value: 'form_submitted', label: 'Formular eingereicht', description: 'Wenn ein Formular ausgefüllt wird', category: 'Formulare' },
    // Meetings
    { value: 'meeting_booked', label: 'Meeting gebucht', description: 'Wenn ein Meeting gebucht wird', category: 'Meetings' },
    { value: 'meeting_cancelled', label: 'Meeting abgesagt', description: 'Wenn ein Meeting abgesagt wird', category: 'Meetings' },
    { value: 'meeting_completed', label: 'Meeting abgeschlossen', description: 'Wenn ein Meeting stattgefunden hat', category: 'Meetings' },
    { value: 'meeting_rescheduled', label: 'Meeting verschoben', description: 'Wenn ein Meeting verschoben wird', category: 'Meetings' },
    // Emails
    { value: 'email_opened', label: 'E-Mail geöffnet', description: 'Wenn eine E-Mail geöffnet wird', category: 'E-Mails' },
    { value: 'email_clicked', label: 'E-Mail-Link geklickt', description: 'Wenn ein Link in einer E-Mail geklickt wird', category: 'E-Mails' },
    { value: 'email_replied', label: 'E-Mail beantwortet', description: 'Wenn auf eine E-Mail geantwortet wird', category: 'E-Mails' },
    { value: 'email_bounced', label: 'E-Mail bounced', description: 'Wenn eine E-Mail nicht zugestellt werden kann', category: 'E-Mails' },
    { value: 'email_sent', label: 'E-Mail gesendet', description: 'Wenn eine E-Mail gesendet wird', category: 'E-Mails' },
    // Conversations
    { value: 'conversation_created', label: 'Konversation erstellt', description: 'Wenn eine neue Konversation erstellt wird', category: 'Konversationen' },
    { value: 'conversation_updated', label: 'Konversation aktualisiert', description: 'Wenn eine Konversation aktualisiert wird', category: 'Konversationen' },
    { value: 'conversation_message_received', label: 'Nachricht empfangen', description: 'Wenn eine neue Nachricht empfangen wird', category: 'Konversationen' },
    // Tasks
    { value: 'task_created', label: 'Aufgabe erstellt', description: 'Wenn eine neue Aufgabe erstellt wird', category: 'Aufgaben' },
    { value: 'task_updated', label: 'Aufgabe aktualisiert', description: 'Wenn eine Aufgabe aktualisiert wird', category: 'Aufgaben' },
    { value: 'task_deleted', label: 'Aufgabe gelöscht', description: 'Wenn eine Aufgabe gelöscht wird', category: 'Aufgaben' },
    { value: 'task_completed', label: 'Aufgabe erledigt', description: 'Wenn eine Aufgabe als erledigt markiert wird', category: 'Aufgaben' },
    // Quotes
    { value: 'quote_created', label: 'Angebot erstellt', description: 'Wenn ein neues Angebot erstellt wird', category: 'Angebote' },
    { value: 'quote_updated', label: 'Angebot aktualisiert', description: 'Wenn ein Angebot aktualisiert wird', category: 'Angebote' },
    { value: 'quote_published', label: 'Angebot veröffentlicht', description: 'Wenn ein Angebot veröffentlicht wird', category: 'Angebote' },
    { value: 'quote_signed', label: 'Angebot unterschrieben', description: 'Wenn ein Angebot unterschrieben wird', category: 'Angebote' },
  ],
  monday: [
    // Items
    { value: 'item_created', label: 'Item erstellt', description: 'Wenn ein neues Item erstellt wird', category: 'Items' },
    { value: 'item_updated', label: 'Item aktualisiert', description: 'Wenn ein Item aktualisiert wird', category: 'Items' },
    { value: 'item_deleted', label: 'Item gelöscht', description: 'Wenn ein Item gelöscht wird', category: 'Items' },
    { value: 'item_archived', label: 'Item archiviert', description: 'Wenn ein Item archiviert wird', category: 'Items' },
    { value: 'item_restored', label: 'Item wiederhergestellt', description: 'Wenn ein Item wiederhergestellt wird', category: 'Items' },
    { value: 'item_moved_to_group', label: 'Item in Gruppe verschoben', description: 'Wenn ein Item in eine andere Gruppe verschoben wird', category: 'Items' },
    { value: 'item_moved_to_board', label: 'Item zu Board verschoben', description: 'Wenn ein Item zu einem anderen Board verschoben wird', category: 'Items' },
    { value: 'item_name_changed', label: 'Item-Name geändert', description: 'Wenn der Name eines Items geändert wird', category: 'Items' },
    // Columns/Status
    { value: 'item_status_changed', label: 'Status geändert', description: 'Wenn der Status eines Items geändert wird', category: 'Spalten' },
    { value: 'column_value_changed', label: 'Spaltenwert geändert', description: 'Wenn ein beliebiger Spaltenwert geändert wird', category: 'Spalten' },
    { value: 'person_assigned', label: 'Person zugewiesen', description: 'Wenn eine Person einem Item zugewiesen wird', category: 'Spalten' },
    { value: 'person_unassigned', label: 'Person entfernt', description: 'Wenn eine Person von einem Item entfernt wird', category: 'Spalten' },
    { value: 'date_arrived', label: 'Datum erreicht', description: 'Wenn ein Datum-Wert erreicht wird', category: 'Spalten' },
    { value: 'date_passed', label: 'Datum überschritten', description: 'Wenn ein Datum überschritten wird', category: 'Spalten' },
    { value: 'checkbox_checked', label: 'Checkbox aktiviert', description: 'Wenn eine Checkbox aktiviert wird', category: 'Spalten' },
    { value: 'checkbox_unchecked', label: 'Checkbox deaktiviert', description: 'Wenn eine Checkbox deaktiviert wird', category: 'Spalten' },
    { value: 'dropdown_changed', label: 'Dropdown geändert', description: 'Wenn ein Dropdown-Wert geändert wird', category: 'Spalten' },
    { value: 'number_changed', label: 'Zahl geändert', description: 'Wenn ein Zahlen-Wert geändert wird', category: 'Spalten' },
    { value: 'text_changed', label: 'Text geändert', description: 'Wenn ein Text-Wert geändert wird', category: 'Spalten' },
    { value: 'timeline_changed', label: 'Timeline geändert', description: 'Wenn eine Timeline geändert wird', category: 'Spalten' },
    // Subitems
    { value: 'subitem_created', label: 'Subitem erstellt', description: 'Wenn ein neues Subitem erstellt wird', category: 'Subitems' },
    { value: 'subitem_updated', label: 'Subitem aktualisiert', description: 'Wenn ein Subitem aktualisiert wird', category: 'Subitems' },
    { value: 'subitem_deleted', label: 'Subitem gelöscht', description: 'Wenn ein Subitem gelöscht wird', category: 'Subitems' },
    { value: 'subitem_status_changed', label: 'Subitem-Status geändert', description: 'Wenn der Status eines Subitems geändert wird', category: 'Subitems' },
    // Updates/Comments
    { value: 'update_posted', label: 'Update gepostet', description: 'Wenn ein Update/Kommentar gepostet wird', category: 'Updates' },
    { value: 'update_edited', label: 'Update bearbeitet', description: 'Wenn ein Update bearbeitet wird', category: 'Updates' },
    { value: 'update_deleted', label: 'Update gelöscht', description: 'Wenn ein Update gelöscht wird', category: 'Updates' },
    { value: 'update_liked', label: 'Update geliked', description: 'Wenn ein Update geliked wird', category: 'Updates' },
    // Files
    { value: 'file_added', label: 'Datei hinzugefügt', description: 'Wenn eine Datei hinzugefügt wird', category: 'Dateien' },
    { value: 'file_deleted', label: 'Datei gelöscht', description: 'Wenn eine Datei gelöscht wird', category: 'Dateien' },
    // Groups
    { value: 'group_created', label: 'Gruppe erstellt', description: 'Wenn eine neue Gruppe erstellt wird', category: 'Gruppen' },
    { value: 'group_deleted', label: 'Gruppe gelöscht', description: 'Wenn eine Gruppe gelöscht wird', category: 'Gruppen' },
    { value: 'group_archived', label: 'Gruppe archiviert', description: 'Wenn eine Gruppe archiviert wird', category: 'Gruppen' },
    { value: 'group_color_changed', label: 'Gruppenfarbe geändert', description: 'Wenn die Farbe einer Gruppe geändert wird', category: 'Gruppen' },
  ],
}

// Event filter configuration - defines what filters are available per event
// Each filter can be:
// - 'text': Free text input
// - 'select': Select from predefined options (fetched dynamically from CRM)
// - 'multi_select': Select multiple values
export interface EventFilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'multi_select'
  placeholder?: string
  description?: string
  // For 'select' type: if 'dynamic', options are fetched from CRM API
  // If array, use static options
  options?: 'dynamic' | Array<{ value: string; label: string }>
  // The webhook payload path to check this filter against
  payloadPath: string
  // Optional: if true, check if the payload value is in the filter array (for multi_select)
  matchMode?: 'equals' | 'contains' | 'in'
}

export interface EventFilterConfig {
  filters: EventFilterField[]
}

// Source options for ActiveCampaign (like n8n)
export const ACTIVECAMPAIGN_SOURCES = [
  { value: 'public', label: 'Public' },
  { value: 'admin', label: 'Admin' },
  { value: 'api', label: 'API' },
  { value: 'system', label: 'System' },
] as const

// Common source filter for ActiveCampaign events
const activecampaignSourceFilter: EventFilterField = {
  key: 'source',
  label: 'Quelle (Source)',
  type: 'multi_select',
  placeholder: 'Quellen auswählen...',
  description: 'Optional: Nur aus diesen Quellen triggern',
  options: [...ACTIVECAMPAIGN_SOURCES],
  payloadPath: 'source',
  matchMode: 'in',
}

// Event filters configuration per CRM type and event
export const EVENT_FILTERS: Record<TriggerType, Record<string, EventFilterConfig>> = {
  webhook: {},
  close: {
    // Lead status changed - filter by target status
    lead_status_changed: {
      filters: [
        {
          key: 'target_status',
          label: 'Ziel-Status',
          type: 'select',
          placeholder: 'Status auswählen...',
          description: 'Trigger nur wenn der Lead in diesen Status wechselt',
          options: 'dynamic',
          payloadPath: 'data.new_status_label',
          matchMode: 'equals',
        },
      ],
    },
    lead_created: {
      filters: [
        {
          key: 'lead_status',
          label: 'Lead-Status',
          type: 'select',
          placeholder: 'Optional: Status filtern',
          description: 'Nur Leads mit diesem Status',
          options: 'dynamic',
          payloadPath: 'data.status_label',
          matchMode: 'equals',
        },
      ],
    },
    // Opportunity status changed - filter by target status
    opportunity_status_changed: {
      filters: [
        {
          key: 'target_status',
          label: 'Ziel-Status',
          type: 'select',
          placeholder: 'Status auswählen...',
          description: 'Trigger nur wenn die Opportunity in diesen Status wechselt',
          options: 'dynamic',
          payloadPath: 'data.new_status_label',
          matchMode: 'equals',
        },
      ],
    },
    opportunity_created: {
      filters: [
        {
          key: 'pipeline',
          label: 'Pipeline',
          type: 'select',
          placeholder: 'Pipeline auswählen...',
          description: 'Nur Opportunities in dieser Pipeline',
          options: 'dynamic',
          payloadPath: 'data.pipeline_id',
          matchMode: 'equals',
        },
      ],
    },
    // Contact tag added - filter by specific tag
    contact_tag_added: {
      filters: [
        {
          key: 'tag_name',
          label: 'Tag-Name',
          type: 'text',
          placeholder: 'z.B. "VIP"',
          description: 'Trigger nur wenn dieser Tag hinzugefügt wird',
          payloadPath: 'data.tag',
          matchMode: 'equals',
        },
      ],
    },
    task_created: {
      filters: [
        {
          key: 'task_type',
          label: 'Aufgaben-Typ',
          type: 'text',
          placeholder: 'z.B. "call", "email"',
          description: 'Nur bei diesem Aufgaben-Typ',
          payloadPath: 'data._type',
          matchMode: 'equals',
        },
      ],
    },
    custom_activity_created: {
      filters: [
        {
          key: 'activity_type',
          label: 'Aktivitäts-Typ',
          type: 'select',
          placeholder: 'Typ auswählen...',
          description: 'Nur bei diesem Custom Activity Typ',
          options: 'dynamic',
          payloadPath: 'data.custom_activity_type_id',
          matchMode: 'equals',
        },
      ],
    },
  },
  activecampaign: {
    // All events with source filter
    contact_created: {
      filters: [activecampaignSourceFilter],
    },
    contact_updated: {
      filters: [activecampaignSourceFilter],
    },
    contact_tag_added: {
      filters: [
        {
          key: 'tag_name',
          label: 'Tag',
          type: 'select',
          placeholder: 'Tag auswählen...',
          description: 'Trigger nur wenn dieser Tag hinzugefügt wird',
          options: 'dynamic',
          payloadPath: 'contact.tag',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    contact_tag_removed: {
      filters: [
        {
          key: 'tag_name',
          label: 'Tag',
          type: 'select',
          placeholder: 'Tag auswählen...',
          description: 'Trigger nur wenn dieser Tag entfernt wird',
          options: 'dynamic',
          payloadPath: 'contact.tag',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    contact_subscribed: {
      filters: [
        {
          key: 'list_id',
          label: 'Liste',
          type: 'select',
          placeholder: 'Liste auswählen...',
          description: 'Nur bei Anmeldung zu dieser Liste',
          options: 'dynamic',
          payloadPath: 'list.id',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    contact_unsubscribed: {
      filters: [
        {
          key: 'list_id',
          label: 'Liste',
          type: 'select',
          placeholder: 'Liste auswählen...',
          description: 'Nur bei Abmeldung von dieser Liste',
          options: 'dynamic',
          payloadPath: 'list.id',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    deal_created: {
      filters: [
        {
          key: 'pipeline_id',
          label: 'Pipeline',
          type: 'select',
          placeholder: 'Pipeline auswählen...',
          description: 'Nur Deals in dieser Pipeline',
          options: 'dynamic',
          payloadPath: 'deal.pipeline',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    deal_updated: {
      filters: [activecampaignSourceFilter],
    },
    deal_stage_changed: {
      filters: [
        {
          key: 'target_stage',
          label: 'Ziel-Stage',
          type: 'select',
          placeholder: 'Stage auswählen...',
          description: 'Trigger nur wenn der Deal in diese Stage wechselt',
          options: 'dynamic',
          payloadPath: 'deal.stage',
          matchMode: 'equals',
        },
        {
          key: 'pipeline_id',
          label: 'Pipeline',
          type: 'select',
          placeholder: 'Pipeline auswählen...',
          description: 'Nur für diese Pipeline',
          options: 'dynamic',
          payloadPath: 'deal.pipeline',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    deal_won: {
      filters: [
        {
          key: 'pipeline_id',
          label: 'Pipeline',
          type: 'select',
          placeholder: 'Pipeline auswählen...',
          description: 'Nur für diese Pipeline',
          options: 'dynamic',
          payloadPath: 'deal.pipeline',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    deal_lost: {
      filters: [
        {
          key: 'pipeline_id',
          label: 'Pipeline',
          type: 'select',
          placeholder: 'Pipeline auswählen...',
          description: 'Nur für diese Pipeline',
          options: 'dynamic',
          payloadPath: 'deal.pipeline',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    form_submitted: {
      filters: [
        {
          key: 'form_id',
          label: 'Formular',
          type: 'select',
          placeholder: 'Formular auswählen...',
          description: 'Trigger nur bei diesem Formular',
          options: 'dynamic',
          payloadPath: 'form.id',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    automation_started: {
      filters: [
        {
          key: 'automation_id',
          label: 'Automation',
          type: 'select',
          placeholder: 'Automation auswählen...',
          description: 'Nur bei dieser Automation',
          options: 'dynamic',
          payloadPath: 'automation.id',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    automation_ended: {
      filters: [
        {
          key: 'automation_id',
          label: 'Automation',
          type: 'select',
          placeholder: 'Automation auswählen...',
          description: 'Nur bei dieser Automation',
          options: 'dynamic',
          payloadPath: 'automation.id',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    campaign_opened: {
      filters: [
        {
          key: 'campaign_id',
          label: 'Kampagne',
          type: 'select',
          placeholder: 'Kampagne auswählen...',
          description: 'Nur bei dieser Kampagne',
          options: 'dynamic',
          payloadPath: 'campaign.id',
          matchMode: 'equals',
        },
        activecampaignSourceFilter,
      ],
    },
    campaign_clicked: {
      filters: [
        {
          key: 'campaign_id',
          label: 'Kampagne',
          type: 'select',
          placeholder: 'Kampagne auswählen...',
          description: 'Nur bei dieser Kampagne',
          options: 'dynamic',
          payloadPath: 'campaign.id',
          matchMode: 'equals',
        },
        {
          key: 'link_url',
          label: 'Link-URL',
          type: 'text',
          placeholder: 'Optional: URL filtern',
          description: 'Nur bei Klick auf diesen Link',
          payloadPath: 'link.url',
          matchMode: 'contains',
        },
        activecampaignSourceFilter,
      ],
    },
    sms_sent: {
      filters: [activecampaignSourceFilter],
    },
    sms_received: {
      filters: [activecampaignSourceFilter],
    },
    sms_replied: {
      filters: [activecampaignSourceFilter],
    },
  },
  pipedrive: {
    // Deal stage changed
    deal_stage_changed: {
      filters: [
        {
          key: 'target_stage_id',
          label: 'Ziel-Stage',
          type: 'select',
          placeholder: 'Stage auswählen...',
          description: 'Trigger nur wenn der Deal in diese Stage wechselt',
          options: 'dynamic',
          payloadPath: 'current.stage_id',
          matchMode: 'equals',
        },
        {
          key: 'pipeline_id',
          label: 'Pipeline',
          type: 'select',
          placeholder: 'Pipeline auswählen...',
          description: 'Optional: Nur für diese Pipeline',
          options: 'dynamic',
          payloadPath: 'current.pipeline_id',
          matchMode: 'equals',
        },
      ],
    },
    // Person updated - filter by field
    person_updated: {
      filters: [
        {
          key: 'field_changed',
          label: 'Geändertes Feld',
          type: 'text',
          placeholder: 'z.B. "phone"',
          description: 'Trigger nur wenn dieses Feld geändert wurde',
          payloadPath: 'meta.changed_fields',
          matchMode: 'contains',
        },
      ],
    },
  },
  hubspot: {
    // Deal stage changed
    deal_stage_changed: {
      filters: [
        {
          key: 'target_stage',
          label: 'Ziel-Stage',
          type: 'select',
          placeholder: 'Stage auswählen...',
          description: 'Trigger nur wenn der Deal in diese Stage wechselt',
          options: 'dynamic',
          payloadPath: 'properties.dealstage',
          matchMode: 'equals',
        },
        {
          key: 'pipeline',
          label: 'Pipeline',
          type: 'select',
          placeholder: 'Pipeline auswählen...',
          description: 'Optional: Nur für diese Pipeline',
          options: 'dynamic',
          payloadPath: 'properties.pipeline',
          matchMode: 'equals',
        },
      ],
    },
    // Contact property changed
    contact_property_changed: {
      filters: [
        {
          key: 'property_name',
          label: 'Eigenschaft',
          type: 'select',
          placeholder: 'Eigenschaft auswählen...',
          description: 'Trigger nur wenn diese Eigenschaft geändert wird',
          options: 'dynamic',
          payloadPath: 'propertyName',
          matchMode: 'equals',
        },
        {
          key: 'property_value',
          label: 'Neuer Wert',
          type: 'text',
          placeholder: 'Optional: Nur bei diesem Wert',
          description: 'Optional: Trigger nur wenn der neue Wert diesem entspricht',
          payloadPath: 'properties.*', // Dynamic based on property_name
          matchMode: 'equals',
        },
      ],
    },
    // Form submitted
    form_submitted: {
      filters: [
        {
          key: 'form_id',
          label: 'Formular',
          type: 'select',
          placeholder: 'Formular auswählen...',
          description: 'Trigger nur bei diesem Formular',
          options: 'dynamic',
          payloadPath: 'formId',
          matchMode: 'equals',
        },
      ],
    },
    // Ticket status changed
    ticket_status_changed: {
      filters: [
        {
          key: 'target_status',
          label: 'Ziel-Status',
          type: 'select',
          placeholder: 'Status auswählen...',
          description: 'Trigger nur wenn das Ticket in diesen Status wechselt',
          options: 'dynamic',
          payloadPath: 'properties.hs_pipeline_stage',
          matchMode: 'equals',
        },
      ],
    },
  },
  monday: {
    // Item status changed
    item_status_changed: {
      filters: [
        {
          key: 'target_status',
          label: 'Ziel-Status',
          type: 'text',
          placeholder: 'z.B. "Done"',
          description: 'Trigger nur wenn der Status zu diesem Wert wechselt',
          payloadPath: 'event.value.label.text',
          matchMode: 'equals',
        },
        {
          key: 'column_id',
          label: 'Status-Spalte',
          type: 'text',
          placeholder: 'Optional: Spalten-ID',
          description: 'Optional: Nur für diese Spalte',
          payloadPath: 'event.columnId',
          matchMode: 'equals',
        },
      ],
    },
    // Column value changed
    column_value_changed: {
      filters: [
        {
          key: 'column_id',
          label: 'Spalte',
          type: 'text',
          placeholder: 'Spalten-ID',
          description: 'Trigger nur wenn diese Spalte geändert wird',
          payloadPath: 'event.columnId',
          matchMode: 'equals',
        },
        {
          key: 'new_value',
          label: 'Neuer Wert',
          type: 'text',
          placeholder: 'Optional: Wert',
          description: 'Optional: Trigger nur bei diesem Wert',
          payloadPath: 'event.value.value',
          matchMode: 'equals',
        },
      ],
    },
    // Item moved to group
    item_moved_to_group: {
      filters: [
        {
          key: 'target_group_id',
          label: 'Ziel-Gruppe',
          type: 'text',
          placeholder: 'Gruppen-ID',
          description: 'Trigger nur wenn in diese Gruppe verschoben',
          payloadPath: 'event.destGroupId',
          matchMode: 'equals',
        },
      ],
    },
    // Subitem status changed
    subitem_status_changed: {
      filters: [
        {
          key: 'target_status',
          label: 'Ziel-Status',
          type: 'text',
          placeholder: 'z.B. "Working on it"',
          description: 'Trigger nur bei diesem Status',
          payloadPath: 'event.value.label.text',
          matchMode: 'equals',
        },
      ],
    },
  },
}

// Helper type for event filter values
export type EventFilterValues = Record<string, string | string[]>

export const triggerSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  type: triggerTypeEnum,
  trigger_event: z.string().optional(),
  event_filters: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
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
