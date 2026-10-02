import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, hasRole } from '@/lib/auth'
import { getAnalyticsReport } from '@/lib/analytics/report'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    return NextResponse.json(await getAnalyticsReport(request.nextUrl.searchParams), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Analytics is unavailable. Verify the analytics migration and database connection.' }, { status: 503 })
  }
}
