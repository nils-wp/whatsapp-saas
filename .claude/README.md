# Claude Code Setup

Dieses Verzeichnis enthält die Claude Code Konfiguration mit spezialisierten Skills und Agents für das WhatsApp SaaS Projekt.

## Verwendung in Cursor

Tippe `/` gefolgt vom Skill-Namen, um den Kontext zu laden:

```
/project          # Projekt-Übersicht
/evolution        # Evolution API Dokumentation
/azure-openai     # Azure OpenAI Dokumentation
/supabase         # Supabase/Database Dokumentation
/crm              # CRM Integration Übersicht
/nextjs           # Next.js Framework
/coolify          # Deployment Dokumentation
/github           # GitHub & CI/CD
```

## API-Dokumentations-Skills

| Skill | Beschreibung |
|-------|--------------|
| `/evolution` | Evolution API v2 für WhatsApp |
| `/azure-openai` | Azure OpenAI Chat Completions |
| `/supabase` | Supabase PostgreSQL, Auth, RLS |
| `/pipedrive` | Pipedrive CRM API |
| `/monday` | Monday.com GraphQL API |
| `/hubspot` | HubSpot CRM API |
| `/crm` | Allgemeine CRM-Integration (Close, ActiveCampaign) |
| `/coolify` | Coolify Deployment API |
| `/github` | GitHub CLI & Actions |
| `/nextjs` | Next.js 16 App Router |

## Spezialisierte Agents

Für komplexere Aufgaben gibt es spezialisierte Agents:

| Agent | Aufgabenbereich |
|-------|-----------------|
| `/agent-messaging` | WhatsApp Messaging (Evolution API) |
| `/agent-ai` | AI/LLM Konfiguration (Azure OpenAI) |
| `/agent-crm` | CRM Integrationen |
| `/agent-database` | Supabase/PostgreSQL Operationen |
| `/agent-frontend` | React/Next.js UI Entwicklung |
| `/agent-deployment` | Docker, Coolify, GitHub Actions |

## Beispiel-Workflows

### Neue CRM-Integration hinzufügen
```
1. Tippe: /crm
2. Tippe: /pipedrive (oder anderes CRM)
3. Frage: "Erstelle eine Pipedrive Integration nach dem bestehenden Muster"
```

### AI Agent Verhalten anpassen
```
1. Tippe: /agent-ai
2. Tippe: /azure-openai
3. Frage: "Wie kann ich den System Prompt für bessere Antworten optimieren?"
```

### Datenbank-Migration erstellen
```
1. Tippe: /agent-database
2. Tippe: /supabase
3. Frage: "Erstelle eine Migration für eine neue analytics Tabelle"
```

### Deployment troubleshooten
```
1. Tippe: /agent-deployment
2. Tippe: /coolify
3. Frage: "Der Build schlägt fehl, wie debugge ich das?"
```

## Struktur

```
.claude/
├── commands/                    # Slash Commands (Skills)
│   ├── project.md              # Projekt-Kontext
│   ├── evolution.md            # Evolution API
│   ├── azure-openai.md         # Azure OpenAI
│   ├── supabase.md             # Supabase
│   ├── crm.md                  # CRM Übersicht
│   ├── pipedrive.md            # Pipedrive API
│   ├── monday.md               # Monday.com API
│   ├── hubspot.md              # HubSpot API
│   ├── nextjs.md               # Next.js
│   ├── coolify.md              # Coolify
│   ├── github.md               # GitHub
│   ├── agent-messaging.md      # Messaging Agent
│   ├── agent-ai.md             # AI Agent
│   ├── agent-crm.md            # CRM Agent
│   ├── agent-database.md       # Database Agent
│   ├── agent-frontend.md       # Frontend Agent
│   └── agent-deployment.md     # Deployment Agent
├── settings.json               # Claude Code Einstellungen
├── settings.local.json         # Lokale Overrides
└── README.md                   # Diese Datei
```

## Eigene Skills hinzufügen

1. Erstelle eine `.md` Datei in `.claude/commands/`
2. Beginne mit einem `# Titel` Header
3. Füge relevante Dokumentation, Code-Beispiele und Anleitungen hinzu
4. Der Skill ist sofort als `/dateiname` verfügbar

## Best Practices

- Verwende `/project` am Anfang jeder Session für Kontext
- Kombiniere Skills für komplexe Aufgaben
- Nutze spezialisierte Agents für ihre Fachgebiete
- Halte Skills aktuell wenn sich APIs ändern
