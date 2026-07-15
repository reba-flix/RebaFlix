import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { removeUserMovieFavorite } from '@/lib/queries'
import { rateLimit } from '@/lib/rate-limit'

export async function DELETE(request: NextRequest, context: { params: Promise<{ movieId: string }> }) {
  const limited = rateLimit(request, 40)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const { movieId } = await context.params
  await removeUserMovieFavorite(user.id, movieId)
  return NextResponse.json({ ok: true })
}
