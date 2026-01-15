# Next.js Expert

You are an expert in Next.js 16+ with App Router for this project.

## Project Configuration

- **Next.js Version**: 16.1.1
- **React Version**: 19.2.3
- **Router**: App Router (not Pages Router)
- **Styling**: Tailwind CSS v4

### next.config.ts
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  images: {
    domains: ['your-supabase-url.supabase.co']
  }
}
```

## App Router Structure

```
app/
├── layout.tsx           # Root layout (providers, fonts)
├── page.tsx             # Home page (redirects to dashboard)
├── globals.css          # Global styles
├── (auth)/              # Auth group (no layout nesting)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── layout.tsx
├── (dashboard)/         # Dashboard group
│   ├── layout.tsx       # Dashboard layout (sidebar, header)
│   ├── page.tsx         # Dashboard home
│   ├── conversations/
│   │   ├── page.tsx     # List
│   │   └── [id]/page.tsx # Detail
│   └── settings/
│       ├── page.tsx
│       └── [tab]/page.tsx
└── api/                 # API routes
    ├── evolution/
    │   └── webhook/route.ts
    └── conversations/
        └── [id]/route.ts
```

## API Routes

### Basic Route Handler
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('table').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Process...
  return NextResponse.json({ success: true })
}
```

### Dynamic Route
```typescript
// app/api/conversations/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // Fetch by id...
}
```

### With Search Params
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '1'
  const limit = searchParams.get('limit') || '10'
}
```

## Server Components vs Client Components

### Server Component (Default)
```typescript
// No 'use client' directive
// Can use async/await directly
// Can access server-only resources

export default async function Page() {
  const supabase = await createServerClient()
  const { data } = await supabase.from('table').select('*')

  return <div>{data.map(...)}</div>
}
```

### Client Component
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

export default function ClientPage() {
  const { data } = useQuery({
    queryKey: ['items'],
    queryFn: () => fetch('/api/items').then(r => r.json())
  })

  return <div>{data?.map(...)}</div>
}
```

## Data Fetching Patterns

### Server Component with Supabase
```typescript
export default async function ConversationsPage() {
  const supabase = await createServerClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, agent:agents(*)')
    .order('last_message_at', { ascending: false })

  return <ConversationList data={conversations} />
}
```

### Client Component with React Query
```typescript
'use client'

import { useConversations } from '@/lib/hooks/use-conversations'

export default function ConversationsClient() {
  const { data, isLoading, error } = useConversations()

  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} />

  return <ConversationList data={data} />
}
```

## Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ... } }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

## Internationalization (next-intl)

### Setup
```typescript
// lib/i18n/config.ts
export const locales = ['de', 'en'] as const
export const defaultLocale = 'de' as const

// messages/de.json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen"
  },
  "conversations": {
    "title": "Konversationen",
    "empty": "Keine Konversationen gefunden"
  }
}
```

### Usage
```typescript
import { useTranslations } from 'next-intl'

export function Component() {
  const t = useTranslations('conversations')
  return <h1>{t('title')}</h1>
}
```

## Common Patterns

### Loading States
```typescript
// app/conversations/loading.tsx
export default function Loading() {
  return <ConversationListSkeleton />
}
```

### Error Handling
```typescript
// app/conversations/error.tsx
'use client'

export default function Error({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Parallel Data Fetching
```typescript
export default async function Page() {
  const [conversations, agents, accounts] = await Promise.all([
    getConversations(),
    getAgents(),
    getAccounts()
  ])

  return <Dashboard {...{ conversations, agents, accounts }} />
}
```

## Best Practices

1. **Use Server Components** when possible (data fetching, no interactivity)
2. **Use Client Components** only for interactivity, browser APIs, hooks
3. **Colocate loading/error** with page components
4. **Use React Query** for client-side data fetching with caching
5. **Validate inputs** with Zod schemas
6. **Handle errors gracefully** with try-catch and user-friendly messages
