# WhatsApp SaaS Project Context

You are working on a multi-tenant WhatsApp automation SaaS platform.

## Architecture

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4, Radix UI
- **Backend**: Next.js API Routes with Supabase (PostgreSQL + RLS)
- **AI**: Azure OpenAI (EU, GDPR-compliant)
- **WhatsApp**: Evolution API v2

## Core Message Flow

```
Evolution Webhook → Save to DB → Check office hours → AI processing → CRM sync → Send response
```

## Key Directories

- `lib/ai/` - AI agent processing (message-handler.ts, agent-processor.ts)
- `lib/evolution/` - WhatsApp API client
- `lib/integrations/` - CRM integrations (Close, ActiveCampaign)
- `lib/hooks/` - React Query hooks for all data
- `components/` - UI components (ui/, conversations/, agents/, etc.)
- `app/api/` - API routes
- `app/(dashboard)/` - Protected pages

## Database Tables

- `tenants` - Multi-tenant orgs
- `whatsapp_accounts` - Evolution instances
- `agents` - AI agent configs (personality, script_steps, faq)
- `conversations` - Chat threads
- `messages` - Individual messages
- `triggers` - Webhook triggers for outbound

## Conventions

- German default language
- Spintax for message variation: `{option1|option2}`
- All queries filtered by tenant_id via RLS
- React Hook Form + Zod for forms
- TanStack Query for server state

When making changes, always:
1. Check existing patterns in similar files
2. Use German for user-facing text
3. Add proper TypeScript types
4. Use existing hooks from lib/hooks/
