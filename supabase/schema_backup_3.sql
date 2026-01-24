-- ===========================================
-- ChatSetter Database Schema
-- Run this in Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TENANTS (Multi-Tenant / Projekte)
-- ===========================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free',
  plan_limits JSONB DEFAULT '{"whatsapp_accounts": 1, "monthly_messages": 1000, "agents": 2}'::jsonb,
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TENANT MEMBERS (Team-Mitglieder)
-- ===========================================
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_email TEXT,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  invite_token UUID DEFAULT uuid_generate_v4()
);

-- ===========================================
-- WHATSAPP ACCOUNTS
-- ===========================================
CREATE TABLE whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  instance_id TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'banned')),
  qr_code TEXT,
  qr_expires_at TIMESTAMPTZ,
  daily_limit INTEGER DEFAULT 50,
  messages_sent_today INTEGER DEFAULT 0,
  warmup_day INTEGER DEFAULT 1,
  last_message_at TIMESTAMPTZ,
  display_name TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- AGENTS (KI-Agenten)
-- ===========================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  agent_name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  personality TEXT DEFAULT 'freundlich und professionell',
  goal TEXT DEFAULT 'Termine vereinbaren',
  script_steps JSONB DEFAULT '[]'::jsonb,
  faq JSONB DEFAULT '[]'::jsonb,
  office_hours JSONB DEFAULT '{"enabled": false, "timezone": "Europe/Berlin", "schedule": {}}'::jsonb,
  outside_hours_message TEXT,
  escalation_keywords TEXT[] DEFAULT ARRAY['mensch', 'mitarbeiter', 'chef'],
  total_conversations INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TRIGGERS (Webhook/CRM Auslöser)
-- ===========================================
CREATE TABLE triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  type TEXT NOT NULL CHECK (type IN ('webhook', 'activecampaign', 'close')),
  webhook_id TEXT DEFAULT uuid_generate_v4()::text,
  webhook_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  external_config JSONB,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id),
  agent_id UUID REFERENCES agents(id),
  first_message TEXT NOT NULL,
  first_message_delay_seconds INTEGER DEFAULT 30,
  total_triggered INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CONVERSATIONS
-- ===========================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id),
  agent_id UUID REFERENCES agents(id),
  trigger_id UUID REFERENCES triggers(id),
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  external_lead_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'escalated', 'completed', 'disqualified')),
  outcome TEXT CHECK (outcome IN ('booked', 'not_interested', 'no_response', 'disqualified')),
  current_script_step INTEGER DEFAULT 1,
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  booked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  last_contact_message_at TIMESTAMPTZ,
  last_agent_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- MESSAGES
-- ===========================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('contact', 'agent', 'human')),
  content TEXT NOT NULL,
  media_type TEXT,
  media_url TEXT,
  script_step_used INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ANALYTICS DAILY
-- ===========================================
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id),
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  conversations_started INTEGER DEFAULT 0,
  conversations_completed INTEGER DEFAULT 0,
  escalations INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  UNIQUE(tenant_id, whatsapp_account_id, date)
);

-- ===========================================
-- INDEXES für Performance
-- ===========================================
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE UNIQUE INDEX idx_tenant_members_invite_token ON tenant_members(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX idx_whatsapp_accounts_tenant ON whatsapp_accounts(tenant_id);
CREATE INDEX idx_agents_tenant ON agents(tenant_id);
CREATE INDEX idx_triggers_tenant ON triggers(tenant_id);
CREATE INDEX idx_triggers_webhook ON triggers(webhook_id);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_phone ON conversations(contact_phone);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_analytics_tenant_date ON analytics_daily(tenant_id, date);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Helper function to check tenant membership
CREATE OR REPLACE FUNCTION auth.user_has_tenant_access(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = check_tenant_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants policies
CREATE POLICY "Users can view their tenants" ON tenants
  FOR SELECT USING (auth.user_has_tenant_access(id));

CREATE POLICY "Users can create tenants" ON tenants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update tenants" ON tenants
  FOR UPDATE USING (owner_id = auth.uid());

-- Tenant members policies
CREATE POLICY "Users can view members of their tenants" ON tenant_members
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage members" ON tenant_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Anyone can view invite by token" ON tenant_members
  FOR SELECT USING (
    invite_token IS NOT NULL
    AND accepted_at IS NULL
  );

CREATE POLICY "Users can accept invites by token" ON tenant_members
  FOR UPDATE USING (
    invite_token IS NOT NULL
    AND accepted_at IS NULL
    AND (
      user_id = auth.uid()
      OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- WhatsApp accounts policies
CREATE POLICY "Users can view accounts in their tenants" ON whatsapp_accounts
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage accounts in their tenants" ON whatsapp_accounts
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- Agents policies
CREATE POLICY "Users can view agents in their tenants" ON agents
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage agents in their tenants" ON agents
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- Triggers policies
CREATE POLICY "Users can view triggers in their tenants" ON triggers
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage triggers in their tenants" ON triggers
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- Conversations policies
CREATE POLICY "Users can view conversations in their tenants" ON conversations
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage conversations in their tenants" ON conversations
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- Messages policies
CREATE POLICY "Users can view messages in their tenants" ON messages
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage messages in their tenants" ON messages
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- Analytics policies
CREATE POLICY "Users can view analytics in their tenants" ON analytics_daily
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage analytics in their tenants" ON analytics_daily
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- ===========================================
-- TRIGGER: Auto-create tenant member on tenant creation
-- ===========================================
CREATE OR REPLACE FUNCTION create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_members (tenant_id, user_id, role, accepted_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_owner_membership();

-- ===========================================
-- TRIGGER: Update timestamps
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_triggers_updated_at
  BEFORE UPDATE ON triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
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
