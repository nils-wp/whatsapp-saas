# Supabase Expert

You are an expert in Supabase for database, auth, and real-time features.

## Project Setup

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only!
```

### Client Initialization

#### Client-side (`lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

#### Server-side (`lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ... } }
  )
}
```

## Database Schema

### Core Tables

```sql
-- Multi-tenant organizations
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free',
  plan_limits JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team members
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member', -- owner, admin, member
  invited_email TEXT,
  invite_token TEXT,
  accepted_at TIMESTAMPTZ
);

-- WhatsApp accounts (Evolution instances)
CREATE TABLE whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  instance_name TEXT NOT NULL,
  instance_id TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected',
  qr_code TEXT,
  daily_limit INT DEFAULT 50,
  warmup_day INT DEFAULT 1
);

-- AI Agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  personality TEXT,
  goal TEXT,
  script_steps JSONB DEFAULT '[]',
  faq JSONB DEFAULT '[]',
  office_hours JSONB,
  escalation_keywords TEXT[]
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id),
  agent_id UUID REFERENCES agents(id),
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  status TEXT DEFAULT 'active',
  current_script_step INT DEFAULT 0,
  last_message_at TIMESTAMPTZ
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  conversation_id UUID REFERENCES conversations(id),
  direction TEXT NOT NULL, -- inbound, outbound
  sender_type TEXT NOT NULL, -- contact, agent, human
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- etc.

-- Policy: Users can only access their tenant's data
CREATE POLICY "tenant_isolation" ON conversations
  FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members
    WHERE user_id = auth.uid()
  ));
```

## Common Queries

### Fetch with Relations
```typescript
const { data } = await supabase
  .from('conversations')
  .select(`
    *,
    agent:agents(*),
    whatsapp_account:whatsapp_accounts(*),
    messages(*)
  `)
  .eq('tenant_id', tenantId)
  .order('last_message_at', { ascending: false })
```

### Upsert
```typescript
const { data } = await supabase
  .from('conversations')
  .upsert({
    id: existingId,
    contact_phone: phone,
    last_message_at: new Date().toISOString()
  })
  .select()
  .single()
```

### Real-time Subscriptions
```typescript
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Handle new message
  })
  .subscribe()
```

## Type Generation

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

## Common Tasks

### Add new table
1. Create migration: `npx supabase migration new add_table_name`
2. Write SQL in `supabase/migrations/`
3. Apply: `npx supabase db push`
4. Regenerate types

### Add RLS policy
```sql
CREATE POLICY "policy_name" ON table_name
  FOR SELECT  -- or INSERT, UPDATE, DELETE, ALL
  USING (condition)
  WITH CHECK (condition);  -- for INSERT/UPDATE
```

### Debug queries
```typescript
const { data, error, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })

console.log({ data, error, count })
```
