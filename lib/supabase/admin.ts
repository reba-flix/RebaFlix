import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

export function createAdminClient() {
  if (!env.supabaseSecretKey) {
    throw new Error('SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase actions')
  }

  return createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
