import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client } from '@/lib/r2'
import { env } from '@/lib/env'

export const mediaFolders = ['posters', 'backdrops', 'trailers', 'videos', 'subtitles'] as const
export type MediaFolder = (typeof mediaFolders)[number]

export function assertMediaFolder(folder: string): MediaFolder {
  if (mediaFolders.includes(folder as MediaFolder)) return folder as MediaFolder
  throw new Error(`Invalid media folder: ${folder}`)
}

/**
 * Uploads a File to Cloudflare R2 and returns the public URL.
 * The object key is stored in the database so the URL can always be
 * reconstructed from R2_PUBLIC_URL + "/" + key.
 */
export async function uploadToR2(key: string, file: File): Promise<string> {
  const r2 = getR2Client()

  // Convert Web API File → Buffer for the AWS SDK
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await r2.send(
    new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      ContentLength: buffer.byteLength,
    })
  )

  // Build the public URL from the configured public base URL
  const publicUrl = env.r2PublicUrl
    ? `${env.r2PublicUrl.replace(/\/$/, '')}/${key}`
    : `${env.r2Endpoint.replace(/\/$/, '')}/${env.r2BucketName}/${key}`

  return publicUrl
}

/**
 * Generates a presigned URL for direct client-side upload to Cloudflare R2.
 */
export async function generatePresignedUrl(key: string, contentType: string): Promise<{ uploadUrl: string, publicUrl: string }> {
  const r2 = getR2Client()

  const command = new PutObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

  const publicUrl = env.r2PublicUrl
    ? `${env.r2PublicUrl.replace(/\/$/, '')}/${key}`
    : `${env.r2Endpoint.replace(/\/$/, '')}/${env.r2BucketName}/${key}`

  return { uploadUrl, publicUrl }
}

function getR2ObjectKey(url: string) {
  const candidates = [env.r2PublicUrl, `${env.r2Endpoint.replace(/\/$/, '')}/${env.r2BucketName}`]
    .filter(Boolean)
    .map((baseUrl) => baseUrl.replace(/\/$/, ''))

  for (const baseUrl of candidates) {
    if (url.startsWith(`${baseUrl}/`)) {
      return decodeURIComponent(url.slice(baseUrl.length + 1))
    }
  }

  return null
}

export async function generatePresignedDownloadUrl(url: string, filename: string) {
  // Check if it's a Supabase URL
  if (url.includes('.supabase.co/storage/v1/object/public/')) {
    const downloadUrl = new URL(url)
    downloadUrl.searchParams.set('download', filename)
    return downloadUrl.toString()
  }

  const key = getR2ObjectKey(url)
  if (!key || !env.r2Endpoint || !env.r2AccessKeyId || !env.r2SecretAccessKey) {
    return null
  }

  const command = new GetObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
  })

  return getSignedUrl(getR2Client(), command, { expiresIn: 60 * 10 })
}
