import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'

export async function GET() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase.storage.updateBucket(env.supabaseStorageBucket, {
    public: false,
    allowedMimeTypes: [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif', 
      'image/avif',
      'image/svg+xml',
      'video/mp4', 
      'video/webm',
      'video/x-matroska', // mkv
      'video/quicktime', // mov
      'application/pdf'
    ],
    fileSizeLimit: 524288000 // 500MB
  })
  
  if (error) {
    return NextResponse.json({ action: 'error', error })
  }
  
  return NextResponse.json({ action: 'updated', data })
}
