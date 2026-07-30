import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { id } = await params
  const movie = await prisma.movie.findFirst({
    where: { published: true, OR: [{ id }, { slug: id }] },
    include: {
      genres: { include: { genre: true } },
      categories: { include: { category: true } },
      languages: { include: { language: true } },
      subtitles: { include: { language: true } },
      director: true,
      actors: { include: { person: true }, orderBy: { sortOrder: 'asc' } },
      parts: { where: { published: true }, orderBy: { number: 'asc' } },
    },
  })

  if (!movie) return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
  return NextResponse.json(movie)
}
