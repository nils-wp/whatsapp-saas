-- Create number_check_configs table
CREATE TABLE number_check_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  allowed_origins TEXT[] DEFAULT ARRAY['*'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug),
  UNIQUE(slug)
);

-- Indexes
CREATE INDEX idx_number_check_configs_tenant ON number_check_configs(tenant_id);
CREATE INDEX idx_number_check_configs_slug ON number_check_configs(slug);

-- RLS
ALTER TABLE number_check_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view number checks in their tenants" ON number_check_configs
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage number checks in their tenants" ON number_check_configs
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- Trigger for updated_at
CREATE TRIGGER update_number_check_configs_updated_at
  BEFORE UPDATE ON number_check_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Grant access to authenticated users
GRANT ALL ON number_check_configs TO authenticated;
GRANT SELECT ON number_check_configs TO anon; -- For public access check (needs careful RLS or specialized function if RLS blocks anon)
-- Actually, public access will be via service_role in API route, so RLS for anon is not strictly needed if we bypass RLS in the route.
-- But let's keep it secure by default.
