import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { translatorMatches } from '@/lib/translator'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 60)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  if (!query) return NextResponse.json({ suggestions: [], movies: [], series: [] })

  const [rawMovies, rawSeries] = await Promise.all([
    prisma.movie.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { genres: { some: { genre: { name: { contains: query, mode: 'insensitive' } } } } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
      include: {
        genres: { include: { genre: true } },
        parts: { where: { published: true }, select: { id: true } },
      },
    }),
    prisma.series.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { genres: { some: { genre: { name: { contains: query, mode: 'insensitive' } } } } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    }),
  ])

  const sortTranslatorMatchesFirst = <T extends { description?: string | null; createdAt?: Date }>(items: T[]) =>
    [...items].sort((a, b) => {
      const aTranslator = translatorMatches(a.description, query) ? 1 : 0
      const bTranslator = translatorMatches(b.description, query) ? 1 : 0
      if (aTranslator !== bTranslator) return bTranslator - aTranslator
      return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    })

  const movies = sortTranslatorMatchesFirst(rawMovies).slice(0, 24)
  const series = sortTranslatorMatchesFirst(rawSeries).slice(0, 24)

  const suggestions = [...movies.map((movie) => movie.title), ...series.map((item) => item.title)].slice(0, 8)

  return NextResponse.json({
    query,
    intent: 'semantic_search_ready',
    suggestions,
    movies,
    series,
  })
}
