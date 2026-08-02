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
  const episode = await prisma.episode.findFirst({
    where: { id, published: true },
    include: {
      subtitles: { include: { language: true } },
      season: { include: { series: true } },
    },
  })

  if (!episode?.videoUrl) return NextResponse.json({ error: 'Playback is not available' }, { status: 404 })

  const seasons = await prisma.season.findMany({
    where: { seriesId: episode.season.seriesId },
    orderBy: { number: 'asc' },
    include: { episodes: { where: { published: true }, orderBy: [{ isOldContent: 'asc' }, { number: 'asc' }] } },
  })
  const playlist = seasons.flatMap((season) => season.episodes.map((item) => ({ ...item, seasonNumber: season.number })))
  const index = playlist.findIndex((item) => item.id === episode.id)
  const next = playlist[index + 1]

  await prisma.series.update({ where: { id: episode.season.seriesId }, data: { viewCount: { increment: 1 } } })

  return NextResponse.json({
    id: episode.id,
    contentId: episode.id,
    contentType: 'episode',
    title: `${episode.season.series.title} - ${episode.title ?? `Episode ${episode.number}`}`,
    sourceUrl: episode.videoUrl,
    posterUrl: episode.thumbnailUrl ?? episode.season.series.backdropUrl,
    subtitles: episode.subtitles,
    seasons,
    currentEpisodeId: episode.id,
    nextItem: next ? { id: next.id, title: `S${next.seasonNumber} E${next.number}: ${next.title ?? `Episode ${next.number}`}`, type: 'episode' } : undefined,
  })
}
