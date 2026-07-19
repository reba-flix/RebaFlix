import { S3Client } from '@aws-sdk/client-s3'
import { env } from '@/lib/env'

// Singleton S3Client configured for Cloudflare R2.
// R2 is S3-compatible so we point the AWS SDK at the R2 endpoint.
let _client: InstanceType<typeof S3Client> | null = null

export function getR2Client() {
  if (!_client) {
    if (!env.r2Endpoint || !env.r2AccessKeyId || !env.r2SecretAccessKey) {
      throw new Error(
        'Cloudflare R2 is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.'
      )
    }

    _client = new S3Client({
      region: 'auto', // R2 requires region "auto"
      endpoint: env.r2Endpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    })
  }

  return _client
}
