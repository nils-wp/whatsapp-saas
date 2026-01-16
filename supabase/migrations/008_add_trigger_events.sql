-- Add trigger_event column for specific CRM events
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS trigger_event TEXT;

-- Update type constraint to include new CRMs
ALTER TABLE triggers DROP CONSTRAINT IF EXISTS triggers_type_check;
ALTER TABLE triggers ADD CONSTRAINT triggers_type_check
  CHECK (type IN ('webhook', 'activecampaign', 'close', 'pipedrive', 'hubspot', 'monday'));

-- Add comment for documentation
COMMENT ON COLUMN triggers.trigger_event IS 'Specific event type within the CRM (e.g., lead_status_changed, call_completed)';
