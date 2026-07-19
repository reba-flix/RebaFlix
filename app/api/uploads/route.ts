import { NextRequest, NextResponse } from 'next/server'
import { hasRole, requireUser } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { assertMediaFolder, uploadToR2 } from '@/lib/storage'
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
  const limited = rateLimit(request, 10)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await request.formData()
  const file = form.get('file')
  const folder = String(form.get('folder') ?? 'posters')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
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
  const fileMime = file.type || ''
  if (allowedTypes.length > 0 && !allowedTypes.some(t => fileMime.startsWith(t.split('/')[0]))) {
    const friendlyAllowed = allowedTypes.join(', ')
    return NextResponse.json(
      { error: `File type "${fileMime}" is not allowed for folder "${mediaFolder}". Allowed: ${friendlyAllowed}` },
      { status: 415 }
    )
  }

  // Build a safe, unique object key: folder/uuid-originalname
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const key = `${mediaFolder}/${crypto.randomUUID()}-${safeName}`

  try {
    const url = await uploadToR2(key, file)
    return NextResponse.json({ bucket: env.r2BucketName, key, url }, { status: 201 })
  } catch (error: any) {
    console.error('[R2 Upload Error]', error)
    return NextResponse.json({ error: error.message || 'Storage provider error' }, { status: 500 })
  }
}
