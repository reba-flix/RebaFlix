import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/support – send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, guestName, guestEmail } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const user = await getSessionUser()

    const msg = await prisma.supportMessage.create({
      data: {
        message: message.trim(),
        userId: user?.id ?? null,
        guestName: user ? null : (guestName?.trim() ?? 'Guest'),
        guestEmail: user ? null : (guestEmail?.trim() ?? null),
      },
    })

    return NextResponse.json({ success: true, id: msg.id })
  } catch (error) {
    console.error('Support message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// GET /api/support – fetch messages for the current user (or all for admin)
export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ messages: [] })

    const messages = await prisma.supportMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Fetch support messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
