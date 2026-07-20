import { NextRequest, NextResponse } from 'next/server'
import { hasRole, requireUser } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { assertMediaFolder, generatePresignedUrl } from '@/lib/storage'
import { env } from '@/lib/env'
import crypto from 'node:crypto'

// Allowed MIME types per folder
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  posters:   ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  backdrops: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  trailers:  ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'],
  videos:    ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'],
  subtitles: ['text/vtt', 'text/plain', 'application/x-subrip'],
}

export async function POST(request: NextRequest) {
  // Admin batch uploads can request several presigned URLs at once
  // (poster, backdrop, and video for up to 10 movies).
  const limited = rateLimit(request, 60)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const { filename, contentType, folder = 'posters' } = body

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })
  }

  // Validate media folder
  let mediaFolder: ReturnType<typeof assertMediaFolder>
  try {
    mediaFolder = assertMediaFolder(folder)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid folder' }, { status: 400 })
  }

  // Validate MIME type for the target folder
  const allowedTypes = ALLOWED_MIME_TYPES[mediaFolder] ?? []
  if (allowedTypes.length > 0 && !allowedTypes.some(t => contentType.startsWith(t.split('/')[0]))) {
    const friendlyAllowed = allowedTypes.join(', ')
    return NextResponse.json(
      { error: `File type "${contentType}" is not allowed for folder "${mediaFolder}". Allowed: ${friendlyAllowed}` },
      { status: 415 }
    )
  }

  // Build a safe, unique object key: folder/uuid-originalname
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-')
  const key = `${mediaFolder}/${crypto.randomUUID()}-${safeName}`

  try {
    const { uploadUrl, publicUrl } = await generatePresignedUrl(key, contentType)
    return NextResponse.json({ bucket: env.r2BucketName, key, uploadUrl, url: publicUrl }, { status: 201 })
  } catch (error: any) {
    console.error('[R2 Presign Error]', error)
    return NextResponse.json({ error: error.message || 'Storage provider error' }, { status: 500 })
  }
}
