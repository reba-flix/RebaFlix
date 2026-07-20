import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user || !hasRole(user, 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: seriesId } = await params
  const body = await request.json()
  const seasonNumber = Number(body.seasonNumber)
  const episodeNumber = Number(body.episodeNumber)
  const title = String(body.title || '').trim()
  const videoUrl = String(body.videoUrl || '').trim()

  if (!seriesId || !Number.isInteger(seasonNumber) || seasonNumber < 1) {
    return NextResponse.json({ error: 'A valid season number is required.' }, { status: 400 })
  }

  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    return NextResponse.json({ error: 'A valid episode number is required.' }, { status: 400 })
  }

  if (!title) {
    return NextResponse.json({ error: 'Episode title is required.' }, { status: 400 })
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'Please provide a video URL or upload a video file.' }, { status: 400 })
  }

  try {
    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { slug: true },
    })

    if (!series) {
      return NextResponse.json({ error: 'Series not found.' }, { status: 404 })
    }

    let season = await prisma.season.findUnique({
      where: {
        seriesId_number: {
          seriesId,
          number: seasonNumber,
        },
      },
    })

    if (!season) {
      season = await prisma.season.create({
        data: {
          seriesId,
          number: seasonNumber,
          title: `Season ${seasonNumber}`,
        },
      })
    }

    const episode = await prisma.episode.upsert({
      where: {
        seasonId_number: {
          seasonId: season.id,
          number: episodeNumber,
        },
      },
      create: {
        seasonId: season.id,
        number: episodeNumber,
        title,
        videoUrl,
        published: true,
      },
      update: {
        title,
        videoUrl,
        published: true,
      },
    })

    revalidatePath(`/admin/series/${seriesId}/episodes`)
    revalidatePath(`/series/${series.slug}`)
    revalidatePath('/', 'page')

    return NextResponse.json({ episode }, { status: 201 })
  } catch (err: any) {
    console.error('[admin/series episodes POST]', err)
    return NextResponse.json({ error: err?.message || 'Failed to save episode.' }, { status: 500 })
  }
}
