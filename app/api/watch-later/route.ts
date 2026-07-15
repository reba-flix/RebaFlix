import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { addWatchLater, getWatchLater } from '@/lib/queries'
import { rateLimit } from '@/lib/rate-limit'
import { favoriteSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const items = await getWatchLater(user.id)
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 40)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const body = favoriteSchema.parse(await request.json())
  if (!body.movieId && !body.seriesId && !body.episodeId) {
    return NextResponse.json({ error: 'movieId, seriesId, or episodeId is required' }, { status: 400 })
  }

  const item = await addWatchLater(user.id, body)
  return NextResponse.json(item, { status: 201 })
}
