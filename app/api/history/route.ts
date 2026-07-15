import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getUserHistory, upsertUserProgress } from '@/lib/queries'
import { progressSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const history = await getUserHistory(user.id)
  return NextResponse.json(history)
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 120)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const body = progressSchema.parse(await request.json())
  const history = await upsertUserProgress(user.id, body)

  return NextResponse.json(history)
}
