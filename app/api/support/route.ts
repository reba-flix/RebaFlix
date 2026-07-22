import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/support – send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const user = await getSessionUser()

    const msg = await prisma.supportMessage.create({
      data: {
        message: message.trim(),
        userId: user?.id ?? null,
        guestName: user ? (user.name ?? user.email.split('@')[0]) : 'Guest',
        guestEmail: user ? user.email : (sessionId ?? null),
      },
    })

    return NextResponse.json({ success: true, id: msg.id })
  } catch (error) {
    console.error('Support message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// GET /api/support – fetch messages for the current user (or all for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!user && !sessionId) return NextResponse.json({ messages: [] })

    const messages = await prisma.supportMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Only fetch the last 100 messages for the global chat
      include: {
        user: { 
          select: { 
            name: true, 
            email: true, 
            avatarUrl: true,
            roles: { include: { role: true } }
          } 
        }
      }
    })

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error('Fetch support messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
