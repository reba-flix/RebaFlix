import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePresignedDownloadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

function safeFilename(value: string) {
  const filename = value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return filename || 'episode'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const episode = await prisma.episode.findUnique({
    where: { id },
    include: {
      season: {
        include: {
          series: {
            select: { title: true, published: true },
          },
        },
      },
    },
  })

  if (!episode || !episode.published || !episode.season.series.published) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
  }

  if (!episode.videoUrl) {
    return NextResponse.json({ error: 'No downloadable video is available for this episode.' }, { status: 404 })
  }

  const filename = safeFilename(
    `${episode.season.series.title} S${episode.season.number}E${episode.number} ${episode.title || ''}.mp4`
  )

  const signedDownloadUrl = await generatePresignedDownloadUrl(episode.videoUrl, filename)
  const downloadUrl = signedDownloadUrl ?? episode.videoUrl

  return NextResponse.redirect(new URL(downloadUrl, request.url))
}
