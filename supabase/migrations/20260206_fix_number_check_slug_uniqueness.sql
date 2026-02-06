-- Remove global UNIQUE(slug) constraint to allow same slug for different tenants
-- The composite UNIQUE(tenant_id, slug) remains, ensuring slugs are unique per tenant

-- Drop the global unique constraint on slug
ALTER TABLE number_check_configs DROP CONSTRAINT IF EXISTS number_check_configs_slug_key;

-- The composite constraint (tenant_id, slug) already exists and will be kept
-- This allows different tenants to use the same slug (e.g., "test")
-- The API route will be changed to use pattern: /api/tools/check/{tenant_slug}/{config_slug}
