import { NextRequest, NextResponse } from 'next/server'
import { getPublishedMovies } from '@/lib/queries'
import { paginationSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams))
  const genre = searchParams.get('genre')
  const q = searchParams.get('q')

  const [items, total] = await getPublishedMovies({ page, limit, genre, q })

  return NextResponse.json({ items, page, limit, total })
}
