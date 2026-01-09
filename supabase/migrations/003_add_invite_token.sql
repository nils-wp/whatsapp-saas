-- Migration: Add invite_token to tenant_members
-- This enables shareable invite links for team invitations

-- Add invite_token column
ALTER TABLE tenant_members
ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT uuid_generate_v4();

-- Create unique index on invite_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_members_invite_token
ON tenant_members(invite_token)
WHERE invite_token IS NOT NULL;

-- Update existing rows to have unique tokens (if any pending invites exist)
UPDATE tenant_members
SET invite_token = uuid_generate_v4()
WHERE invite_token IS NULL AND accepted_at IS NULL;

-- Policy for accepting invites (users can update their own invite by token)
CREATE POLICY "Users can accept invites by token" ON tenant_members
  FOR UPDATE USING (
    invite_token IS NOT NULL
    AND accepted_at IS NULL
    AND (
      -- Either the user is already the intended recipient
      user_id = auth.uid()
      -- Or the user's email matches the invited_email
      OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    -- Can only set user_id to themselves and accepted_at
    user_id = auth.uid()
  );

-- Policy for viewing invites by token (for invite acceptance page)
CREATE POLICY "Anyone can view invite by token" ON tenant_members
  FOR SELECT USING (
    invite_token IS NOT NULL
    AND accepted_at IS NULL
  );
