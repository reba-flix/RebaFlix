function readEnv(names: string[], fallback?: string) {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }

  if (fallback !== undefined) return fallback
  throw new Error(`Missing required environment variable: ${names.join(' or ')}`)
}

export const env = {
  // App
  appUrl: readEnv(['NEXT_PUBLIC_APP_URL'], 'http://localhost:3000'),

  // Supabase Auth (kept — used by lib/auth.ts and lib/supabase/*)
  supabaseUrl: readEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'], 'http://localhost:54321'),
  supabasePublishableKey: readEnv(
    ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY'],
    'local-anon-key'
  ),
  supabaseSecretKey: readEnv(['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'], ''),

  // Cloudflare R2 Storage
  r2Endpoint: readEnv(['R2_ENDPOINT'], ''),
  r2AccessKeyId: readEnv(['R2_ACCESS_KEY_ID'], ''),
  r2SecretAccessKey: readEnv(['R2_SECRET_ACCESS_KEY'], ''),
  r2BucketName: readEnv(['R2_BUCKET_NAME'], 'rebaflix-videos'),
  r2PublicUrl: readEnv(['R2_PUBLIC_URL'], ''),
}
