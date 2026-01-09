-- Migration: Add missing agent fields
-- These fields are used in the application but were missing from the initial schema

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS colleague_name TEXT,
ADD COLUMN IF NOT EXISTS company_info TEXT,
ADD COLUMN IF NOT EXISTS calendly_link TEXT,
ADD COLUMN IF NOT EXISTS booking_cta TEXT,
ADD COLUMN IF NOT EXISTS response_delay_min INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS response_delay_max INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS max_messages_per_conversation INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS escalation_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS escalation_message TEXT,
ADD COLUMN IF NOT EXISTS disqualify_criteria TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS disqualify_message TEXT,
ADD COLUMN IF NOT EXISTS faq_entries JSONB DEFAULT '[]'::jsonb;
