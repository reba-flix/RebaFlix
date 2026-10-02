import { NextResponse } from 'next/server'
import { getSessionUser, hasRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ error: 'Visitor-level visit reports have been retired. Use aggregate content analytics.' }, { status: 410, headers: { 'Cache-Control': 'private, no-store' } })
}
