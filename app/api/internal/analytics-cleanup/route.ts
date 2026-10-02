import { NextRequest, NextResponse } from 'next/server'
import { cleanupAnalyticsTemporaryState } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const expected = process.env.ANALYTICS_CLEANUP_SECRET
  const provided = request.headers.get('authorization')
  if (!expected || provided !== `Bearer ${expected}`) return new NextResponse(null, { status: 404 })
  try {
    const result = await cleanupAnalyticsTemporaryState()
    return NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Cleanup unavailable' }, { status: 503 })
  }
}
