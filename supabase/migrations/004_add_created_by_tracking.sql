-- Migration: Add created_by and updated_by tracking to main tables
-- This enables showing "by [name]" for actions

-- Add columns to agents
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add columns to triggers
ALTER TABLE triggers
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add columns to conversations (for manual actions like escalation, status changes)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add columns to messages (for human replies)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON agents(created_by);
CREATE INDEX IF NOT EXISTS idx_triggers_created_by ON triggers(created_by);
CREATE INDEX IF NOT EXISTS idx_messages_sent_by ON messages(sent_by);
