import { NextRequest, NextResponse } from 'next/server'
import { getHomeCatalog } from '@/lib/catalog'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const catalog = await getHomeCatalog()
  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=600',
    },
  })
}
