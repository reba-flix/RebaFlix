import { NextRequest, NextResponse } from 'next/server'
import { hasRole, requireUser } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { assertMediaFolder, uploadToSupabaseStorage } from '@/lib/storage'
import { env } from '@/lib/env'

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

  let mediaFolder: ReturnType<typeof assertMediaFolder>
  try {
    mediaFolder = assertMediaFolder(folder)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid folder' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const key = `${mediaFolder}/${crypto.randomUUID()}-${safeName}`
  
  try {
    const url = await uploadToSupabaseStorage(key, file)
    return NextResponse.json({ bucket: env.supabaseStorageBucket, key, url }, { status: 201 })
  } catch (error: any) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ error: error.message || 'Storage provider error' }, { status: 500 })
  }
}
