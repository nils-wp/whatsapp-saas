-- Migration: Fix agent deletion constraint
-- Allow agents to be deleted by setting agent_id to NULL in related tables

-- Fix triggers table
ALTER TABLE triggers
DROP CONSTRAINT IF EXISTS triggers_agent_id_fkey;

ALTER TABLE triggers
ADD CONSTRAINT triggers_agent_id_fkey
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Fix conversations table
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_agent_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_agent_id_fkey
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
