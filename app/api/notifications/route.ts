import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getUserNotifications } from '@/lib/queries'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const notifications = await getUserNotifications(user.id)

  return NextResponse.json(notifications)
}
