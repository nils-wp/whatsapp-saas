-- Ensure users can ALWAYS read their own membership rows
-- This fixes issues where 'auth.user_has_tenant_access' might fail or recursive policies block access.

DROP POLICY IF EXISTS "Users can view their own membership" ON tenant_members;

CREATE POLICY "Users can view their own membership" ON tenant_members
  FOR SELECT USING (user_id = auth.uid());
