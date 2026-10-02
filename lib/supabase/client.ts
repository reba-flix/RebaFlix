'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const isProduction = process.env.NODE_ENV === 'production'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (isProduction ? undefined : 'http://localhost:54321')
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (isProduction ? undefined : 'local-anon-key')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing public Supabase configuration for browser client')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
