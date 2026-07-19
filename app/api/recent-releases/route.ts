import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch latest 5 movies
    const movies = await prisma.movie.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        posterUrl: true,
        createdAt: true,
      },
    })

    // Fetch latest 5 series
    const series = await prisma.series.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        posterUrl: true,
        createdAt: true,
      },
    })

    // Combine and sort
    const allReleases = [
      ...movies.map(m => ({ ...m, type: 'movie' as const })),
      ...series.map(s => ({ ...s, type: 'series' as const }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
     .slice(0, 5) // Return only the most recent 5 overall

    return NextResponse.json({ releases: allReleases })
  } catch (error) {
    console.error('Error fetching recent releases:', error)
    return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 })
  }
}
