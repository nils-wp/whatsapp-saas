-- Drop existing policies if any to avoid conflicts or confusion (optional, but cleaner)
DROP POLICY IF EXISTS "Users can view number checks in their tenants" ON number_check_configs;
DROP POLICY IF EXISTS "Users can manage number checks in their tenants" ON number_check_configs;

-- Re-apply correct policies
CREATE POLICY "Users can view number checks in their tenants" ON number_check_configs
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage number checks in their tenants" ON number_check_configs
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- Grant permissions explicitly
GRANT ALL ON number_check_configs TO authenticated;
GRANT SELECT ON number_check_configs TO service_role;
