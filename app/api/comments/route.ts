import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createComment, getComments } from '@/lib/queries'
import { rateLimit } from '@/lib/rate-limit'
import { commentSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('movieId') ?? undefined
  const seriesId = searchParams.get('seriesId') ?? undefined

  if (!movieId && !seriesId) {
    return NextResponse.json({ error: 'movieId or seriesId is required' }, { status: 400 })
  }

  const comments = await getComments({ movieId, seriesId })
  return NextResponse.json(comments)
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 30)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const body = commentSchema.parse(await request.json())
  if (!body.movieId && !body.seriesId) {
    return NextResponse.json({ error: 'movieId or seriesId is required' }, { status: 400 })
  }

  const comment = await createComment(user.id, body)
  return NextResponse.json(comment, { status: 201 })
}
