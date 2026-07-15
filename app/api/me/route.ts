import { NextResponse } from 'next/server'
import { getSessionUser, hasRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null, isAdmin: false })
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    isAdmin: hasRole(user, 'ADMIN'),
  })
}
