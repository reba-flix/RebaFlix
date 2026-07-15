import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, hasRole } from '@/lib/auth'

// POST /api/support/[id]/reply – admin replies to a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!hasRole(user, 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const { reply } = await request.json()

    if (!reply?.trim()) {
      return NextResponse.json({ error: 'Reply is required' }, { status: 400 })
    }

    const msg = await prisma.supportMessage.update({
      where: { id },
      data: {
        reply: reply.trim(),
        repliedAt: new Date(),
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, msg })
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}
