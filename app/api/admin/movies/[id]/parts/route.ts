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

  const { id: movieId } = await params
  const body = await request.json()
  const partNumber = Number(body.partNumber)
  const title = String(body.title || '').trim()
  const videoUrl = String(body.videoUrl || '').trim()
  const downloadUrl = String(body.downloadUrl || '').trim()

  if (!movieId) {
    return NextResponse.json({ error: 'Movie ID is required.' }, { status: 400 })
  }

  if (!Number.isInteger(partNumber) || partNumber < 1) {
    return NextResponse.json({ error: 'A valid part number is required.' }, { status: 400 })
  }

  if (!title) {
    return NextResponse.json({ error: 'Part title is required.' }, { status: 400 })
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'Please provide a video URL or upload a video file.' }, { status: 400 })
  }

  try {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { slug: true },
    })

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found.' }, { status: 404 })
    }

    const [part] = await prisma.$transaction([
      prisma.moviePart.upsert({
        where: {
          movieId_number: {
            movieId,
            number: partNumber,
          },
        },
        create: {
          movieId,
          number: partNumber,
          title,
          videoUrl,
          downloadUrl: downloadUrl || null,
          published: true,
        },
        update: {
          title,
          videoUrl,
          downloadUrl: downloadUrl || null,
          published: true,
        },
      }),
      prisma.movie.update({
        where: { id: movieId },
        data: { updatedAt: new Date() },
      }),
    ])

    revalidatePath(`/admin/movies/${movieId}/parts`)
    revalidatePath(`/movie/${movie.slug}`)
    revalidatePath('/', 'page')

    return NextResponse.json({ part }, { status: 201 })
  } catch (err: any) {
    console.error('[admin/movie parts POST]', err)
    return NextResponse.json({ error: err?.message || 'Failed to save movie part.' }, { status: 500 })
  }
}
