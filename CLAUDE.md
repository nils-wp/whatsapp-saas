# WhatsApp SaaS - Claude Code Project Guide

## Auto-Load Instructions

**WICHTIG: Bei jeder Aufgabe automatisch die relevanten Skills aus `.claude/commands/` lesen:**

| Aufgabe enthält | Skills laden |
|-----------------|--------------|
| WhatsApp, Message, Evolution, Nachricht | `.claude/commands/evolution.md`, `.claude/commands/agent-messaging.md` |
| AI, Agent, Prompt, OpenAI, LLM | `.claude/commands/azure-openai.md`, `.claude/commands/agent-ai.md` |
| CRM, Close, ActiveCampaign, Sync, Lead | `.claude/commands/crm.md`, `.claude/commands/agent-crm.md` |
| Pipedrive | `.claude/commands/pipedrive.md`, `.claude/commands/agent-crm.md` |
| Monday, Monday.com | `.claude/commands/monday.md`, `.claude/commands/agent-crm.md` |
| HubSpot | `.claude/commands/hubspot.md`, `.claude/commands/agent-crm.md` |
| Salesforce | `.claude/commands/salesforce.md`, `.claude/commands/agent-crm.md` |
| Database, Supabase, Query, Migration, RLS | `.claude/commands/supabase.md`, `.claude/commands/agent-database.md` |
| Frontend, Component, UI, Page, React | `.claude/commands/nextjs.md`, `.claude/commands/agent-frontend.md` |
| Deploy, Coolify, Docker, CI/CD | `.claude/commands/coolify.md`, `.claude/commands/github.md`, `.claude/commands/agent-deployment.md` |
| Git, PR, Commit, GitHub, Actions | `.claude/commands/github.md` |

**Workflow bei Aufgaben:**
1. Aufgabe analysieren und relevante Skills identifizieren
2. Skills aus `.claude/commands/` lesen (parallel)
3. Mit dem Skill-Wissen die Aufgabe ausführen
4. Bestehende Patterns im Code befolgen

---

## Project Overview

Multi-tenant WhatsApp automation SaaS platform for automated customer conversations with AI agents, CRM integrations, and webhook-based triggers. GDPR-compliant (Azure OpenAI EU).

## Tech Stack

- **Frontend**: Next.js 16.1.1 (App Router), React 19, Tailwind CSS v4, Radix UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth + RLS)
- **AI**: Azure OpenAI (EU-based, GDPR-compliant)
- **WhatsApp**: Evolution API v2 (Baileys-based)
- **State**: TanStack React Query v5
- **i18n**: next-intl (German default)
- **CRMs**: Close.io, ActiveCampaign (more planned)

## Directory Structure

```
app/
├── api/              # API routes (webhooks, CRUD)
│   ├── evolution/    # WhatsApp/Evolution API
│   ├── webhook/      # CRM trigger webhooks
│   └── ...           # Other API endpoints
├── (auth)/           # Auth pages (login, signup)
└── (dashboard)/      # Protected dashboard routes

components/
├── ui/               # Radix-based UI components
├── layout/           # Header, sidebar, navigation
├── conversations/    # Chat UI components
├── agents/           # Agent management UI
├── accounts/         # WhatsApp account UI
└── triggers/         # Webhook trigger UI

lib/
├── ai/               # AI/Agent processing logic
│   ├── agent-processor.ts    # Message processing
│   ├── message-handler.ts    # Orchestration
│   └── azure-openai.ts       # Azure client
├── integrations/     # CRM integrations
│   ├── crm-sync.ts           # Orchestration
│   ├── close.ts              # Close.io client
│   └── activecampaign.ts     # AC client
├── evolution/        # Evolution API client
├── supabase/         # Supabase helpers
├── hooks/            # React Query hooks
└── utils/            # Utilities

types/                # TypeScript types
messages/             # i18n translations (de, en)
supabase/             # Schema & migrations
```

## Core Concepts

### Multi-Tenancy
- All data isolated by `tenant_id`
- Row Level Security (RLS) on all tables
- Users belong to tenants via `tenant_members`

### Message Flow
```
Evolution Webhook → /api/evolution/webhook
├─ Save message to DB
├─ Find/create conversation
├─ Check office hours
├─ Process with AI agent
├─ Check escalation keywords
├─ Progress script step
├─ Sync to CRM
└─ Send response via Evolution
```

### Agent Configuration
- `personality`: Agent behavior description
- `goal`: What agent should achieve
- `script_steps`: Multi-step conversation flow
- `faq`: Q&A pairs for knowledge base
- `office_hours`: Timezone-aware schedule
- `escalation_keywords`: Triggers human handoff

### CRM Integration
- Bidirectional sync with Close.io & ActiveCampaign
- Messages logged as activities
- Lead status updates on conversation outcomes
- Webhook triggers for outbound conversations

## Key Files

| Purpose | File |
|---------|------|
| Message Processing | `lib/ai/message-handler.ts` |
| AI Agent Logic | `lib/ai/agent-processor.ts` |
| Azure OpenAI Client | `lib/ai/azure-openai.ts` |
| Evolution API Client | `lib/evolution/client.ts` |
| Close.io Integration | `lib/integrations/close.ts` |
| ActiveCampaign | `lib/integrations/activecampaign.ts` |
| Database Types | `types/database.ts` |
| Schema Definition | `supabase/schema.sql` |

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
npx supabase gen types typescript  # Regenerate DB types
```

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Azure OpenAI
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=

# Evolution API
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_WEBHOOK_SECRET=

# CRM (per tenant in DB)
# Configured via integrations settings
```

## Conventions

- **German default**: UI text in `messages/de.json`
- **Spintax**: Use `{option1|option2}` for message variation
- **Hooks**: All data fetching via `lib/hooks/use-*.ts`
- **Forms**: React Hook Form + Zod validation
- **Errors**: Try-catch with fallback responses
- **Comments**: German or English, concise

## Common Tasks

### Add new CRM integration
1. Create client in `lib/integrations/[crm].ts`
2. Add to CRM sync orchestration in `crm-sync.ts`
3. Add integration settings UI component
4. Update tenant settings type

### Add new agent script step type
1. Update `script_steps` JSONB schema
2. Modify `agent-processor.ts` step handling
3. Update `script-builder.tsx` UI component

### Add new API route
1. Create route in `app/api/[route]/route.ts`
2. Use `createServerClient()` for Supabase
3. Check tenant access with RLS
4. Return JSON responses

## Specialized Agents

This project uses specialized Claude Code agents for different tasks:

| Agent | Purpose | Skill |
|-------|---------|-------|
| `evolution-api` | WhatsApp messaging | `/evolution` |
| `azure-openai` | AI/LLM configuration | `/azure-openai` |
| `supabase` | Database & Auth | `/supabase` |
| `crm-integration` | CRM syncing | `/crm` |
| `nextjs` | Frontend/Backend | `/nextjs` |
| `coolify` | Deployment | `/coolify` |

Use `/[skill]` in Cursor to activate specialized context.
