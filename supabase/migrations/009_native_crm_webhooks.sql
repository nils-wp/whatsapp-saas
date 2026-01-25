-- ===========================================
-- Migration: Native CRM Webhooks & Polling
-- Erweitert Trigger-System für automatische Webhook-Registrierung
-- und Polling-basierte CRM-Integration (wie n8n)
-- ===========================================

-- Neue Spalten für native Webhook-Registrierung auf triggers
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS crm_webhook_id TEXT;
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS crm_webhook_status TEXT;
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS crm_webhook_error TEXT;
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS crm_webhook_registered_at TIMESTAMPTZ;

-- Polling-Unterstützung für CRMs ohne native Webhooks
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS polling_enabled BOOLEAN DEFAULT false;
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ;
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS polling_cursor TEXT;

-- Constraint für crm_webhook_status
ALTER TABLE triggers DROP CONSTRAINT IF EXISTS triggers_crm_webhook_status_check;
ALTER TABLE triggers ADD CONSTRAINT triggers_crm_webhook_status_check
  CHECK (crm_webhook_status IS NULL OR crm_webhook_status IN ('pending', 'active', 'failed', 'not_supported'));

-- Conversations: Vor-/Nachname getrennt speichern (für CRM-Sync)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS contact_first_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS contact_last_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS crm_contact_id TEXT;

-- Index für Polling-Abfragen (aktive Trigger mit Polling)
CREATE INDEX IF NOT EXISTS idx_triggers_polling
  ON triggers (tenant_id, is_active, polling_enabled)
  WHERE polling_enabled = true AND is_active = true;

-- Index für CRM-Contact-Lookup
CREATE INDEX IF NOT EXISTS idx_conversations_crm_contact
  ON conversations (tenant_id, crm_contact_id)
  WHERE crm_contact_id IS NOT NULL;

-- Tabelle für Test-Mode Events (wie n8n "Listening for test event")
CREATE TABLE IF NOT EXISTS crm_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES triggers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  extracted_data JSONB,
  is_test_event BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS für crm_webhook_events
ALTER TABLE crm_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_webhook_events_tenant_isolation" ON crm_webhook_events
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

-- Index für Test-Events Abfrage
CREATE INDEX IF NOT EXISTS idx_crm_webhook_events_test
  ON crm_webhook_events (trigger_id, is_test_event, created_at DESC)
  WHERE is_test_event = true;

-- Index für Event-Processing
CREATE INDEX IF NOT EXISTS idx_crm_webhook_events_unprocessed
  ON crm_webhook_events (trigger_id, created_at)
  WHERE processed_at IS NULL;

-- Kommentare für Dokumentation
COMMENT ON COLUMN triggers.crm_webhook_id IS 'ID des bei CRM registrierten Webhooks (Pipedrive, Monday)';
COMMENT ON COLUMN triggers.crm_webhook_status IS 'Status der Webhook-Registrierung: pending, active, failed, not_supported';
COMMENT ON COLUMN triggers.crm_webhook_error IS 'Fehlermeldung bei fehlgeschlagener Registrierung';
COMMENT ON COLUMN triggers.polling_enabled IS 'True für CRMs ohne native Webhooks (HubSpot, Close, ActiveCampaign)';
COMMENT ON COLUMN triggers.last_polled_at IS 'Zeitpunkt der letzten Polling-Abfrage';
COMMENT ON COLUMN triggers.polling_cursor IS 'Cursor/Token für inkrementelles Polling';
COMMENT ON COLUMN conversations.contact_first_name IS 'Vorname aus CRM-Daten';
COMMENT ON COLUMN conversations.contact_last_name IS 'Nachname aus CRM-Daten';
COMMENT ON COLUMN conversations.crm_contact_id IS 'ID des Kontakts im CRM-System';
COMMENT ON TABLE crm_webhook_events IS 'Speichert CRM-Webhook-Events für Test-Mode und Debugging';
