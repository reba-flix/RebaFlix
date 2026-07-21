import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      where: { published: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        posterUrl: true,
        createdAt: true,
        updatedAt: true,
        videoUrl: true,
        parts: { where: { published: true }, select: { id: true } },
      },
    })

    const series = await prisma.series.findMany({
      where: { published: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        posterUrl: true,
        createdAt: true,
        updatedAt: true,
        seasons: {
          select: {
            episodes: {
              select: { number: true },
              where: { published: true },
            },
          },
        },
      },
    })

    const allReleases = [
      ...movies.map(m => ({
        ...m,
        type: 'movie' as const,
        partCount: m.parts.length + (m.videoUrl ? 1 : 0),
      })),
      ...series.map(s => ({
        ...s,
        type: 'series' as const,
        latestEpisodeNumber: s.seasons.reduce((max, season) => {
          const seasonMax = season.episodes.reduce((episodeMax, episode) => Math.max(episodeMax, episode.number), 0)
          return Math.max(max, seasonMax)
        }, 0),
      }))
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
     .slice(0, 5) // Return only the most recent 5 overall

    return NextResponse.json({ releases: allReleases })
  } catch (error) {
    console.error('Error fetching recent releases:', error)
    return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 })
  }
}
