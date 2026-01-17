/**
 * Trigger Payload Variables
 * Defines available variables from each trigger type's webhook payload
 * Used for dynamic field mapping in actions (like n8n expressions, but user-friendly)
 */

import type { TriggerType } from './validation'

export interface TriggerVariable {
  key: string          // The variable key used internally
  label: string        // User-friendly display label
  path: string         // JSON path in the webhook payload
  category: string     // Grouping category
  type: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'object'
  example?: string     // Example value for display
}

// Common contact/person variables used across CRMs
const COMMON_CONTACT_VARS: TriggerVariable[] = [
  { key: 'contact_name', label: 'Name', path: 'contact.name', category: 'Kontakt', type: 'string', example: 'Max Mustermann' },
  { key: 'contact_first_name', label: 'Vorname', path: 'contact.first_name', category: 'Kontakt', type: 'string', example: 'Max' },
  { key: 'contact_last_name', label: 'Nachname', path: 'contact.last_name', category: 'Kontakt', type: 'string', example: 'Mustermann' },
  { key: 'contact_email', label: 'E-Mail', path: 'contact.email', category: 'Kontakt', type: 'email', example: 'max@example.com' },
  { key: 'contact_phone', label: 'Telefon', path: 'contact.phone', category: 'Kontakt', type: 'phone', example: '+49 151 12345678' },
]

