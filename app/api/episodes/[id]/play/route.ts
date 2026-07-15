import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Look up the episode to find its parent series
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: { season: { select: { seriesId: true } } },
    })

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    // Increment viewCount on the parent Series
    const series = await prisma.series.update({
      where: { id: episode.season.seriesId },
      data: {
        viewCount: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true, viewCount: series.viewCount })
  } catch (error) {
    console.error('Error incrementing episode play count:', error)
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 })
  }
}
