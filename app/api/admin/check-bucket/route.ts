import { NextResponse } from 'next/server'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { getR2Client } from '@/lib/r2'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/check-bucket
 * Verifies that the configured R2 bucket is accessible.
 * R2 buckets are created and managed in the Cloudflare dashboard —
 * this route simply confirms the credentials and bucket name are correct.
 */
export async function GET() {
  try {
    const r2 = getR2Client()

    await r2.send(
      new HeadBucketCommand({ Bucket: env.r2BucketName })
    )

    return NextResponse.json({
      action: 'accessible',
      bucket: env.r2BucketName,
      endpoint: env.r2Endpoint,
    })
  } catch (error: any) {
    const statusCode = error?.$metadata?.httpStatusCode ?? 500

    if (statusCode === 403) {
      return NextResponse.json(
        { action: 'error', message: 'Access denied — check your R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.' },
        { status: 403 }
      )
    }

    if (statusCode === 404) {
      return NextResponse.json(
        { action: 'error', message: `Bucket "${env.r2BucketName}" not found. Create it in the Cloudflare R2 dashboard.` },
        { status: 404 }
      )
    }

    console.error('[R2 check-bucket]', error)
    return NextResponse.json(
      { action: 'error', message: error.message ?? 'Unknown R2 error' },
      { status: 500 }
    )
  }
}
