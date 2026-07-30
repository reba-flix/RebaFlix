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
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))

  if (!movieId && !seriesId) {
    return NextResponse.json({ error: 'movieId or seriesId is required' }, { status: 400 })
  }

  const { comments, totalCount } = await getComments({ movieId, seriesId }, page, limit)
  return NextResponse.json({
    comments,
    totalCount,
    page,
    limit,
    hasMore: page * limit < totalCount,
  })
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
