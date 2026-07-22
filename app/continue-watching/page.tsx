import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ContinueWatchingGrid } from './ContinueWatchingGrid'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Continue Watching — RebaFlix',
  description: 'Pick up right where you left off. Resume your in-progress movies and TV shows.',
}

export default async function ContinueWatchingPage() {
  let user
  try {
    user = await getSessionUser()
  } catch {
    user = null
  }

  if (!user) redirect('/login?next=/continue-watching')

  let items: any[] = []

  try {
    const histories = await prisma.history.findMany({
      where: {
        userId: user.id,
        completed: false,
        positionSeconds: { gt: 5 },
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
            genres: {
              include: { genre: { select: { name: true } } },
              take: 2,
            },
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

    items = histories.map((h) => {
      const pct =
        h.durationSeconds > 0
          ? Math.min(100, Math.round((h.positionSeconds / h.durationSeconds) * 100))
          : 0

      if (h.movie) {
        return {
          historyId: h.id,
          watchId: h.movie.id,
          type: 'movie' as const,
          title: h.movie.title,
          subtitle: null,
          slug: h.movie.slug,
          poster: h.movie.posterUrl ?? h.movie.backdropUrl,
          backdrop: h.movie.backdropUrl,
          positionSeconds: h.positionSeconds,
          durationSeconds: h.durationSeconds,
          runtimeMinutes: h.movie.runtimeMinutes,
          percentWatched: pct,
          genres: h.movie.genres.map((g) => g.genre.name),
          updatedAt: h.updatedAt.toISOString(),
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
          updatedAt: h.updatedAt.toISOString(),
        }
      }

      return null
    }).filter(Boolean)
  } catch (e) {
    console.error('[continue-watching] DB error:', e)
  }

  return (
    <main className="min-h-screen pb-16">
      <ContinueWatchingGrid items={items as any[]} />
    </main>
  )
}
