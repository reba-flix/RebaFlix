import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { id } = await params
  const series = await prisma.series.findFirst({
    where: { published: true, OR: [{ id }, { slug: id }] },
    include: {
      genres: { include: { genre: true } },
      categories: { include: { category: true } },
      director: true,
      actors: { include: { person: true }, orderBy: { sortOrder: 'asc' } },
      seasons: {
        orderBy: { number: 'asc' },
        include: {
          episodes: {
            where: { published: true },
            orderBy: { number: 'asc' },
            include: { subtitles: { include: { language: true } } },
          },
        },
      },
    },
  })

  if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 })
  return NextResponse.json(series)
}
