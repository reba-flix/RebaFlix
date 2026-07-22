import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const items = await prisma.history.findMany({
    where: {
      userId: user.id,
      completed: false,
      positionSeconds: { gt: 5 }, // only show if watched more than 5 seconds
    },
    include: {
      movie: {
        select: {
          id: true,
          slug: true,
          title: true,
          posterUrl: true,
          backdropUrl: true,
          runtimeMinutes: true,
          genres: { include: { genre: { select: { name: true } } }, take: 2 },
        },
      },
      episode: {
        select: {
          id: true,
          number: true,
          title: true,
          thumbnailUrl: true,
          runtimeMinutes: true,
          season: {
            select: {
              number: true,
              series: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  posterUrl: true,
                  backdropUrl: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  })

  // Shape items for the client
  const shaped = items.map((h) => {
    const pct = h.durationSeconds > 0
      ? Math.min(100, Math.round((h.positionSeconds / h.durationSeconds) * 100))
      : 0

    if (h.movie) {
      return {
        historyId: h.id,
        watchId: h.movie.id,
        type: 'movie' as const,
        title: h.movie.title,
        slug: h.movie.slug,
        poster: h.movie.posterUrl ?? h.movie.backdropUrl,
        backdrop: h.movie.backdropUrl,
        positionSeconds: h.positionSeconds,
        durationSeconds: h.durationSeconds,
        runtimeMinutes: h.movie.runtimeMinutes,
        percentWatched: pct,
        genres: h.movie.genres.map((g) => g.genre.name),
        updatedAt: h.updatedAt,
      }
    }

    if (h.episode) {
      const series = h.episode.season.series
      return {
        historyId: h.id,
        watchId: h.episode.id,
        type: 'episode' as const,
        title: series.title,
        subtitle: `S${h.episode.season.number} E${h.episode.number}: ${h.episode.title}`,
        slug: series.slug,
        poster: series.posterUrl ?? series.backdropUrl,
        backdrop: h.episode.thumbnailUrl ?? series.backdropUrl,
        positionSeconds: h.positionSeconds,
        durationSeconds: h.durationSeconds,
        runtimeMinutes: h.episode.runtimeMinutes,
        percentWatched: pct,
        genres: [],
        updatedAt: h.updatedAt,
      }
    }

    return null
  }).filter(Boolean)

  return NextResponse.json({ items: shaped })
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response

  const { historyId } = await request.json()
  if (!historyId) return NextResponse.json({ error: 'Missing historyId' }, { status: 400 })

  // Mark as completed so it disappears from continue watching
  await prisma.history.updateMany({
    where: { id: historyId, userId: user.id },
    data: { completed: true },
  })

  return NextResponse.json({ ok: true })
}
