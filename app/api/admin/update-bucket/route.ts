import { NextResponse } from 'next/server'
import { GetBucketLocationCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getR2Client } from '@/lib/r2'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/update-bucket
 * Returns R2 bucket metadata and object count.
 * 
 * Note: Unlike Supabase Storage, R2 bucket policies (MIME types, size limits)
 * are configured in the Cloudflare dashboard → R2 → Bucket Settings, not via API.
 * This route now serves as an R2 bucket info/diagnostics endpoint.
 */
export async function GET() {
  try {
    const r2 = getR2Client()

    // List a sample of objects to confirm read access
    const listResult = await r2.send(
      new ListObjectsV2Command({
        Bucket: env.r2BucketName,
        MaxKeys: 1,
      })
    )

    return NextResponse.json({
      action: 'info',
      bucket: env.r2BucketName,
      endpoint: env.r2Endpoint,
      publicUrl: env.r2PublicUrl,
      keyCount: listResult.KeyCount ?? 0,
      isTruncated: listResult.IsTruncated ?? false,
      note: 'R2 bucket MIME type restrictions and size limits are managed in the Cloudflare dashboard.',
    })
  } catch (error: any) {
    console.error('[R2 update-bucket]', error)
    return NextResponse.json(
      { action: 'error', message: error.message ?? 'Unknown R2 error' },
      { status: 500 }
    )
  }
}
