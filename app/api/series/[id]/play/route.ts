import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordContentEvent, setActionCookie } from '@/lib/analytics/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const series = await prisma.series.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    })

    const recorded = await recordContentEvent(request, 'content_view', id, 'series')
    return setActionCookie(NextResponse.json({ success: true, viewCount: series.viewCount }), recorded.cookieKey, request)
  } catch (error) {
    console.error('Error incrementing series play count:', error)
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 })
  }
}
