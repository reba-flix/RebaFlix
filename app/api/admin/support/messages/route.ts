import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, hasRole } from '@/lib/auth'

// GET /api/admin/support/messages - Fetch all support messages for admin
export async function GET() {
  try {
    const user = await getSessionUser()
    if (!hasRole(user, 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const messages = await prisma.supportMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true } },
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to fetch admin messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
