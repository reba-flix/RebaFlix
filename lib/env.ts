function readEnv(names: string[], fallback?: string) {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }

  if (fallback !== undefined) return fallback
  throw new Error(`Missing required environment variable: ${names.join(' or ')}`)
}

export const env = {
  appUrl: readEnv(['NEXT_PUBLIC_APP_URL'], 'http://localhost:3000'),
  supabaseUrl: readEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'], 'http://localhost:54321'),
  supabasePublishableKey: readEnv(
    ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY'],
    'local-anon-key'
  ),
  supabaseSecretKey: readEnv(['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'], ''),
  supabaseStorageBucket: readEnv(['SUPABASE_STORAGE_BUCKET', 'NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET'], 'media'),
}
