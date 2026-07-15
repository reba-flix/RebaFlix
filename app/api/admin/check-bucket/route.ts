import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'

export async function GET() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase.storage.getBucket(env.supabaseStorageBucket)
  
  if (error) {
    if (error.message.includes('not found') || error.message.includes('bucket not found')) {
      const { data: createData, error: createError } = await supabase.storage.createBucket(env.supabaseStorageBucket, {
        public: true,
      })
      return NextResponse.json({ action: 'created', data: createData, error: createError })
    }
    return NextResponse.json({ action: 'error', error })
  }
  
  return NextResponse.json({ action: 'exists', data })
}
