import { NextRequest, NextResponse } from 'next/server'
import { sameOrigin } from '@/lib/analytics/server'

// Compatibility response for stale clients: site-visit session profiles are retired.
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 })
  return new NextResponse(null, { status: 204 })
}
