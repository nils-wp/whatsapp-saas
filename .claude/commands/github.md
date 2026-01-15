# GitHub Expert

You are an expert in GitHub for version control and CI/CD.

## Repository Structure

```
whatsapp-saas/
├── .github/
│   ├── workflows/        # GitHub Actions
│   │   ├── ci.yml        # Build & Test
│   │   ├── deploy.yml    # Production deployment
│   │   └── preview.yml   # Preview deployments
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .gitignore
└── ...
```

## GitHub Actions Workflows

### CI Pipeline (Build & Test)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  test:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

### Production Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Coolify
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}" \
            "${{ secrets.COOLIFY_URL }}/api/v1/applications/${{ secrets.APP_UUID }}/deploy"

      - name: Wait for deployment
        run: sleep 60

      - name: Health check
        run: |
          curl -f ${{ secrets.APP_URL }}/api/health || exit 1
```

### Preview Deployments (PRs)

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy Preview
        id: deploy
        run: |
          # Deploy to preview environment
          echo "preview_url=https://pr-${{ github.event.number }}.preview.your-domain.com" >> $GITHUB_OUTPUT

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: ${{ steps.deploy.outputs.preview_url }}'
            })
```

## GitHub CLI (gh)

### Common Commands

```bash
# Authentication
gh auth login
gh auth status

# Repository
gh repo clone owner/repo
gh repo view --web

# Issues
gh issue list
gh issue create --title "Title" --body "Description"
gh issue close 123

# Pull Requests
gh pr list
gh pr create --title "Title" --body "Description"
gh pr checkout 123
gh pr merge 123
gh pr view 123 --web

# View PR comments
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments

# Workflows
gh workflow list
gh workflow run ci.yml
gh run list
gh run view 123456 --log
```

### PR Creation with Full Details

```bash
gh pr create \
  --title "feat: Add Pipedrive integration" \
  --body "$(cat <<'EOF'
## Summary
- Adds Pipedrive CRM integration
- Implements contact sync and activity logging
- Adds settings UI for configuration

## Changes
- `lib/integrations/pipedrive.ts` - API client
- `components/integrations/pipedrive-settings.tsx` - Settings UI
- `lib/integrations/crm-sync.ts` - Updated orchestration

## Test Plan
- [ ] Test contact creation
- [ ] Test activity logging
- [ ] Test settings UI
- [ ] Verify existing integrations still work

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Branch Strategy

### Git Flow
```
main           # Production-ready code
├── develop    # Integration branch
├── feature/*  # New features
├── bugfix/*   # Bug fixes
├── hotfix/*   # Production hotfixes
└── release/*  # Release preparation
```

### Trunk-Based (Recommended for this project)
```
main           # Production, always deployable
├── feat/*     # Short-lived feature branches
└── fix/*      # Bug fix branches

# Merge via PR with squash
```

## Secrets Management

### Required Secrets

```
# GitHub Settings → Secrets and variables → Actions

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Azure OpenAI
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT

# Evolution API
EVOLUTION_API_URL
EVOLUTION_API_KEY

# Deployment
COOLIFY_TOKEN
COOLIFY_URL
APP_UUID
APP_URL
```

### Using Secrets in Workflows

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}

steps:
  - run: echo "URL is $NEXT_PUBLIC_SUPABASE_URL"
```

## GitHub Apps & Integrations

### Recommended Apps
- **Dependabot** - Automatic dependency updates
- **CodeQL** - Security scanning
- **Vercel/Coolify** - Deployment integration

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      dependencies:
        patterns:
          - "*"
```

## Code Review Checklist

```markdown
## PR Review Checklist

### Code Quality
- [ ] Types are properly defined
- [ ] No console.log statements
- [ ] Error handling is appropriate
- [ ] No hardcoded values

### Security
- [ ] No secrets in code
- [ ] Input validation where needed
- [ ] RLS policies considered

### Testing
- [ ] Manual testing done
- [ ] Edge cases considered

### Documentation
- [ ] Complex logic commented
- [ ] API changes documented
```
