import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 60)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  if (!query) return NextResponse.json({ suggestions: [], movies: [], series: [] })

  const [movies, series] = await Promise.all([
    prisma.movie.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { genres: { some: { genre: { name: { contains: query, mode: 'insensitive' } } } } },
        ],
      },
      orderBy: [{ averageRating: 'desc' }, { viewCount: 'desc' }],
      take: 12,
    }),
    prisma.series.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 12,
    }),
  ])

  const suggestions = [...movies.map((movie) => movie.title), ...series.map((item) => item.title)].slice(0, 8)

  return NextResponse.json({
    query,
    intent: 'semantic_search_ready',
    suggestions,
    movies,
    series,
  })
}