// Variables available per CRM type
export const TRIGGER_VARIABLES: Record<TriggerType, Record<string, TriggerVariable[]>> = {
  webhook: {
    incoming: [
      // Generic webhook - user can specify custom paths
      { key: 'payload', label: 'Gesamter Payload', path: '$', category: 'Payload', type: 'object' },
      { key: 'custom', label: 'Benutzerdefiniert', path: 'custom.*', category: 'Payload', type: 'string' },
    ],
  },

  // ==================== CLOSE CRM ====================
  close: {
    // Lead events
    lead_created: [
      { key: 'lead_id', label: 'Lead ID', path: 'data.id', category: 'Lead', type: 'string', example: 'lead_abc123' },
      { key: 'lead_name', label: 'Firmenname', path: 'data.display_name', category: 'Lead', type: 'string', example: 'Acme GmbH' },
      { key: 'lead_status', label: 'Status', path: 'data.status_label', category: 'Lead', type: 'string', example: 'Potential' },
      { key: 'lead_status_id', label: 'Status ID', path: 'data.status_id', category: 'Lead', type: 'string' },
      { key: 'lead_url', label: 'Website', path: 'data.url', category: 'Lead', type: 'string' },
      { key: 'lead_description', label: 'Beschreibung', path: 'data.description', category: 'Lead', type: 'string' },
      { key: 'contact_name', label: 'Kontakt Name', path: 'data.contacts[0].name', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'Kontakt E-Mail', path: 'data.contacts[0].emails[0].email', category: 'Kontakt', type: 'email' },
      { key: 'contact_phone', label: 'Kontakt Telefon', path: 'data.contacts[0].phones[0].phone', category: 'Kontakt', type: 'phone' },
      { key: 'contact_title', label: 'Position', path: 'data.contacts[0].title', category: 'Kontakt', type: 'string' },
    ],
    lead_updated: [
      { key: 'lead_id', label: 'Lead ID', path: 'data.id', category: 'Lead', type: 'string' },
      { key: 'lead_name', label: 'Firmenname', path: 'data.display_name', category: 'Lead', type: 'string' },
      { key: 'lead_status', label: 'Status', path: 'data.status_label', category: 'Lead', type: 'string' },
      { key: 'previous_data', label: 'Vorherige Daten', path: 'previous_data', category: 'Änderungen', type: 'object' },
    ],
    lead_status_changed: [
      { key: 'lead_id', label: 'Lead ID', path: 'data.id', category: 'Lead', type: 'string' },
      { key: 'lead_name', label: 'Firmenname', path: 'data.display_name', category: 'Lead', type: 'string' },
      { key: 'old_status', label: 'Alter Status', path: 'data.old_status_label', category: 'Status', type: 'string', example: 'Potential' },
      { key: 'new_status', label: 'Neuer Status', path: 'data.new_status_label', category: 'Status', type: 'string', example: 'Qualified' },
      { key: 'old_status_id', label: 'Alte Status ID', path: 'data.old_status_id', category: 'Status', type: 'string' },
      { key: 'new_status_id', label: 'Neue Status ID', path: 'data.new_status_id', category: 'Status', type: 'string' },
    ],
    // Contact events
    contact_created: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'data.id', category: 'Kontakt', type: 'string' },
      { key: 'contact_name', label: 'Name', path: 'data.name', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'data.emails[0].email', category: 'Kontakt', type: 'email' },
      { key: 'contact_phone', label: 'Telefon', path: 'data.phones[0].phone', category: 'Kontakt', type: 'phone' },
      { key: 'contact_title', label: 'Position', path: 'data.title', category: 'Kontakt', type: 'string' },
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
    ],
    contact_updated: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'data.id', category: 'Kontakt', type: 'string' },
      { key: 'contact_name', label: 'Name', path: 'data.name', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'data.emails[0].email', category: 'Kontakt', type: 'email' },
      { key: 'contact_phone', label: 'Telefon', path: 'data.phones[0].phone', category: 'Kontakt', type: 'phone' },
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
    ],
    // Opportunity events
    opportunity_created: [
      { key: 'opportunity_id', label: 'Opportunity ID', path: 'data.id', category: 'Opportunity', type: 'string' },
      { key: 'opportunity_value', label: 'Wert', path: 'data.value', category: 'Opportunity', type: 'number' },
      { key: 'opportunity_confidence', label: 'Wahrscheinlichkeit', path: 'data.confidence', category: 'Opportunity', type: 'number' },
      { key: 'opportunity_note', label: 'Notiz', path: 'data.note', category: 'Opportunity', type: 'string' },
      { key: 'opportunity_status', label: 'Status', path: 'data.status_label', category: 'Opportunity', type: 'string' },
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
    ],
    opportunity_status_changed: [
      { key: 'opportunity_id', label: 'Opportunity ID', path: 'data.id', category: 'Opportunity', type: 'string' },
      { key: 'old_status', label: 'Alter Status', path: 'data.old_status_label', category: 'Status', type: 'string' },
      { key: 'new_status', label: 'Neuer Status', path: 'data.new_status_label', category: 'Status', type: 'string' },
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
    ],
    // Activity events
    call_completed: [
      { key: 'call_id', label: 'Anruf ID', path: 'data.id', category: 'Anruf', type: 'string' },
      { key: 'call_duration', label: 'Dauer (Sek.)', path: 'data.duration', category: 'Anruf', type: 'number' },
      { key: 'call_direction', label: 'Richtung', path: 'data.direction', category: 'Anruf', type: 'string' },
      { key: 'call_disposition', label: 'Ergebnis', path: 'data.disposition', category: 'Anruf', type: 'string' },
      { key: 'call_note', label: 'Notiz', path: 'data.note', category: 'Anruf', type: 'string' },
      { key: 'contact_phone', label: 'Telefonnummer', path: 'data.remote_phone', category: 'Kontakt', type: 'phone' },
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
    ],
    sms_received: [
      { key: 'sms_id', label: 'SMS ID', path: 'data.id', category: 'SMS', type: 'string' },
      { key: 'sms_text', label: 'Text', path: 'data.text', category: 'SMS', type: 'string' },
      { key: 'sender_phone', label: 'Absender', path: 'data.remote_phone', category: 'SMS', type: 'phone' },
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
    ],
    task_created: [
      { key: 'task_id', label: 'Aufgabe ID', path: 'data.id', category: 'Aufgabe', type: 'string' },
      { key: 'task_text', label: 'Text', path: 'data.text', category: 'Aufgabe', type: 'string' },
      { key: 'task_date', label: 'Fälligkeit', path: 'data.date', category: 'Aufgabe', type: 'date' },
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
    ],
    // Default for other events - use lead_created as base
    default: [
      { key: 'lead_id', label: 'Lead ID', path: 'data.lead_id', category: 'Lead', type: 'string' },
      { key: 'contact_name', label: 'Kontakt Name', path: 'data.contact.name', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'Kontakt E-Mail', path: 'data.contact.email', category: 'Kontakt', type: 'email' },
      { key: 'contact_phone', label: 'Kontakt Telefon', path: 'data.contact.phone', category: 'Kontakt', type: 'phone' },
    ],
  },

  // ==================== ACTIVECAMPAIGN ====================
  activecampaign: {
    contact_created: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'contact.id', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'contact.email', category: 'Kontakt', type: 'email' },
      { key: 'contact_first_name', label: 'Vorname', path: 'contact.firstName', category: 'Kontakt', type: 'string' },
      { key: 'contact_last_name', label: 'Nachname', path: 'contact.lastName', category: 'Kontakt', type: 'string' },
      { key: 'contact_phone', label: 'Telefon', path: 'contact.phone', category: 'Kontakt', type: 'phone' },
      { key: 'source', label: 'Quelle', path: 'source', category: 'Meta', type: 'string', example: 'public, admin, api' },
    ],
    contact_updated: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'contact.id', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'contact.email', category: 'Kontakt', type: 'email' },
      { key: 'contact_first_name', label: 'Vorname', path: 'contact.firstName', category: 'Kontakt', type: 'string' },
      { key: 'contact_last_name', label: 'Nachname', path: 'contact.lastName', category: 'Kontakt', type: 'string' },
      { key: 'updated_fields', label: 'Geänderte Felder', path: 'updated_fields', category: 'Änderungen', type: 'object' },
    ],
    contact_tag_added: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'contact.id', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'contact.email', category: 'Kontakt', type: 'email' },
      { key: 'tag_id', label: 'Tag ID', path: 'contact.tag', category: 'Tag', type: 'string' },
      { key: 'tag_name', label: 'Tag Name', path: 'tag.name', category: 'Tag', type: 'string' },
    ],
    deal_created: [
      { key: 'deal_id', label: 'Deal ID', path: 'deal.id', category: 'Deal', type: 'string' },
      { key: 'deal_title', label: 'Titel', path: 'deal.title', category: 'Deal', type: 'string' },
      { key: 'deal_value', label: 'Wert', path: 'deal.value', category: 'Deal', type: 'number' },
      { key: 'deal_currency', label: 'Währung', path: 'deal.currency', category: 'Deal', type: 'string' },
      { key: 'deal_stage', label: 'Stage', path: 'deal.stage', category: 'Deal', type: 'string' },
      { key: 'deal_pipeline', label: 'Pipeline', path: 'deal.pipeline', category: 'Deal', type: 'string' },
      { key: 'contact_id', label: 'Kontakt ID', path: 'deal.contact', category: 'Kontakt', type: 'string' },
    ],
    deal_stage_changed: [
      { key: 'deal_id', label: 'Deal ID', path: 'deal.id', category: 'Deal', type: 'string' },
      { key: 'deal_title', label: 'Titel', path: 'deal.title', category: 'Deal', type: 'string' },
      { key: 'old_stage', label: 'Alte Stage', path: 'deal.old_stage', category: 'Stage', type: 'string' },
      { key: 'new_stage', label: 'Neue Stage', path: 'deal.stage', category: 'Stage', type: 'string' },
      { key: 'deal_value', label: 'Wert', path: 'deal.value', category: 'Deal', type: 'number' },
    ],
    form_submitted: [
      { key: 'form_id', label: 'Formular ID', path: 'form.id', category: 'Formular', type: 'string' },
      { key: 'form_name', label: 'Formular Name', path: 'form.name', category: 'Formular', type: 'string' },
      { key: 'contact_id', label: 'Kontakt ID', path: 'contact.id', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'contact.email', category: 'Kontakt', type: 'email' },
      { key: 'form_data', label: 'Formulardaten', path: 'submission', category: 'Formular', type: 'object' },
    ],
    default: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'contact.id', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'contact.email', category: 'Kontakt', type: 'email' },
      { key: 'contact_first_name', label: 'Vorname', path: 'contact.firstName', category: 'Kontakt', type: 'string' },
      { key: 'contact_last_name', label: 'Nachname', path: 'contact.lastName', category: 'Kontakt', type: 'string' },
      { key: 'contact_phone', label: 'Telefon', path: 'contact.phone', category: 'Kontakt', type: 'phone' },
    ],
  },

  // ==================== PIPEDRIVE ====================
  pipedrive: {
    deal_created: [
      { key: 'deal_id', label: 'Deal ID', path: 'current.id', category: 'Deal', type: 'number' },
      { key: 'deal_title', label: 'Titel', path: 'current.title', category: 'Deal', type: 'string' },
      { key: 'deal_value', label: 'Wert', path: 'current.value', category: 'Deal', type: 'number' },
      { key: 'deal_currency', label: 'Währung', path: 'current.currency', category: 'Deal', type: 'string' },
      { key: 'deal_status', label: 'Status', path: 'current.status', category: 'Deal', type: 'string' },
      { key: 'deal_stage_id', label: 'Stage ID', path: 'current.stage_id', category: 'Deal', type: 'number' },
      { key: 'deal_pipeline_id', label: 'Pipeline ID', path: 'current.pipeline_id', category: 'Deal', type: 'number' },
      { key: 'person_id', label: 'Person ID', path: 'current.person_id', category: 'Person', type: 'number' },
      { key: 'person_name', label: 'Person Name', path: 'current.person_name', category: 'Person', type: 'string' },
      { key: 'org_id', label: 'Organisation ID', path: 'current.org_id', category: 'Organisation', type: 'number' },
      { key: 'org_name', label: 'Organisation Name', path: 'current.org_name', category: 'Organisation', type: 'string' },
    ],
    deal_stage_changed: [
      { key: 'deal_id', label: 'Deal ID', path: 'current.id', category: 'Deal', type: 'number' },
      { key: 'deal_title', label: 'Titel', path: 'current.title', category: 'Deal', type: 'string' },
      { key: 'old_stage_id', label: 'Alte Stage ID', path: 'previous.stage_id', category: 'Stage', type: 'number' },
      { key: 'new_stage_id', label: 'Neue Stage ID', path: 'current.stage_id', category: 'Stage', type: 'number' },
      { key: 'deal_value', label: 'Wert', path: 'current.value', category: 'Deal', type: 'number' },
      { key: 'person_id', label: 'Person ID', path: 'current.person_id', category: 'Person', type: 'number' },
    ],
    deal_won: [
      { key: 'deal_id', label: 'Deal ID', path: 'current.id', category: 'Deal', type: 'number' },
      { key: 'deal_title', label: 'Titel', path: 'current.title', category: 'Deal', type: 'string' },
      { key: 'deal_value', label: 'Wert', path: 'current.value', category: 'Deal', type: 'number' },
      { key: 'won_time', label: 'Gewonnen am', path: 'current.won_time', category: 'Deal', type: 'date' },
      { key: 'person_id', label: 'Person ID', path: 'current.person_id', category: 'Person', type: 'number' },
      { key: 'person_name', label: 'Person Name', path: 'current.person_name', category: 'Person', type: 'string' },
    ],
    person_created: [
      { key: 'person_id', label: 'Person ID', path: 'current.id', category: 'Person', type: 'number' },
      { key: 'person_name', label: 'Name', path: 'current.name', category: 'Person', type: 'string' },
      { key: 'person_email', label: 'E-Mail', path: 'current.email[0].value', category: 'Person', type: 'email' },
      { key: 'person_phone', label: 'Telefon', path: 'current.phone[0].value', category: 'Person', type: 'phone' },
      { key: 'org_id', label: 'Organisation ID', path: 'current.org_id', category: 'Organisation', type: 'number' },
    ],
    person_updated: [
      { key: 'person_id', label: 'Person ID', path: 'current.id', category: 'Person', type: 'number' },
      { key: 'person_name', label: 'Name', path: 'current.name', category: 'Person', type: 'string' },
      { key: 'person_email', label: 'E-Mail', path: 'current.email[0].value', category: 'Person', type: 'email' },
      { key: 'person_phone', label: 'Telefon', path: 'current.phone[0].value', category: 'Person', type: 'phone' },
      { key: 'changed_fields', label: 'Geänderte Felder', path: 'meta.changed_fields', category: 'Änderungen', type: 'object' },
    ],
    activity_created: [
      { key: 'activity_id', label: 'Aktivität ID', path: 'current.id', category: 'Aktivität', type: 'number' },
      { key: 'activity_type', label: 'Typ', path: 'current.type', category: 'Aktivität', type: 'string' },
      { key: 'activity_subject', label: 'Betreff', path: 'current.subject', category: 'Aktivität', type: 'string' },
      { key: 'activity_note', label: 'Notiz', path: 'current.note', category: 'Aktivität', type: 'string' },
      { key: 'deal_id', label: 'Deal ID', path: 'current.deal_id', category: 'Deal', type: 'number' },
      { key: 'person_id', label: 'Person ID', path: 'current.person_id', category: 'Person', type: 'number' },
    ],
    default: [
      { key: 'person_id', label: 'Person ID', path: 'current.person_id', category: 'Person', type: 'number' },
      { key: 'person_name', label: 'Person Name', path: 'current.person_name', category: 'Person', type: 'string' },
      { key: 'org_id', label: 'Organisation ID', path: 'current.org_id', category: 'Organisation', type: 'number' },
      { key: 'deal_id', label: 'Deal ID', path: 'current.deal_id', category: 'Deal', type: 'number' },
    ],
  },

  // ==================== HUBSPOT ====================
  hubspot: {
    contact_created: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'objectId', category: 'Kontakt', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'properties.email', category: 'Kontakt', type: 'email' },
      { key: 'contact_first_name', label: 'Vorname', path: 'properties.firstname', category: 'Kontakt', type: 'string' },
      { key: 'contact_last_name', label: 'Nachname', path: 'properties.lastname', category: 'Kontakt', type: 'string' },
      { key: 'contact_phone', label: 'Telefon', path: 'properties.phone', category: 'Kontakt', type: 'phone' },
      { key: 'contact_company', label: 'Firma', path: 'properties.company', category: 'Kontakt', type: 'string' },
      { key: 'lifecycle_stage', label: 'Lifecycle Stage', path: 'properties.lifecyclestage', category: 'Kontakt', type: 'string' },
    ],
    contact_property_changed: [
      { key: 'contact_id', label: 'Kontakt ID', path: 'objectId', category: 'Kontakt', type: 'string' },
      { key: 'property_name', label: 'Geänderte Eigenschaft', path: 'propertyName', category: 'Änderung', type: 'string' },
      { key: 'property_value', label: 'Neuer Wert', path: 'propertyValue', category: 'Änderung', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'properties.email', category: 'Kontakt', type: 'email' },
    ],
    deal_created: [
      { key: 'deal_id', label: 'Deal ID', path: 'objectId', category: 'Deal', type: 'string' },
      { key: 'deal_name', label: 'Name', path: 'properties.dealname', category: 'Deal', type: 'string' },
      { key: 'deal_amount', label: 'Betrag', path: 'properties.amount', category: 'Deal', type: 'number' },
      { key: 'deal_stage', label: 'Stage', path: 'properties.dealstage', category: 'Deal', type: 'string' },
      { key: 'deal_pipeline', label: 'Pipeline', path: 'properties.pipeline', category: 'Deal', type: 'string' },
      { key: 'close_date', label: 'Abschlussdatum', path: 'properties.closedate', category: 'Deal', type: 'date' },
      { key: 'owner_id', label: 'Besitzer ID', path: 'properties.hubspot_owner_id', category: 'Deal', type: 'string' },
    ],
    deal_stage_changed: [
      { key: 'deal_id', label: 'Deal ID', path: 'objectId', category: 'Deal', type: 'string' },
      { key: 'deal_name', label: 'Name', path: 'properties.dealname', category: 'Deal', type: 'string' },
      { key: 'deal_stage', label: 'Neue Stage', path: 'properties.dealstage', category: 'Stage', type: 'string' },
      { key: 'deal_amount', label: 'Betrag', path: 'properties.amount', category: 'Deal', type: 'number' },
    ],
    form_submitted: [
      { key: 'form_id', label: 'Formular ID', path: 'formId', category: 'Formular', type: 'string' },
      { key: 'form_name', label: 'Formular Name', path: 'formName', category: 'Formular', type: 'string' },
      { key: 'page_url', label: 'Seiten-URL', path: 'pageUrl', category: 'Formular', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'submittedFields.email', category: 'Kontakt', type: 'email' },
      { key: 'submitted_fields', label: 'Formulardaten', path: 'submittedFields', category: 'Formular', type: 'object' },
    ],
    company_created: [
      { key: 'company_id', label: 'Unternehmen ID', path: 'objectId', category: 'Unternehmen', type: 'string' },
      { key: 'company_name', label: 'Name', path: 'properties.name', category: 'Unternehmen', type: 'string' },
      { key: 'company_domain', label: 'Domain', path: 'properties.domain', category: 'Unternehmen', type: 'string' },
      { key: 'company_industry', label: 'Branche', path: 'properties.industry', category: 'Unternehmen', type: 'string' },
    ],
    ticket_created: [
      { key: 'ticket_id', label: 'Ticket ID', path: 'objectId', category: 'Ticket', type: 'string' },
      { key: 'ticket_subject', label: 'Betreff', path: 'properties.subject', category: 'Ticket', type: 'string' },
      { key: 'ticket_content', label: 'Inhalt', path: 'properties.content', category: 'Ticket', type: 'string' },
      { key: 'ticket_status', label: 'Status', path: 'properties.hs_pipeline_stage', category: 'Ticket', type: 'string' },
      { key: 'ticket_priority', label: 'Priorität', path: 'properties.hs_ticket_priority', category: 'Ticket', type: 'string' },
    ],
    default: [
      { key: 'object_id', label: 'Objekt ID', path: 'objectId', category: 'Allgemein', type: 'string' },
      { key: 'contact_email', label: 'E-Mail', path: 'properties.email', category: 'Kontakt', type: 'email' },
      { key: 'contact_first_name', label: 'Vorname', path: 'properties.firstname', category: 'Kontakt', type: 'string' },
      { key: 'contact_phone', label: 'Telefon', path: 'properties.phone', category: 'Kontakt', type: 'phone' },
    ],
  },

  // ==================== MONDAY.COM ====================
  monday: {
    item_created: [
      { key: 'item_id', label: 'Item ID', path: 'event.pulseId', category: 'Item', type: 'number' },
      { key: 'item_name', label: 'Name', path: 'event.pulseName', category: 'Item', type: 'string' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
      { key: 'group_id', label: 'Gruppe ID', path: 'event.groupId', category: 'Board', type: 'string' },
      { key: 'user_id', label: 'Ersteller ID', path: 'event.userId', category: 'Meta', type: 'number' },
    ],
    item_updated: [
      { key: 'item_id', label: 'Item ID', path: 'event.pulseId', category: 'Item', type: 'number' },
      { key: 'item_name', label: 'Name', path: 'event.pulseName', category: 'Item', type: 'string' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
      { key: 'column_values', label: 'Spalten-Werte', path: 'event.columnValues', category: 'Item', type: 'object' },
    ],
    item_status_changed: [
      { key: 'item_id', label: 'Item ID', path: 'event.pulseId', category: 'Item', type: 'number' },
      { key: 'item_name', label: 'Name', path: 'event.pulseName', category: 'Item', type: 'string' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
      { key: 'column_id', label: 'Spalten ID', path: 'event.columnId', category: 'Status', type: 'string' },
      { key: 'old_status', label: 'Alter Status', path: 'event.previousValue.label.text', category: 'Status', type: 'string' },
      { key: 'new_status', label: 'Neuer Status', path: 'event.value.label.text', category: 'Status', type: 'string' },
    ],
    column_value_changed: [
      { key: 'item_id', label: 'Item ID', path: 'event.pulseId', category: 'Item', type: 'number' },
      { key: 'item_name', label: 'Name', path: 'event.pulseName', category: 'Item', type: 'string' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
      { key: 'column_id', label: 'Spalten ID', path: 'event.columnId', category: 'Spalte', type: 'string' },
      { key: 'column_title', label: 'Spalten Name', path: 'event.columnTitle', category: 'Spalte', type: 'string' },
      { key: 'old_value', label: 'Alter Wert', path: 'event.previousValue', category: 'Spalte', type: 'object' },
      { key: 'new_value', label: 'Neuer Wert', path: 'event.value', category: 'Spalte', type: 'object' },
    ],
    item_moved_to_group: [
      { key: 'item_id', label: 'Item ID', path: 'event.pulseId', category: 'Item', type: 'number' },
      { key: 'item_name', label: 'Name', path: 'event.pulseName', category: 'Item', type: 'string' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
      { key: 'source_group', label: 'Quell-Gruppe', path: 'event.srcGroupId', category: 'Gruppe', type: 'string' },
      { key: 'dest_group', label: 'Ziel-Gruppe', path: 'event.destGroupId', category: 'Gruppe', type: 'string' },
    ],
    update_posted: [
      { key: 'update_id', label: 'Update ID', path: 'event.updateId', category: 'Update', type: 'number' },
      { key: 'item_id', label: 'Item ID', path: 'event.pulseId', category: 'Item', type: 'number' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
      { key: 'update_body', label: 'Inhalt', path: 'event.body', category: 'Update', type: 'string' },
      { key: 'user_id', label: 'Autor ID', path: 'event.userId', category: 'Meta', type: 'number' },
    ],
    subitem_created: [
      { key: 'subitem_id', label: 'Subitem ID', path: 'event.pulseId', category: 'Subitem', type: 'number' },
      { key: 'subitem_name', label: 'Name', path: 'event.pulseName', category: 'Subitem', type: 'string' },
      { key: 'parent_item_id', label: 'Eltern-Item ID', path: 'event.parentItemId', category: 'Item', type: 'number' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
    ],
    default: [
      { key: 'item_id', label: 'Item ID', path: 'event.pulseId', category: 'Item', type: 'number' },
      { key: 'item_name', label: 'Item Name', path: 'event.pulseName', category: 'Item', type: 'string' },
      { key: 'board_id', label: 'Board ID', path: 'event.boardId', category: 'Board', type: 'number' },
    ],
  },
}

/**
 * Get available variables for a specific trigger type and event
 */
export function getTriggerVariables(triggerType: TriggerType, event?: string): TriggerVariable[] {
  const typeVars = TRIGGER_VARIABLES[triggerType]
  if (!typeVars) return []

  // Return event-specific variables or default
  if (event && typeVars[event]) {
    return typeVars[event]
  }

  return typeVars.default || []
}

/**
 * Get variables grouped by category
 */
export function getVariablesByCategory(triggerType: TriggerType, event?: string): Record<string, TriggerVariable[]> {
  const variables = getTriggerVariables(triggerType, event)
  const grouped: Record<string, TriggerVariable[]> = {}

  for (const v of variables) {
    if (!grouped[v.category]) {
      grouped[v.category] = []
    }
    grouped[v.category].push(v)
  }

  return grouped
}

/**
 * Get all category names for variables
 */
export function getVariableCategories(triggerType: TriggerType, event?: string): string[] {
  const grouped = getVariablesByCategory(triggerType, event)
  return Object.keys(grouped)
}

/**
 * Format a variable placeholder for display
 */
export function formatVariablePlaceholder(variable: TriggerVariable): string {
  return `{{${variable.key}}}`
}

/**
 * Resolve variable placeholders in a string using payload data
 */
export function resolveVariables(template: string, payload: Record<string, unknown>, triggerType: TriggerType, event?: string): string {
  const variables = getTriggerVariables(triggerType, event)
  let result = template

  for (const variable of variables) {
    const placeholder = `{{${variable.key}}}`
    if (result.includes(placeholder)) {
      const value = getNestedValue(payload, variable.path)
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value ?? ''))
    }
  }

  return result
}

/**
 * Helper to get nested value from object using dot notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined

    // Handle array notation like contacts[0]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, key, index] = arrayMatch
      current = (current as Record<string, unknown>)[key]
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)]
      } else {
        return undefined
      }
    } else {
      current = (current as Record<string, unknown>)[part]
    }
  }

  return current
}
