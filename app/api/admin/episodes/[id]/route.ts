import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getAdmin() {
  const user = await getSessionUser()
  if (!user || !hasRole(user, 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

async function revalidateEpisodePaths(seriesId: string) {
  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { slug: true },
  })

  revalidatePath(`/admin/series/${seriesId}/episodes`)
  if (series?.slug) revalidatePath(`/series/${series.slug}`)
  revalidatePath('/', 'page')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await getAdmin()
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json()
  const seasonNumber = Number(body.seasonNumber)
  const episodeNumber = Number(body.episodeNumber)
  const title = String(body.title || '').trim()
  const videoUrl = String(body.videoUrl || '').trim()
  const published = body.published === undefined ? undefined : Boolean(body.published)

  if (!Number.isInteger(seasonNumber) || seasonNumber < 1) {
    return NextResponse.json({ error: 'A valid season number is required.' }, { status: 400 })
  }

  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    return NextResponse.json({ error: 'A valid episode number is required.' }, { status: 400 })
  }

  if (!title) {
    return NextResponse.json({ error: 'Episode title is required.' }, { status: 400 })
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'Episode video URL is required.' }, { status: 400 })
  }

  try {
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: { season: { select: { id: true, seriesId: true } } },
    })

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found.' }, { status: 404 })
    }

    let season = await prisma.season.findUnique({
      where: {
        seriesId_number: {
          seriesId: episode.season.seriesId,
          number: seasonNumber,
        },
      },
    })

    if (!season) {
      season = await prisma.season.create({
        data: {
          seriesId: episode.season.seriesId,
          number: seasonNumber,
          title: `Season ${seasonNumber}`,
        },
      })
    }

    const conflict = await prisma.episode.findUnique({
      where: {
        seasonId_number: {
          seasonId: season.id,
          number: episodeNumber,
        },
      },
      select: { id: true },
    })

    if (conflict && conflict.id !== id) {
      return NextResponse.json(
        { error: `Season ${seasonNumber} already has episode ${episodeNumber}.` },
        { status: 409 }
      )
    }

    const updated = await prisma.episode.update({
      where: { id },
      data: {
        seasonId: season.id,
        number: episodeNumber,
        title,
        videoUrl,
        published,
      },
    })

    await prisma.season.deleteMany({
      where: {
        id: episode.season.id,
        episodes: { none: {} },
      },
    })

    await revalidateEpisodePaths(episode.season.seriesId)

    return NextResponse.json({ episode: updated })
  } catch (err: any) {
    console.error('[admin/episodes PATCH]', err)
    return NextResponse.json({ error: err?.message || 'Failed to update episode.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await getAdmin()
  if (unauthorized) return unauthorized

  const { id } = await params

  try {
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: { season: { select: { id: true, seriesId: true } } },
    })

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found.' }, { status: 404 })
    }

    await prisma.episode.delete({ where: { id } })
    await prisma.season.deleteMany({
      where: {
        id: episode.season.id,
        episodes: { none: {} },
      },
    })

    await revalidateEpisodePaths(episode.season.seriesId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/episodes DELETE]', err)
    return NextResponse.json({ error: err?.message || 'Failed to delete episode.' }, { status: 500 })
  }
}
