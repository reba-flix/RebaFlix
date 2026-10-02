import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordContentEvent, setActionCookie } from '@/lib/analytics/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Increment the viewCount by 1
    const movie = await prisma.movie.update({
      where: { id },
      data: {
        viewCount: { increment: 1 }
      }
    })

    const body = await request.json().catch(() => ({}))
    const part = typeof body.partId === 'string' ? await prisma.moviePart.findFirst({ where: { id: body.partId, movieId: id, published: true }, select: { id: true } }) : null
    const recorded = await recordContentEvent(request, 'content_view', part?.id ?? id, part ? 'part' : 'movie')
    return setActionCookie(NextResponse.json({ success: true, viewCount: movie.viewCount }), recorded.cookieKey, request)
  } catch (error) {
    console.error('Error incrementing play count:', error)
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 })
  }
}
