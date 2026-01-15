# Coolify Deployment Expert

You are an expert in Coolify for self-hosted deployments.

## Coolify Overview

Coolify is an open-source, self-hostable Heroku/Vercel alternative.

### Key Features
- Docker-based deployments
- Git integration (GitHub, GitLab, Bitbucket)
- SSL certificates (Let's Encrypt)
- Database management
- Environment variables
- Webhooks for CI/CD

## Project Deployment Configuration

### Dockerfile (Next.js Production)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env vars
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### next.config.ts for Standalone
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... other config
}
```

## Coolify Setup Steps

### 1. Create New Application
```
Coolify Dashboard → Projects → Add Resource → Application
```

### 2. Connect Repository
- Select GitHub/GitLab
- Choose repository
- Select branch (main/production)

### 3. Configure Build
```yaml
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile
```

### 4. Environment Variables

```
# Runtime Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o

EVOLUTION_API_URL=https://evolution.your-domain.com
EVOLUTION_API_KEY=xxx
EVOLUTION_WEBHOOK_SECRET=xxx

# Build-time (also add as Build Arguments)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 5. Domain Configuration
```
Domain: app.your-domain.com
SSL: Let's Encrypt (automatic)
```

### 6. Health Check
```
Path: /api/health
Interval: 30s
```

## Coolify API

### Authentication
```bash
# API Token from Coolify Settings
Authorization: Bearer your-api-token
```

### Useful Endpoints

```bash
# List Applications
GET /api/v1/applications

# Get Application Details
GET /api/v1/applications/{uuid}

# Deploy Application
POST /api/v1/applications/{uuid}/deploy

# Get Deployment Logs
GET /api/v1/applications/{uuid}/logs

# Update Environment Variables
PATCH /api/v1/applications/{uuid}
{
  "env": [
    { "key": "VAR_NAME", "value": "value", "is_build_time": false }
  ]
}

# Restart Application
POST /api/v1/applications/{uuid}/restart

# Stop Application
POST /api/v1/applications/{uuid}/stop

# Start Application
POST /api/v1/applications/{uuid}/start
```

## Database Deployment (Supabase Alternative)

### PostgreSQL on Coolify

```yaml
# docker-compose.yml for Coolify
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: whatsapp_saas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Connection String
```
DATABASE_URL=postgresql://app:password@postgres:5432/whatsapp_saas
```

## Evolution API Deployment

### Docker Compose for Evolution
```yaml
version: '3.8'
services:
  evolution:
    image: atendai/evolution-api:latest
    environment:
      SERVER_URL: https://evolution.your-domain.com
      AUTHENTICATION_API_KEY: your-secure-key
      DATABASE_ENABLED: true
      DATABASE_CONNECTION_URI: mongodb://mongo:27017/evolution
    ports:
      - "8080:8080"
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## CI/CD Webhooks

### GitHub Actions Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deployment
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}" \
            https://coolify.your-domain.com/api/v1/applications/${{ secrets.APP_UUID }}/deploy
```

### Coolify Webhook (Alternative)
```
Settings → Webhooks → Enable GitHub Webhook
Copy webhook URL to GitHub repository settings
```

## Troubleshooting

### Build Failures
```bash
# Check build logs in Coolify
# Common issues:
# - Missing build arguments for NEXT_PUBLIC_* vars
# - Node version mismatch
# - Memory limits (increase in Coolify settings)
```

### Container Won't Start
```bash
# Check runtime logs
# Common issues:
# - Missing environment variables
# - Port conflicts
# - Health check failing
```

### SSL Certificate Issues
```bash
# Coolify auto-renews Let's Encrypt
# If issues:
# 1. Check domain DNS points to server
# 2. Port 80/443 open
# 3. Force certificate renewal in Coolify
```

## Resource Limits

### Recommended Settings
```
CPU: 1-2 cores
Memory: 1-2 GB
Storage: As needed
```

### Scaling
```
# For high traffic:
# - Increase container replicas
# - Use load balancer
# - Consider managed database
```
