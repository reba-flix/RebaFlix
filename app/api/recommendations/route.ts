import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getRecommendedForUser } from '@/lib/recommendations'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const user = await getSessionUser()
  const recommendations = await getRecommendedForUser(user?.id)

  return NextResponse.json({
    strategy: user ? 'personalized_genre_collaborative_seed' : 'anonymous_trending_quality',
    items: recommendations,
  })
}
