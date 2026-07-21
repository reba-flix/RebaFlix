import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePresignedDownloadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

function safeFilename(value: string) {
  const filename = value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return filename || 'movie'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const movie = await prisma.movie.findUnique({
    where: { id },
    select: {
      title: true,
      published: true,
      downloadUrl: true,
      videoUrl: true,
    },
  })

  if (!movie || !movie.published) {
    const part = await prisma.moviePart.findUnique({
      where: { id },
      select: {
        title: true,
        videoUrl: true,
        downloadUrl: true,
        published: true,
        movie: {
          select: {
            title: true,
            published: true,
          },
        },
      },
    })

    if (!part || !part.published || !part.movie.published) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    const sourceUrl = part.downloadUrl || part.videoUrl
    if (!sourceUrl) {
      return NextResponse.json({ error: 'No downloadable video is available for this movie part.' }, { status: 404 })
    }

    const filename = safeFilename(`${part.movie.title} - ${part.title}.mp4`)
    const signedDownloadUrl = await generatePresignedDownloadUrl(sourceUrl, filename)
    const downloadUrl = signedDownloadUrl ?? sourceUrl

    return NextResponse.redirect(new URL(downloadUrl, request.url))
  }

  const sourceUrl = movie.downloadUrl || movie.videoUrl
  if (!sourceUrl) {
    return NextResponse.json({ error: 'No downloadable video is available for this movie.' }, { status: 404 })
  }

  const filename = safeFilename(`${movie.title}.mp4`)
  const signedDownloadUrl = await generatePresignedDownloadUrl(sourceUrl, filename)
  const downloadUrl = signedDownloadUrl ?? sourceUrl

  return NextResponse.redirect(new URL(downloadUrl, request.url))
}
