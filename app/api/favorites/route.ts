import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { addUserFavorite, getUserFavorites } from '@/lib/queries'
import { favoriteSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const favorites = await getUserFavorites(user.id)
  return NextResponse.json(favorites)
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 40)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const body = favoriteSchema.parse(await request.json())
  const favorite = await addUserFavorite(user.id, body)

  return NextResponse.json(favorite, { status: 201 })
}
