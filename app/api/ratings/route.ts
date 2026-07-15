import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { upsertUserRating } from '@/lib/queries'
import { ratingSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 30)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const body = ratingSchema.parse(await request.json())
  const rating = await upsertUserRating(user.id, body)

  return NextResponse.json(rating)
}
