import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request, 60)
  if (limited) return limited

  const { user, response } = await requireUser(request)
  if (response || !user) return response

  const { id } = await params
  const movie = await prisma.movie.findFirst({
    where: { published: true, OR: [{ id }, { slug: id }] },
    include: { subtitles: { include: { language: true } }, parts: { where: { published: true }, orderBy: { number: 'asc' } } },
  })

  if (!movie?.videoUrl) return NextResponse.json({ error: 'Playback is not available' }, { status: 404 })

  await prisma.movie.update({ where: { id: movie.id }, data: { viewCount: { increment: 1 } } })

  return NextResponse.json({
    id: movie.id,
    contentId: movie.id,
    contentType: 'movie',
    title: movie.title,
    sourceUrl: movie.videoUrl,
    posterUrl: movie.backdropUrl ?? movie.posterUrl,
    subtitles: movie.subtitles,
    nextItem: movie.parts[0] ? { id: movie.parts[0].id, title: movie.parts[0].title ?? 'Part B', type: 'movie' } : undefined,
  })
}
