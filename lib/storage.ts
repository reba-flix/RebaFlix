import { PutObjectCommand } from '@aws-sdk/client-s3'
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
