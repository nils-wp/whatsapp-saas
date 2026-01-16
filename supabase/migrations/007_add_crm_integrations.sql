-- ===========================================
-- Migration: Erweitere tenant_integrations für alle CRMs
-- Fügt Pipedrive, HubSpot, Monday.com hinzu
-- ===========================================

-- Pipedrive Spalten
ALTER TABLE tenant_integrations
ADD COLUMN IF NOT EXISTS pipedrive_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pipedrive_api_token TEXT,
ADD COLUMN IF NOT EXISTS pipedrive_pipeline_id TEXT,
ADD COLUMN IF NOT EXISTS pipedrive_stage_new TEXT,
ADD COLUMN IF NOT EXISTS pipedrive_stage_contacted TEXT,
ADD COLUMN IF NOT EXISTS pipedrive_stage_qualified TEXT,
ADD COLUMN IF NOT EXISTS pipedrive_stage_booked TEXT,
ADD COLUMN IF NOT EXISTS pipedrive_stage_lost TEXT;

-- HubSpot Spalten
ALTER TABLE tenant_integrations
ADD COLUMN IF NOT EXISTS hubspot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hubspot_access_token TEXT,
ADD COLUMN IF NOT EXISTS hubspot_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS hubspot_portal_id TEXT,
ADD COLUMN IF NOT EXISTS hubspot_pipeline_id TEXT,
ADD COLUMN IF NOT EXISTS hubspot_stage_new TEXT,
ADD COLUMN IF NOT EXISTS hubspot_stage_contacted TEXT,
ADD COLUMN IF NOT EXISTS hubspot_stage_qualified TEXT,
ADD COLUMN IF NOT EXISTS hubspot_stage_booked TEXT,
ADD COLUMN IF NOT EXISTS hubspot_stage_lost TEXT;

-- Monday.com Spalten
ALTER TABLE tenant_integrations
ADD COLUMN IF NOT EXISTS monday_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monday_api_token TEXT,
ADD COLUMN IF NOT EXISTS monday_board_id TEXT,
ADD COLUMN IF NOT EXISTS monday_phone_column_id TEXT,
ADD COLUMN IF NOT EXISTS monday_name_column_id TEXT,
ADD COLUMN IF NOT EXISTS monday_email_column_id TEXT,
ADD COLUMN IF NOT EXISTS monday_status_column_id TEXT,
ADD COLUMN IF NOT EXISTS monday_group_new TEXT,
ADD COLUMN IF NOT EXISTS monday_group_contacted TEXT,
ADD COLUMN IF NOT EXISTS monday_group_qualified TEXT,
ADD COLUMN IF NOT EXISTS monday_group_booked TEXT,
ADD COLUMN IF NOT EXISTS monday_group_lost TEXT;

-- Zusätzliche ActiveCampaign Spalten (für vollständige Integration)
ALTER TABLE tenant_integrations
ADD COLUMN IF NOT EXISTS activecampaign_tag_contacted TEXT,
ADD COLUMN IF NOT EXISTS activecampaign_tag_qualified TEXT,
ADD COLUMN IF NOT EXISTS activecampaign_field_whatsapp_status TEXT,
ADD COLUMN IF NOT EXISTS activecampaign_field_last_contact TEXT;

-- Zusätzliche Close Spalten
ALTER TABLE tenant_integrations
ADD COLUMN IF NOT EXISTS close_status_qualified TEXT,
ADD COLUMN IF NOT EXISTS close_custom_field_whatsapp_status TEXT,
ADD COLUMN IF NOT EXISTS close_custom_field_conversation_id TEXT;

-- Tracking-Spalten für Sync-Status
ALTER TABLE tenant_integrations
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sync_status TEXT,
ADD COLUMN IF NOT EXISTS last_sync_error TEXT;

-- Kommentar für Übersicht
COMMENT ON TABLE tenant_integrations IS 'CRM-Integrationen pro Tenant: Close, ActiveCampaign, Pipedrive, HubSpot, Monday.com';
