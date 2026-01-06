# ChatSetter Setup Guide (Coolify)

Diese Anleitung erklärt, wie du ChatSetter mit Coolify deployen kannst.

## Übersicht der Services

```
┌─────────────────────────────────────────────────────────────┐
│                        COOLIFY                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Supabase   │  │ Evolution API│                        │
│  │  (Postgres)  │  │  (WhatsApp)  │                        │
│  └──────┬───────┘  └──────┬───────┘                        │
│         │                 │                                 │
│         └────────┬────────┘                                │
│                  │                                          │
│          ┌───────▼───────┐                                 │
│          │   ChatSetter  │                                 │
│          │   (Next.js)   │                                 │
│          └───────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

## Schritt 1: Supabase in Coolify

### Option A: Self-hosted Supabase (empfohlen)

1. In Coolify: **New Resource** > **Docker Compose**

2. Verwende das offizielle Supabase Docker Compose:
   ```
   https://github.com/supabase/supabase/tree/master/docker
   ```

3. Wichtige Umgebungsvariablen setzen:
   - `POSTGRES_PASSWORD` - sicheres Passwort
   - `JWT_SECRET` - mindestens 32 Zeichen
   - `ANON_KEY` - generieren mit JWT
   - `SERVICE_ROLE_KEY` - generieren mit JWT

4. Nach dem Start: SQL Editor öffnen und `supabase/schema.sql` ausführen

### Option B: Supabase Cloud (einfacher)

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Gehe zu **SQL Editor** und führe `supabase/schema.sql` aus
4. Kopiere die Keys aus **Settings > API**

---

## Schritt 2: Evolution API in Coolify

1. In Coolify: **New Resource** > **Docker Image**

2. Image: `atendai/evolution-api:latest`

3. Ports: `8080:8080`

4. Umgebungsvariablen:
   ```env
   SERVER_URL=https://evolution.deine-domain.de
   AUTHENTICATION_API_KEY=dein-sicherer-api-key
   AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
   DATABASE_ENABLED=true
   DATABASE_PROVIDER=postgresql
   DATABASE_CONNECTION_URI=postgresql://user:pass@supabase-db:5432/evolution
   ```

5. Domain zuweisen (z.B. `evolution.deine-domain.de`)

---

## Schritt 3: ChatSetter (Next.js) in Coolify

1. In Coolify: **New Resource** > **Public Repository**

2. Repository: `https://github.com/nils-wp/whatsapp-saas`

3. Build Command: `npm run build`

4. Start Command: `npm start`

5. Umgebungsvariablen:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://supabase.deine-domain.de
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # Evolution API
   EVOLUTION_API_URL=https://evolution.deine-domain.de
   EVOLUTION_API_KEY=dein-evolution-api-key

   # App
   NEXT_PUBLIC_APP_URL=https://deine-domain.de
   ```

6. Domain zuweisen (z.B. `deine-domain.de`)

---

## Schritt 4: Verbindung testen

### 1. Benutzer registrieren
- Öffne `https://deine-domain.de/signup`
- Erstelle einen Account
- Du wirst automatisch ein Projekt erstellt bekommen

### 2. WhatsApp verbinden
- Gehe zu **Accounts** > **Neuer Account**
- Gib einen Namen ein (z.B. "Hauptnummer")
- Scanne den QR-Code mit WhatsApp

### 3. Agent erstellen
- Gehe zu **Agents** > **Neuer Agent**
- Konfiguriere die Skript-Schritte

### 4. Trigger erstellen
- Gehe zu **Triggers** > **Neuer Trigger**
- Wähle den WhatsApp Account und Agent
- Kopiere die Webhook URL

---

## Architektur-Flow

```
1. Lead kommt rein (CRM/Formular)
       │
       ▼
2. Webhook zu ChatSetter Trigger
       │
       ▼
3. Conversation wird erstellt
       │
       ▼
4. Erste Nachricht via Evolution API
       │
       ▼
5. WhatsApp Nachricht gesendet
       │
       ▼
6. Antwort kommt (Evolution Webhook → ChatSetter)
       │
       ▼
7. Agent verarbeitet und antwortet
       │
       ▼
8. Loop bis Termin oder Eskalation
```

---

## Fehlerbehebung

### "Supabase URL required"
- Prüfe ob alle Umgebungsvariablen gesetzt sind
- Starte den Container neu

### "WhatsApp QR Code lädt nicht"
- Prüfe ob Evolution API erreichbar ist
- Prüfe die EVOLUTION_API_URL und EVOLUTION_API_KEY

### "Keine Nachrichten werden empfangen"
- Prüfe den Evolution API Webhook
- Webhook URL: `https://deine-domain.de/api/evolution/webhook`

---

## Nächste Schritte

1. [ ] ActiveCampaign/Close Integration konfigurieren
2. [ ] Stripe für Billing einrichten
3. [ ] Custom Domain mit SSL
