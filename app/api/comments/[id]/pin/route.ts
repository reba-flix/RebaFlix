import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, hasRole } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, 10)
  if (limited) return limited

  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  
  try {
    const body = await request.json()
    const isPinned = Boolean(body.isPinned)

    const updated = await prisma.comment.update({
      where: { id },
      data: { isPinned },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error toggling pin:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}
