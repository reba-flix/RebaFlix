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
  const channel = await prisma.liveChannel.findFirst({ where: { active: true, OR: [{ id }, { slug: id }] } })
  if (!channel?.streamUrl) return NextResponse.json({ error: 'Live channel not found' }, { status: 404 })

  return NextResponse.json({
    id: channel.id,
    contentId: channel.id,
    contentType: 'live',
    title: channel.name,
    sourceUrl: channel.streamUrl,
    posterUrl: channel.logoUrl,
    subtitles: [],
  })
}
