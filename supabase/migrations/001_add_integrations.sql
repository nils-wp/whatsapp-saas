-- ===========================================
-- Tenant Integrations Table
-- Speichert CRM Credentials pro Tenant (verschlüsselt)
-- ===========================================

CREATE TABLE IF NOT EXISTS tenant_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- ActiveCampaign
  activecampaign_enabled BOOLEAN DEFAULT false,
  activecampaign_api_url TEXT,           -- z.B. https://account.api-us1.com
  activecampaign_api_key TEXT,           -- Verschlüsselt speichern in Production!
  activecampaign_tag_booked TEXT,        -- Tag ID für gebuchte Termine
  activecampaign_tag_not_interested TEXT,
  activecampaign_pipeline_id TEXT,
  activecampaign_stage_new TEXT,
  activecampaign_stage_booked TEXT,

  -- Close CRM
  close_enabled BOOLEAN DEFAULT false,
  close_api_key TEXT,                    -- Verschlüsselt speichern in Production!
  close_status_new TEXT,                 -- Status ID für neue Leads
  close_status_contacted TEXT,
  close_status_booked TEXT,
  close_status_not_interested TEXT,
  close_opportunity_pipeline_id TEXT,

  -- Outgoing Webhooks
  webhook_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,
  webhook_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  webhook_events TEXT[] DEFAULT ARRAY['conversation.created', 'conversation.completed', 'conversation.escalated', 'booking.created'],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);

-- RLS
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant integrations" ON tenant_integrations
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage tenant integrations" ON tenant_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenant_integrations.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Trigger für updated_at
CREATE TRIGGER update_tenant_integrations_updated_at
  BEFORE UPDATE ON tenant_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- Funktion zum Erstellen von Standard-Integrations
-- ===========================================
CREATE OR REPLACE FUNCTION create_default_integrations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_integrations (tenant_id)
  VALUES (NEW.id)
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Erstelle Integrations-Eintrag bei neuem Tenant
DROP TRIGGER IF EXISTS on_tenant_created_integrations ON tenants;
CREATE TRIGGER on_tenant_created_integrations
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_integrations();
