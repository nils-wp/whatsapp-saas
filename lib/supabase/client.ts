'use client'

import { createBrowserClient } from '@supabase/ssr'

// Untyped client - use for mutations where type inference has issues
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
