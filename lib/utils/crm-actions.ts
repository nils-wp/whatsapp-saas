/**
 * CRM Actions Configuration
 * Defines all available actions for each CRM system (like n8n)
 */

import { z } from 'zod'
import type { TriggerType } from './validation'

// Action field types
export interface ActionField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'multi_select' | 'boolean' | 'json' | 'email' | 'phone' | 'url' | 'date' | 'datetime'
  required?: boolean
  placeholder?: string
  description?: string
  defaultValue?: unknown
  // For select types
  options?: 'dynamic' | Array<{ value: string; label: string }>
  // For dynamic options, specify what to fetch
  dynamicSource?: string
  // Conditional visibility
  showIf?: { field: string; value: unknown }
}

export interface CRMAction {
  value: string
  label: string
  description: string
  category: string
  // Fields required/optional for this action
  fields: ActionField[]
  // Output fields this action returns
  outputFields?: string[]
}

// All CRM actions organized by CRM type
export const CRM_ACTIONS: Record<TriggerType, CRMAction[]> = {
  webhook: [],

  // ==================== CLOSE CRM ACTIONS ====================
  close: [
    // Lead Actions
    {
      value: 'create_lead',
      label: 'Lead erstellen',
      description: 'Erstellt einen neuen Lead in Close',
      category: 'Leads',
      fields: [
        { key: 'name', label: 'Firmenname', type: 'text', required: true, placeholder: 'z.B. Acme GmbH' },
        { key: 'description', label: 'Beschreibung', type: 'textarea', placeholder: 'Lead-Beschreibung...' },
        { key: 'status_id', label: 'Status', type: 'select', options: 'dynamic', dynamicSource: 'lead_statuses' },
        { key: 'url', label: 'Website', type: 'url', placeholder: 'https://example.com' },
        { key: 'custom_fields', label: 'Custom Fields', type: 'json', description: 'Custom Fields als JSON' },
      ],
      outputFields: ['id', 'display_name', 'status_label'],
    },
    {
      value: 'update_lead',
      label: 'Lead aktualisieren',
      description: 'Aktualisiert einen bestehenden Lead',
      category: 'Leads',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true, placeholder: 'lead_xxx' },
        { key: 'name', label: 'Firmenname', type: 'text' },
        { key: 'description', label: 'Beschreibung', type: 'textarea' },
        { key: 'status_id', label: 'Status', type: 'select', options: 'dynamic', dynamicSource: 'lead_statuses' },
        { key: 'url', label: 'Website', type: 'url' },
        { key: 'custom_fields', label: 'Custom Fields', type: 'json' },
      ],
    },
    {
      value: 'get_lead',
      label: 'Lead abrufen',
      description: 'Ruft Lead-Details ab',
      category: 'Leads',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
      ],
    },
    {
      value: 'delete_lead',
      label: 'Lead löschen',
      description: 'Löscht einen Lead',
      category: 'Leads',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
      ],
    },
    {
      value: 'search_leads',
      label: 'Leads suchen',
      description: 'Sucht Leads nach Kriterien',
      category: 'Leads',
      fields: [
        { key: 'query', label: 'Suchbegriff', type: 'text', placeholder: 'z.B. company:"Acme"' },
        { key: 'limit', label: 'Limit', type: 'number', defaultValue: 25 },
      ],
    },
    // Contact Actions
    {
      value: 'create_contact',
      label: 'Kontakt erstellen',
      description: 'Erstellt einen neuen Kontakt unter einem Lead',
      category: 'Kontakte',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'title', label: 'Position', type: 'text', placeholder: 'z.B. CEO' },
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
      ],
    },
    {
      value: 'update_contact',
      label: 'Kontakt aktualisieren',
      description: 'Aktualisiert einen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'title', label: 'Position', type: 'text' },
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
      ],
    },
    {
      value: 'delete_contact',
      label: 'Kontakt löschen',
      description: 'Löscht einen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
      ],
    },
    // Opportunity Actions
    {
      value: 'create_opportunity',
      label: 'Opportunity erstellen',
      description: 'Erstellt eine neue Opportunity',
      category: 'Opportunities',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'note', label: 'Notiz', type: 'textarea' },
        { key: 'value', label: 'Wert', type: 'number' },
        { key: 'value_period', label: 'Wert-Periode', type: 'select', options: [
          { value: 'one_time', label: 'Einmalig' },
          { value: 'monthly', label: 'Monatlich' },
          { value: 'annual', label: 'Jährlich' },
        ]},
        { key: 'status_id', label: 'Status', type: 'select', options: 'dynamic', dynamicSource: 'opportunity_statuses' },
        { key: 'confidence', label: 'Wahrscheinlichkeit (%)', type: 'number', defaultValue: 50 },
        { key: 'date_won', label: 'Erwartetes Abschlussdatum', type: 'date' },
      ],
    },
    {
      value: 'update_opportunity',
      label: 'Opportunity aktualisieren',
      description: 'Aktualisiert eine Opportunity',
      category: 'Opportunities',
      fields: [
        { key: 'opportunity_id', label: 'Opportunity ID', type: 'text', required: true },
        { key: 'note', label: 'Notiz', type: 'textarea' },
        { key: 'value', label: 'Wert', type: 'number' },
        { key: 'status_id', label: 'Status', type: 'select', options: 'dynamic', dynamicSource: 'opportunity_statuses' },
        { key: 'confidence', label: 'Wahrscheinlichkeit (%)', type: 'number' },
      ],
    },
    {
      value: 'delete_opportunity',
      label: 'Opportunity löschen',
      description: 'Löscht eine Opportunity',
      category: 'Opportunities',
      fields: [
        { key: 'opportunity_id', label: 'Opportunity ID', type: 'text', required: true },
      ],
    },
    // Activity Actions
    {
      value: 'create_note',
      label: 'Notiz erstellen',
      description: 'Erstellt eine Notiz zu einem Lead',
      category: 'Aktivitäten',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'note', label: 'Notiz', type: 'textarea', required: true },
      ],
    },
    {
      value: 'create_call',
      label: 'Anruf protokollieren',
      description: 'Protokolliert einen Anruf',
      category: 'Aktivitäten',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
        { key: 'direction', label: 'Richtung', type: 'select', required: true, options: [
          { value: 'outbound', label: 'Ausgehend' },
          { value: 'inbound', label: 'Eingehend' },
        ]},
        { key: 'duration', label: 'Dauer (Sekunden)', type: 'number' },
        { key: 'note', label: 'Notiz', type: 'textarea' },
        { key: 'disposition', label: 'Ergebnis', type: 'select', options: [
          { value: 'answered', label: 'Angenommen' },
          { value: 'no_answer', label: 'Keine Antwort' },
          { value: 'busy', label: 'Besetzt' },
          { value: 'voicemail', label: 'Mailbox' },
        ]},
      ],
    },
    {
      value: 'create_sms',
      label: 'SMS protokollieren',
      description: 'Protokolliert eine SMS',
      category: 'Aktivitäten',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
        { key: 'direction', label: 'Richtung', type: 'select', required: true, options: [
          { value: 'outbound', label: 'Ausgehend' },
          { value: 'inbound', label: 'Eingehend' },
        ]},
        { key: 'text', label: 'Text', type: 'textarea', required: true },
        { key: 'local_phone', label: 'Lokale Nummer', type: 'phone' },
        { key: 'remote_phone', label: 'Empfänger-Nummer', type: 'phone', required: true },
      ],
    },
    {
      value: 'send_email',
      label: 'E-Mail senden',
      description: 'Sendet eine E-Mail über Close',
      category: 'Aktivitäten',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
        { key: 'to', label: 'An', type: 'email', required: true },
        { key: 'subject', label: 'Betreff', type: 'text', required: true },
        { key: 'body_text', label: 'Text', type: 'textarea', required: true },
        { key: 'body_html', label: 'HTML (optional)', type: 'textarea' },
        { key: 'template_id', label: 'Template', type: 'select', options: 'dynamic', dynamicSource: 'email_templates' },
      ],
    },
    // Task Actions
    {
      value: 'create_task',
      label: 'Aufgabe erstellen',
      description: 'Erstellt eine neue Aufgabe',
      category: 'Aufgaben',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'text', label: 'Beschreibung', type: 'text', required: true },
        { key: 'date', label: 'Fälligkeitsdatum', type: 'date', required: true },
        { key: 'assigned_to', label: 'Zugewiesen an', type: 'select', options: 'dynamic', dynamicSource: 'users' },
        { key: 'is_complete', label: 'Erledigt', type: 'boolean', defaultValue: false },
      ],
    },
    {
      value: 'update_task',
      label: 'Aufgabe aktualisieren',
      description: 'Aktualisiert eine Aufgabe',
      category: 'Aufgaben',
      fields: [
        { key: 'task_id', label: 'Aufgabe ID', type: 'text', required: true },
        { key: 'text', label: 'Beschreibung', type: 'text' },
        { key: 'date', label: 'Fälligkeitsdatum', type: 'date' },
        { key: 'is_complete', label: 'Erledigt', type: 'boolean' },
      ],
    },
    {
      value: 'delete_task',
      label: 'Aufgabe löschen',
      description: 'Löscht eine Aufgabe',
      category: 'Aufgaben',
      fields: [
        { key: 'task_id', label: 'Aufgabe ID', type: 'text', required: true },
      ],
    },
    // Custom Activity
    {
      value: 'create_custom_activity',
      label: 'Custom Activity erstellen',
      description: 'Erstellt eine benutzerdefinierte Aktivität',
      category: 'Custom',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'custom_activity_type_id', label: 'Aktivitäts-Typ', type: 'select', required: true, options: 'dynamic', dynamicSource: 'custom_activity_types' },
        { key: 'custom_fields', label: 'Custom Fields', type: 'json' },
      ],
    },
  ],

  // ==================== ACTIVECAMPAIGN ACTIONS ====================
  activecampaign: [
    // Contact Actions
    {
      value: 'create_contact',
      label: 'Kontakt erstellen',
      description: 'Erstellt einen neuen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'email', label: 'E-Mail', type: 'email', required: true },
        { key: 'firstName', label: 'Vorname', type: 'text' },
        { key: 'lastName', label: 'Nachname', type: 'text' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'fieldValues', label: 'Custom Fields', type: 'json', description: 'Format: [{"field": "1", "value": "Wert"}]' },
      ],
    },
    {
      value: 'update_contact',
      label: 'Kontakt aktualisieren',
      description: 'Aktualisiert einen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'firstName', label: 'Vorname', type: 'text' },
        { key: 'lastName', label: 'Nachname', type: 'text' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'fieldValues', label: 'Custom Fields', type: 'json' },
      ],
    },
    {
      value: 'get_contact',
      label: 'Kontakt abrufen',
      description: 'Ruft Kontakt-Details ab',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
      ],
    },
    {
      value: 'delete_contact',
      label: 'Kontakt löschen',
      description: 'Löscht einen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
      ],
    },
    {
      value: 'search_contacts',
      label: 'Kontakte suchen',
      description: 'Sucht Kontakte nach E-Mail',
      category: 'Kontakte',
      fields: [
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'firstName', label: 'Vorname', type: 'text' },
        { key: 'lastName', label: 'Nachname', type: 'text' },
      ],
    },
    // Tag Actions
    {
      value: 'add_tag',
      label: 'Tag hinzufügen',
      description: 'Fügt einem Kontakt einen Tag hinzu',
      category: 'Tags',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'tag_id', label: 'Tag', type: 'select', required: true, options: 'dynamic', dynamicSource: 'tags' },
      ],
    },
    {
      value: 'remove_tag',
      label: 'Tag entfernen',
      description: 'Entfernt einen Tag von einem Kontakt',
      category: 'Tags',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'tag_id', label: 'Tag', type: 'select', required: true, options: 'dynamic', dynamicSource: 'tags' },
      ],
    },
    {
      value: 'create_tag',
      label: 'Tag erstellen',
      description: 'Erstellt einen neuen Tag',
      category: 'Tags',
      fields: [
        { key: 'tag', label: 'Tag-Name', type: 'text', required: true },
        { key: 'tagType', label: 'Typ', type: 'select', options: [
          { value: 'contact', label: 'Kontakt' },
          { value: 'template', label: 'Template' },
        ]},
      ],
    },
    // List Actions
    {
      value: 'subscribe_to_list',
      label: 'Zu Liste hinzufügen',
      description: 'Fügt Kontakt einer Liste hinzu',
      category: 'Listen',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'list_id', label: 'Liste', type: 'select', required: true, options: 'dynamic', dynamicSource: 'lists' },
        { key: 'status', label: 'Status', type: 'select', defaultValue: '1', options: [
          { value: '1', label: 'Aktiv' },
          { value: '2', label: 'Unsubscribed' },
        ]},
      ],
    },
    {
      value: 'unsubscribe_from_list',
      label: 'Von Liste entfernen',
      description: 'Entfernt Kontakt von einer Liste',
      category: 'Listen',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'list_id', label: 'Liste', type: 'select', required: true, options: 'dynamic', dynamicSource: 'lists' },
      ],
    },
    // Deal Actions
    {
      value: 'create_deal',
      label: 'Deal erstellen',
      description: 'Erstellt einen neuen Deal',
      category: 'Deals',
      fields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'value', label: 'Wert', type: 'number', required: true },
        { key: 'currency', label: 'Währung', type: 'select', defaultValue: 'EUR', options: [
          { value: 'EUR', label: 'EUR' },
          { value: 'USD', label: 'USD' },
          { value: 'GBP', label: 'GBP' },
          { value: 'CHF', label: 'CHF' },
        ]},
        { key: 'pipeline_id', label: 'Pipeline', type: 'select', required: true, options: 'dynamic', dynamicSource: 'pipelines' },
        { key: 'stage_id', label: 'Stage', type: 'select', required: true, options: 'dynamic', dynamicSource: 'stages' },
        { key: 'owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'users' },
        { key: 'description', label: 'Beschreibung', type: 'textarea' },
      ],
    },
    {
      value: 'update_deal',
      label: 'Deal aktualisieren',
      description: 'Aktualisiert einen Deal',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
        { key: 'title', label: 'Titel', type: 'text' },
        { key: 'value', label: 'Wert', type: 'number' },
        { key: 'stage_id', label: 'Stage', type: 'select', options: 'dynamic', dynamicSource: 'stages' },
        { key: 'status', label: 'Status', type: 'select', options: [
          { value: '0', label: 'Offen' },
          { value: '1', label: 'Gewonnen' },
          { value: '2', label: 'Verloren' },
        ]},
      ],
    },
    {
      value: 'get_deal',
      label: 'Deal abrufen',
      description: 'Ruft Deal-Details ab',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
      ],
    },
    {
      value: 'delete_deal',
      label: 'Deal löschen',
      description: 'Löscht einen Deal',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
      ],
    },
    // Deal Notes
    {
      value: 'create_deal_note',
      label: 'Deal-Notiz erstellen',
      description: 'Fügt eine Notiz zu einem Deal hinzu',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
        { key: 'note', label: 'Notiz', type: 'textarea', required: true },
      ],
    },
    // Automation Actions
    {
      value: 'add_to_automation',
      label: 'Zu Automation hinzufügen',
      description: 'Fügt Kontakt einer Automation hinzu',
      category: 'Automations',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'automation_id', label: 'Automation', type: 'select', required: true, options: 'dynamic', dynamicSource: 'automations' },
      ],
    },
    {
      value: 'remove_from_automation',
      label: 'Von Automation entfernen',
      description: 'Entfernt Kontakt aus einer Automation',
      category: 'Automations',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'automation_id', label: 'Automation', type: 'select', required: true, options: 'dynamic', dynamicSource: 'automations' },
      ],
    },
    // Note Actions
    {
      value: 'create_note',
      label: 'Notiz erstellen',
      description: 'Erstellt eine Notiz für einen Kontakt',
      category: 'Notizen',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'note', label: 'Notiz', type: 'textarea', required: true },
      ],
    },
    // Task Actions
    {
      value: 'create_deal_task',
      label: 'Deal-Aufgabe erstellen',
      description: 'Erstellt eine Aufgabe für einen Deal',
      category: 'Aufgaben',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'duedate', label: 'Fälligkeitsdatum', type: 'datetime', required: true },
        { key: 'note', label: 'Notiz', type: 'textarea' },
        { key: 'assignee_id', label: 'Zugewiesen an', type: 'select', options: 'dynamic', dynamicSource: 'users' },
      ],
    },
  ],

  // ==================== PIPEDRIVE ACTIONS ====================
  pipedrive: [
    // Deal Actions
    {
      value: 'create_deal',
      label: 'Deal erstellen',
      description: 'Erstellt einen neuen Deal',
      category: 'Deals',
      fields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'value', label: 'Wert', type: 'number' },
        { key: 'currency', label: 'Währung', type: 'select', defaultValue: 'EUR', options: [
          { value: 'EUR', label: 'EUR' },
          { value: 'USD', label: 'USD' },
          { value: 'GBP', label: 'GBP' },
          { value: 'CHF', label: 'CHF' },
        ]},
        { key: 'person_id', label: 'Person', type: 'select', options: 'dynamic', dynamicSource: 'persons' },
        { key: 'org_id', label: 'Organisation', type: 'select', options: 'dynamic', dynamicSource: 'organizations' },
        { key: 'pipeline_id', label: 'Pipeline', type: 'select', options: 'dynamic', dynamicSource: 'pipelines' },
        { key: 'stage_id', label: 'Stage', type: 'select', options: 'dynamic', dynamicSource: 'stages' },
        { key: 'user_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'users' },
        { key: 'expected_close_date', label: 'Erwarteter Abschluss', type: 'date' },
        { key: 'probability', label: 'Wahrscheinlichkeit (%)', type: 'number' },
        { key: 'visible_to', label: 'Sichtbarkeit', type: 'select', options: [
          { value: '1', label: 'Nur Besitzer' },
          { value: '3', label: 'Ganzes Team' },
          { value: '5', label: 'Ganze Firma' },
        ]},
      ],
    },
    {
      value: 'update_deal',
      label: 'Deal aktualisieren',
      description: 'Aktualisiert einen Deal',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'number', required: true },
        { key: 'title', label: 'Titel', type: 'text' },
        { key: 'value', label: 'Wert', type: 'number' },
        { key: 'stage_id', label: 'Stage', type: 'select', options: 'dynamic', dynamicSource: 'stages' },
        { key: 'status', label: 'Status', type: 'select', options: [
          { value: 'open', label: 'Offen' },
          { value: 'won', label: 'Gewonnen' },
          { value: 'lost', label: 'Verloren' },
          { value: 'deleted', label: 'Gelöscht' },
        ]},
        { key: 'lost_reason', label: 'Verloren-Grund', type: 'text' },
      ],
    },
    {
      value: 'get_deal',
      label: 'Deal abrufen',
      description: 'Ruft Deal-Details ab',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'number', required: true },
      ],
    },
    {
      value: 'delete_deal',
      label: 'Deal löschen',
      description: 'Löscht einen Deal',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'number', required: true },
      ],
    },
    {
      value: 'search_deals',
      label: 'Deals suchen',
      description: 'Sucht Deals',
      category: 'Deals',
      fields: [
        { key: 'term', label: 'Suchbegriff', type: 'text', required: true },
        { key: 'limit', label: 'Limit', type: 'number', defaultValue: 25 },
      ],
    },
    // Person Actions
    {
      value: 'create_person',
      label: 'Person erstellen',
      description: 'Erstellt eine neue Person',
      category: 'Personen',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'org_id', label: 'Organisation', type: 'select', options: 'dynamic', dynamicSource: 'organizations' },
        { key: 'owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'users' },
        { key: 'visible_to', label: 'Sichtbarkeit', type: 'select', options: [
          { value: '1', label: 'Nur Besitzer' },
          { value: '3', label: 'Ganzes Team' },
          { value: '5', label: 'Ganze Firma' },
        ]},
      ],
    },
    {
      value: 'update_person',
      label: 'Person aktualisieren',
      description: 'Aktualisiert eine Person',
      category: 'Personen',
      fields: [
        { key: 'person_id', label: 'Person ID', type: 'number', required: true },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'org_id', label: 'Organisation', type: 'select', options: 'dynamic', dynamicSource: 'organizations' },
      ],
    },
    {
      value: 'get_person',
      label: 'Person abrufen',
      description: 'Ruft Person-Details ab',
      category: 'Personen',
      fields: [
        { key: 'person_id', label: 'Person ID', type: 'number', required: true },
      ],
    },
    {
      value: 'delete_person',
      label: 'Person löschen',
      description: 'Löscht eine Person',
      category: 'Personen',
      fields: [
        { key: 'person_id', label: 'Person ID', type: 'number', required: true },
      ],
    },
    {
      value: 'search_persons',
      label: 'Personen suchen',
      description: 'Sucht Personen',
      category: 'Personen',
      fields: [
        { key: 'term', label: 'Suchbegriff', type: 'text', required: true },
        { key: 'search_by_email', label: 'Per E-Mail', type: 'boolean', defaultValue: true },
        { key: 'limit', label: 'Limit', type: 'number', defaultValue: 25 },
      ],
    },
    // Organization Actions
    {
      value: 'create_organization',
      label: 'Organisation erstellen',
      description: 'Erstellt eine neue Organisation',
      category: 'Organisationen',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'users' },
        { key: 'address', label: 'Adresse', type: 'text' },
        { key: 'visible_to', label: 'Sichtbarkeit', type: 'select', options: [
          { value: '1', label: 'Nur Besitzer' },
          { value: '3', label: 'Ganzes Team' },
          { value: '5', label: 'Ganze Firma' },
        ]},
      ],
    },
    {
      value: 'update_organization',
      label: 'Organisation aktualisieren',
      description: 'Aktualisiert eine Organisation',
      category: 'Organisationen',
      fields: [
        { key: 'org_id', label: 'Organisation ID', type: 'number', required: true },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'address', label: 'Adresse', type: 'text' },
      ],
    },
    {
      value: 'get_organization',
      label: 'Organisation abrufen',
      description: 'Ruft Organisations-Details ab',
      category: 'Organisationen',
      fields: [
        { key: 'org_id', label: 'Organisation ID', type: 'number', required: true },
      ],
    },
    {
      value: 'delete_organization',
      label: 'Organisation löschen',
      description: 'Löscht eine Organisation',
      category: 'Organisationen',
      fields: [
        { key: 'org_id', label: 'Organisation ID', type: 'number', required: true },
      ],
    },
    // Activity Actions
    {
      value: 'create_activity',
      label: 'Aktivität erstellen',
      description: 'Erstellt eine neue Aktivität',
      category: 'Aktivitäten',
      fields: [
        { key: 'type', label: 'Typ', type: 'select', required: true, options: [
          { value: 'call', label: 'Anruf' },
          { value: 'meeting', label: 'Meeting' },
          { value: 'task', label: 'Aufgabe' },
          { value: 'deadline', label: 'Deadline' },
          { value: 'email', label: 'E-Mail' },
          { value: 'lunch', label: 'Mittagessen' },
        ]},
        { key: 'subject', label: 'Betreff', type: 'text', required: true },
        { key: 'deal_id', label: 'Deal', type: 'select', options: 'dynamic', dynamicSource: 'deals' },
        { key: 'person_id', label: 'Person', type: 'select', options: 'dynamic', dynamicSource: 'persons' },
        { key: 'org_id', label: 'Organisation', type: 'select', options: 'dynamic', dynamicSource: 'organizations' },
        { key: 'due_date', label: 'Fälligkeitsdatum', type: 'date', required: true },
        { key: 'due_time', label: 'Uhrzeit', type: 'text', placeholder: 'HH:MM' },
        { key: 'duration', label: 'Dauer (Minuten)', type: 'number' },
        { key: 'note', label: 'Notiz', type: 'textarea' },
        { key: 'user_id', label: 'Zugewiesen an', type: 'select', options: 'dynamic', dynamicSource: 'users' },
        { key: 'done', label: 'Erledigt', type: 'boolean', defaultValue: false },
      ],
    },
    {
      value: 'update_activity',
      label: 'Aktivität aktualisieren',
      description: 'Aktualisiert eine Aktivität',
      category: 'Aktivitäten',
      fields: [
        { key: 'activity_id', label: 'Aktivität ID', type: 'number', required: true },
        { key: 'subject', label: 'Betreff', type: 'text' },
        { key: 'done', label: 'Erledigt', type: 'boolean' },
        { key: 'due_date', label: 'Fälligkeitsdatum', type: 'date' },
        { key: 'note', label: 'Notiz', type: 'textarea' },
      ],
    },
    {
      value: 'delete_activity',
      label: 'Aktivität löschen',
      description: 'Löscht eine Aktivität',
      category: 'Aktivitäten',
      fields: [
        { key: 'activity_id', label: 'Aktivität ID', type: 'number', required: true },
      ],
    },
    // Note Actions
    {
      value: 'create_note',
      label: 'Notiz erstellen',
      description: 'Erstellt eine Notiz',
      category: 'Notizen',
      fields: [
        { key: 'content', label: 'Inhalt', type: 'textarea', required: true },
        { key: 'deal_id', label: 'Deal', type: 'select', options: 'dynamic', dynamicSource: 'deals' },
        { key: 'person_id', label: 'Person', type: 'select', options: 'dynamic', dynamicSource: 'persons' },
        { key: 'org_id', label: 'Organisation', type: 'select', options: 'dynamic', dynamicSource: 'organizations' },
        { key: 'pinned_to_deal_flag', label: 'An Deal anheften', type: 'boolean' },
        { key: 'pinned_to_person_flag', label: 'An Person anheften', type: 'boolean' },
        { key: 'pinned_to_organization_flag', label: 'An Organisation anheften', type: 'boolean' },
      ],
    },
    {
      value: 'update_note',
      label: 'Notiz aktualisieren',
      description: 'Aktualisiert eine Notiz',
      category: 'Notizen',
      fields: [
        { key: 'note_id', label: 'Notiz ID', type: 'number', required: true },
        { key: 'content', label: 'Inhalt', type: 'textarea' },
      ],
    },
    {
      value: 'delete_note',
      label: 'Notiz löschen',
      description: 'Löscht eine Notiz',
      category: 'Notizen',
      fields: [
        { key: 'note_id', label: 'Notiz ID', type: 'number', required: true },
      ],
    },
    // Product Actions
    {
      value: 'add_product_to_deal',
      label: 'Produkt zu Deal hinzufügen',
      description: 'Fügt ein Produkt zu einem Deal hinzu',
      category: 'Produkte',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'number', required: true },
        { key: 'product_id', label: 'Produkt', type: 'select', required: true, options: 'dynamic', dynamicSource: 'products' },
        { key: 'item_price', label: 'Preis', type: 'number', required: true },
        { key: 'quantity', label: 'Menge', type: 'number', defaultValue: 1 },
        { key: 'discount_percentage', label: 'Rabatt (%)', type: 'number', defaultValue: 0 },
      ],
    },
    // Lead Actions
    {
      value: 'create_lead',
      label: 'Lead erstellen',
      description: 'Erstellt einen neuen Lead',
      category: 'Leads',
      fields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'person_id', label: 'Person', type: 'select', options: 'dynamic', dynamicSource: 'persons' },
        { key: 'organization_id', label: 'Organisation', type: 'select', options: 'dynamic', dynamicSource: 'organizations' },
        { key: 'value', label: 'Wert', type: 'number' },
        { key: 'expected_close_date', label: 'Erwarteter Abschluss', type: 'date' },
        { key: 'owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'users' },
      ],
    },
    {
      value: 'update_lead',
      label: 'Lead aktualisieren',
      description: 'Aktualisiert einen Lead',
      category: 'Leads',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
        { key: 'title', label: 'Titel', type: 'text' },
        { key: 'value', label: 'Wert', type: 'number' },
      ],
    },
    {
      value: 'delete_lead',
      label: 'Lead löschen',
      description: 'Löscht einen Lead',
      category: 'Leads',
      fields: [
        { key: 'lead_id', label: 'Lead ID', type: 'text', required: true },
      ],
    },
  ],

  // ==================== HUBSPOT ACTIONS ====================
  hubspot: [
    // Contact Actions
    {
      value: 'create_contact',
      label: 'Kontakt erstellen',
      description: 'Erstellt einen neuen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'email', label: 'E-Mail', type: 'email', required: true },
        { key: 'firstname', label: 'Vorname', type: 'text' },
        { key: 'lastname', label: 'Nachname', type: 'text' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'company', label: 'Firma', type: 'text' },
        { key: 'jobtitle', label: 'Position', type: 'text' },
        { key: 'lifecyclestage', label: 'Lifecycle Stage', type: 'select', options: [
          { value: 'subscriber', label: 'Subscriber' },
          { value: 'lead', label: 'Lead' },
          { value: 'marketingqualifiedlead', label: 'Marketing Qualified Lead' },
          { value: 'salesqualifiedlead', label: 'Sales Qualified Lead' },
          { value: 'opportunity', label: 'Opportunity' },
          { value: 'customer', label: 'Customer' },
          { value: 'evangelist', label: 'Evangelist' },
        ]},
        { key: 'hs_lead_status', label: 'Lead-Status', type: 'select', options: 'dynamic', dynamicSource: 'lead_statuses' },
        { key: 'hubspot_owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'owners' },
      ],
    },
    {
      value: 'update_contact',
      label: 'Kontakt aktualisieren',
      description: 'Aktualisiert einen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'firstname', label: 'Vorname', type: 'text' },
        { key: 'lastname', label: 'Nachname', type: 'text' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'lifecyclestage', label: 'Lifecycle Stage', type: 'select', options: [
          { value: 'subscriber', label: 'Subscriber' },
          { value: 'lead', label: 'Lead' },
          { value: 'marketingqualifiedlead', label: 'Marketing Qualified Lead' },
          { value: 'salesqualifiedlead', label: 'Sales Qualified Lead' },
          { value: 'opportunity', label: 'Opportunity' },
          { value: 'customer', label: 'Customer' },
        ]},
      ],
    },
    {
      value: 'get_contact',
      label: 'Kontakt abrufen',
      description: 'Ruft Kontakt-Details ab',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
        { key: 'properties', label: 'Eigenschaften', type: 'text', placeholder: 'z.B. firstname,lastname,email', description: 'Komma-getrennte Liste' },
      ],
    },
    {
      value: 'delete_contact',
      label: 'Kontakt löschen',
      description: 'Löscht einen Kontakt',
      category: 'Kontakte',
      fields: [
        { key: 'contact_id', label: 'Kontakt ID', type: 'text', required: true },
      ],
    },
    {
      value: 'search_contacts',
      label: 'Kontakte suchen',
      description: 'Sucht Kontakte',
      category: 'Kontakte',
      fields: [
        { key: 'email', label: 'E-Mail', type: 'email' },
        { key: 'query', label: 'Suchbegriff', type: 'text' },
        { key: 'limit', label: 'Limit', type: 'number', defaultValue: 10 },
      ],
    },
    // Company Actions
    {
      value: 'create_company',
      label: 'Unternehmen erstellen',
      description: 'Erstellt ein neues Unternehmen',
      category: 'Unternehmen',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'domain', label: 'Domain', type: 'url' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'industry', label: 'Branche', type: 'text' },
        { key: 'numberofemployees', label: 'Mitarbeiter', type: 'number' },
        { key: 'annualrevenue', label: 'Jahresumsatz', type: 'number' },
        { key: 'city', label: 'Stadt', type: 'text' },
        { key: 'country', label: 'Land', type: 'text' },
        { key: 'hubspot_owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'owners' },
      ],
    },
    {
      value: 'update_company',
      label: 'Unternehmen aktualisieren',
      description: 'Aktualisiert ein Unternehmen',
      category: 'Unternehmen',
      fields: [
        { key: 'company_id', label: 'Unternehmen ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'domain', label: 'Domain', type: 'url' },
        { key: 'phone', label: 'Telefon', type: 'phone' },
        { key: 'industry', label: 'Branche', type: 'text' },
      ],
    },
    {
      value: 'get_company',
      label: 'Unternehmen abrufen',
      description: 'Ruft Unternehmens-Details ab',
      category: 'Unternehmen',
      fields: [
        { key: 'company_id', label: 'Unternehmen ID', type: 'text', required: true },
      ],
    },
    {
      value: 'delete_company',
      label: 'Unternehmen löschen',
      description: 'Löscht ein Unternehmen',
      category: 'Unternehmen',
      fields: [
        { key: 'company_id', label: 'Unternehmen ID', type: 'text', required: true },
      ],
    },
    // Deal Actions
    {
      value: 'create_deal',
      label: 'Deal erstellen',
      description: 'Erstellt einen neuen Deal',
      category: 'Deals',
      fields: [
        { key: 'dealname', label: 'Name', type: 'text', required: true },
        { key: 'amount', label: 'Betrag', type: 'number' },
        { key: 'pipeline', label: 'Pipeline', type: 'select', required: true, options: 'dynamic', dynamicSource: 'pipelines' },
        { key: 'dealstage', label: 'Stage', type: 'select', required: true, options: 'dynamic', dynamicSource: 'deal_stages' },
        { key: 'closedate', label: 'Abschlussdatum', type: 'date' },
        { key: 'hubspot_owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'owners' },
        { key: 'description', label: 'Beschreibung', type: 'textarea' },
        { key: 'hs_priority', label: 'Priorität', type: 'select', options: [
          { value: 'low', label: 'Niedrig' },
          { value: 'medium', label: 'Mittel' },
          { value: 'high', label: 'Hoch' },
        ]},
      ],
    },
    {
      value: 'update_deal',
      label: 'Deal aktualisieren',
      description: 'Aktualisiert einen Deal',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
        { key: 'dealname', label: 'Name', type: 'text' },
        { key: 'amount', label: 'Betrag', type: 'number' },
        { key: 'dealstage', label: 'Stage', type: 'select', options: 'dynamic', dynamicSource: 'deal_stages' },
        { key: 'closedate', label: 'Abschlussdatum', type: 'date' },
      ],
    },
    {
      value: 'get_deal',
      label: 'Deal abrufen',
      description: 'Ruft Deal-Details ab',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
      ],
    },
    {
      value: 'delete_deal',
      label: 'Deal löschen',
      description: 'Löscht einen Deal',
      category: 'Deals',
      fields: [
        { key: 'deal_id', label: 'Deal ID', type: 'text', required: true },
      ],
    },
    {
      value: 'search_deals',
      label: 'Deals suchen',
      description: 'Sucht Deals',
      category: 'Deals',
      fields: [
        { key: 'query', label: 'Suchbegriff', type: 'text' },
        { key: 'limit', label: 'Limit', type: 'number', defaultValue: 10 },
      ],
    },
    // Ticket Actions
    {
      value: 'create_ticket',
      label: 'Ticket erstellen',
      description: 'Erstellt ein neues Ticket',
      category: 'Tickets',
      fields: [
        { key: 'subject', label: 'Betreff', type: 'text', required: true },
        { key: 'content', label: 'Beschreibung', type: 'textarea' },
        { key: 'hs_pipeline', label: 'Pipeline', type: 'select', options: 'dynamic', dynamicSource: 'ticket_pipelines' },
        { key: 'hs_pipeline_stage', label: 'Status', type: 'select', options: 'dynamic', dynamicSource: 'ticket_stages' },
        { key: 'hs_ticket_priority', label: 'Priorität', type: 'select', options: [
          { value: 'LOW', label: 'Niedrig' },
          { value: 'MEDIUM', label: 'Mittel' },
          { value: 'HIGH', label: 'Hoch' },
        ]},
        { key: 'hubspot_owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'owners' },
      ],
    },
    {
      value: 'update_ticket',
      label: 'Ticket aktualisieren',
      description: 'Aktualisiert ein Ticket',
      category: 'Tickets',
      fields: [
        { key: 'ticket_id', label: 'Ticket ID', type: 'text', required: true },
        { key: 'subject', label: 'Betreff', type: 'text' },
        { key: 'content', label: 'Beschreibung', type: 'textarea' },
        { key: 'hs_pipeline_stage', label: 'Status', type: 'select', options: 'dynamic', dynamicSource: 'ticket_stages' },
      ],
    },
    {
      value: 'delete_ticket',
      label: 'Ticket löschen',
      description: 'Löscht ein Ticket',
      category: 'Tickets',
      fields: [
        { key: 'ticket_id', label: 'Ticket ID', type: 'text', required: true },
      ],
    },
    // Engagement Actions
    {
      value: 'create_note',
      label: 'Notiz erstellen',
      description: 'Erstellt eine Notiz',
      category: 'Aktivitäten',
      fields: [
        { key: 'body', label: 'Inhalt', type: 'textarea', required: true },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
        { key: 'company_id', label: 'Unternehmen ID', type: 'text' },
        { key: 'deal_id', label: 'Deal ID', type: 'text' },
        { key: 'ticket_id', label: 'Ticket ID', type: 'text' },
      ],
    },
    {
      value: 'create_task',
      label: 'Aufgabe erstellen',
      description: 'Erstellt eine Aufgabe',
      category: 'Aktivitäten',
      fields: [
        { key: 'subject', label: 'Betreff', type: 'text', required: true },
        { key: 'body', label: 'Beschreibung', type: 'textarea' },
        { key: 'due_date', label: 'Fälligkeitsdatum', type: 'datetime', required: true },
        { key: 'priority', label: 'Priorität', type: 'select', options: [
          { value: 'LOW', label: 'Niedrig' },
          { value: 'MEDIUM', label: 'Mittel' },
          { value: 'HIGH', label: 'Hoch' },
        ]},
        { key: 'status', label: 'Status', type: 'select', options: [
          { value: 'NOT_STARTED', label: 'Nicht gestartet' },
          { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
          { value: 'COMPLETED', label: 'Erledigt' },
        ]},
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
        { key: 'hubspot_owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'owners' },
      ],
    },
    {
      value: 'log_call',
      label: 'Anruf protokollieren',
      description: 'Protokolliert einen Anruf',
      category: 'Aktivitäten',
      fields: [
        { key: 'body', label: 'Notiz', type: 'textarea', required: true },
        { key: 'direction', label: 'Richtung', type: 'select', required: true, options: [
          { value: 'INBOUND', label: 'Eingehend' },
          { value: 'OUTBOUND', label: 'Ausgehend' },
        ]},
        { key: 'disposition', label: 'Ergebnis', type: 'select', options: [
          { value: 'CONNECTED', label: 'Verbunden' },
          { value: 'BUSY', label: 'Besetzt' },
          { value: 'NO_ANSWER', label: 'Keine Antwort' },
          { value: 'LEFT_VOICEMAIL', label: 'Mailbox' },
          { value: 'WRONG_NUMBER', label: 'Falsche Nummer' },
        ]},
        { key: 'duration_ms', label: 'Dauer (ms)', type: 'number' },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
      ],
    },
    {
      value: 'send_email',
      label: 'E-Mail senden',
      description: 'Sendet eine E-Mail',
      category: 'Aktivitäten',
      fields: [
        { key: 'to', label: 'An', type: 'email', required: true },
        { key: 'subject', label: 'Betreff', type: 'text', required: true },
        { key: 'body', label: 'Inhalt', type: 'textarea', required: true },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
      ],
    },
    // Meeting Actions
    {
      value: 'create_meeting',
      label: 'Meeting erstellen',
      description: 'Erstellt ein Meeting',
      category: 'Aktivitäten',
      fields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'body', label: 'Beschreibung', type: 'textarea' },
        { key: 'start_time', label: 'Startzeit', type: 'datetime', required: true },
        { key: 'end_time', label: 'Endzeit', type: 'datetime', required: true },
        { key: 'contact_id', label: 'Kontakt ID', type: 'text' },
        { key: 'hubspot_owner_id', label: 'Besitzer', type: 'select', options: 'dynamic', dynamicSource: 'owners' },
      ],
    },
    // Association Actions
    {
      value: 'associate_objects',
      label: 'Objekte verknüpfen',
      description: 'Verknüpft zwei Objekte',
      category: 'Verknüpfungen',
      fields: [
        { key: 'from_object_type', label: 'Von Objekt-Typ', type: 'select', required: true, options: [
          { value: 'contacts', label: 'Kontakt' },
          { value: 'companies', label: 'Unternehmen' },
          { value: 'deals', label: 'Deal' },
          { value: 'tickets', label: 'Ticket' },
        ]},
        { key: 'from_object_id', label: 'Von Objekt ID', type: 'text', required: true },
        { key: 'to_object_type', label: 'Zu Objekt-Typ', type: 'select', required: true, options: [
          { value: 'contacts', label: 'Kontakt' },
          { value: 'companies', label: 'Unternehmen' },
          { value: 'deals', label: 'Deal' },
          { value: 'tickets', label: 'Ticket' },
        ]},
        { key: 'to_object_id', label: 'Zu Objekt ID', type: 'text', required: true },
      ],
    },
  ],

  // ==================== MONDAY.COM ACTIONS ====================
  monday: [
    // Item Actions
    {
      value: 'create_item',
      label: 'Item erstellen',
      description: 'Erstellt ein neues Item in einem Board',
      category: 'Items',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'group_id', label: 'Gruppe', type: 'select', required: true, options: 'dynamic', dynamicSource: 'groups' },
        { key: 'item_name', label: 'Name', type: 'text', required: true },
        { key: 'column_values', label: 'Spalten-Werte', type: 'json', description: 'JSON-Objekt mit Spalten-Werten' },
      ],
    },
    {
      value: 'update_item',
      label: 'Item aktualisieren',
      description: 'Aktualisiert ein Item',
      category: 'Items',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'column_values', label: 'Spalten-Werte', type: 'json', description: 'JSON-Objekt mit zu aktualisierenden Werten' },
      ],
    },
    {
      value: 'get_item',
      label: 'Item abrufen',
      description: 'Ruft Item-Details ab',
      category: 'Items',
      fields: [
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
      ],
    },
    {
      value: 'delete_item',
      label: 'Item löschen',
      description: 'Löscht ein Item',
      category: 'Items',
      fields: [
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
      ],
    },
    {
      value: 'archive_item',
      label: 'Item archivieren',
      description: 'Archiviert ein Item',
      category: 'Items',
      fields: [
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
      ],
    },
    {
      value: 'duplicate_item',
      label: 'Item duplizieren',
      description: 'Dupliziert ein Item',
      category: 'Items',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'with_updates', label: 'Mit Updates', type: 'boolean', defaultValue: false },
      ],
    },
    {
      value: 'move_item_to_group',
      label: 'Item in Gruppe verschieben',
      description: 'Verschiebt ein Item in eine andere Gruppe',
      category: 'Items',
      fields: [
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'group_id', label: 'Ziel-Gruppe', type: 'select', required: true, options: 'dynamic', dynamicSource: 'groups' },
      ],
    },
    {
      value: 'move_item_to_board',
      label: 'Item zu Board verschieben',
      description: 'Verschiebt ein Item zu einem anderen Board',
      category: 'Items',
      fields: [
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'board_id', label: 'Ziel-Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'group_id', label: 'Ziel-Gruppe', type: 'select', required: true, options: 'dynamic', dynamicSource: 'groups' },
      ],
    },
    // Column Actions
    {
      value: 'change_column_value',
      label: 'Spalten-Wert ändern',
      description: 'Ändert den Wert einer Spalte',
      category: 'Spalten',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'column_id', label: 'Spalte', type: 'select', required: true, options: 'dynamic', dynamicSource: 'columns' },
        { key: 'value', label: 'Wert', type: 'json', required: true, description: 'Wert im Monday.com JSON-Format' },
      ],
    },
    {
      value: 'change_status',
      label: 'Status ändern',
      description: 'Ändert den Status eines Items',
      category: 'Spalten',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'column_id', label: 'Status-Spalte', type: 'select', required: true, options: 'dynamic', dynamicSource: 'status_columns' },
        { key: 'label', label: 'Status-Label', type: 'text', required: true, placeholder: 'z.B. "Done", "Working on it"' },
      ],
    },
    {
      value: 'assign_person',
      label: 'Person zuweisen',
      description: 'Weist eine Person einem Item zu',
      category: 'Spalten',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'column_id', label: 'Personen-Spalte', type: 'select', required: true, options: 'dynamic', dynamicSource: 'people_columns' },
        { key: 'person_id', label: 'Person', type: 'select', required: true, options: 'dynamic', dynamicSource: 'users' },
      ],
    },
    {
      value: 'set_date',
      label: 'Datum setzen',
      description: 'Setzt einen Datumswert',
      category: 'Spalten',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'column_id', label: 'Datum-Spalte', type: 'select', required: true, options: 'dynamic', dynamicSource: 'date_columns' },
        { key: 'date', label: 'Datum', type: 'date', required: true },
      ],
    },
    // Subitem Actions
    {
      value: 'create_subitem',
      label: 'Subitem erstellen',
      description: 'Erstellt ein Subitem',
      category: 'Subitems',
      fields: [
        { key: 'parent_item_id', label: 'Eltern-Item ID', type: 'number', required: true },
        { key: 'item_name', label: 'Name', type: 'text', required: true },
        { key: 'column_values', label: 'Spalten-Werte', type: 'json' },
      ],
    },
    // Update Actions
    {
      value: 'create_update',
      label: 'Update/Kommentar erstellen',
      description: 'Erstellt ein Update (Kommentar) zu einem Item',
      category: 'Updates',
      fields: [
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'body', label: 'Inhalt', type: 'textarea', required: true },
      ],
    },
    {
      value: 'reply_to_update',
      label: 'Auf Update antworten',
      description: 'Antwortet auf ein Update',
      category: 'Updates',
      fields: [
        { key: 'update_id', label: 'Update ID', type: 'number', required: true },
        { key: 'body', label: 'Antwort', type: 'textarea', required: true },
      ],
    },
    {
      value: 'delete_update',
      label: 'Update löschen',
      description: 'Löscht ein Update',
      category: 'Updates',
      fields: [
        { key: 'update_id', label: 'Update ID', type: 'number', required: true },
      ],
    },
    // Group Actions
    {
      value: 'create_group',
      label: 'Gruppe erstellen',
      description: 'Erstellt eine neue Gruppe in einem Board',
      category: 'Gruppen',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'group_name', label: 'Name', type: 'text', required: true },
      ],
    },
    {
      value: 'duplicate_group',
      label: 'Gruppe duplizieren',
      description: 'Dupliziert eine Gruppe',
      category: 'Gruppen',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'group_id', label: 'Gruppe', type: 'select', required: true, options: 'dynamic', dynamicSource: 'groups' },
        { key: 'add_to_top', label: 'Oben hinzufügen', type: 'boolean', defaultValue: false },
      ],
    },
    {
      value: 'archive_group',
      label: 'Gruppe archivieren',
      description: 'Archiviert eine Gruppe',
      category: 'Gruppen',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'group_id', label: 'Gruppe', type: 'select', required: true, options: 'dynamic', dynamicSource: 'groups' },
      ],
    },
    {
      value: 'delete_group',
      label: 'Gruppe löschen',
      description: 'Löscht eine Gruppe',
      category: 'Gruppen',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'group_id', label: 'Gruppe', type: 'select', required: true, options: 'dynamic', dynamicSource: 'groups' },
      ],
    },
    // Board Actions
    {
      value: 'get_board',
      label: 'Board abrufen',
      description: 'Ruft Board-Details ab',
      category: 'Boards',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
      ],
    },
    {
      value: 'get_board_items',
      label: 'Board-Items abrufen',
      description: 'Ruft alle Items eines Boards ab',
      category: 'Boards',
      fields: [
        { key: 'board_id', label: 'Board', type: 'select', required: true, options: 'dynamic', dynamicSource: 'boards' },
        { key: 'limit', label: 'Limit', type: 'number', defaultValue: 25 },
      ],
    },
    // File Actions
    {
      value: 'add_file_to_column',
      label: 'Datei zu Spalte hinzufügen',
      description: 'Fügt eine Datei zu einer Datei-Spalte hinzu',
      category: 'Dateien',
      fields: [
        { key: 'item_id', label: 'Item ID', type: 'number', required: true },
        { key: 'column_id', label: 'Datei-Spalte', type: 'select', required: true, options: 'dynamic', dynamicSource: 'file_columns' },
        { key: 'file_url', label: 'Datei-URL', type: 'url', required: true },
      ],
    },
    {
      value: 'add_file_to_update',
      label: 'Datei zu Update hinzufügen',
      description: 'Fügt eine Datei zu einem Update hinzu',
      category: 'Dateien',
      fields: [
        { key: 'update_id', label: 'Update ID', type: 'number', required: true },
        { key: 'file_url', label: 'Datei-URL', type: 'url', required: true },
      ],
    },
  ],
}

// Helper to get action categories for a CRM
export function getActionCategories(crmType: TriggerType): string[] {
  const actions = CRM_ACTIONS[crmType] || []
  return [...new Set(actions.map(a => a.category))]
}

// Helper to get actions by category
export function getActionsByCategory(crmType: TriggerType, category: string): CRMAction[] {
  const actions = CRM_ACTIONS[crmType] || []
  return actions.filter(a => a.category === category)
}

// Zod schema for action configuration
export const actionConfigSchema = z.object({
  crm_type: z.enum(['close', 'activecampaign', 'pipedrive', 'hubspot', 'monday']),
  action: z.string(),
  fields: z.record(z.string(), z.unknown()),
})

export type ActionConfig = z.infer<typeof actionConfigSchema>
