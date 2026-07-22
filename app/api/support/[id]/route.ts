import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function getMessageAndVerify(id: string, request: NextRequest) {
  const user = await getSessionUser()
  const { searchParams } = new URL(request.url)
  let sessionId = searchParams.get('sessionId')

  // If no sessionId in query, try to get from body
  if (!sessionId) {
    try {
      const clonedRequest = request.clone()
      const body = await clonedRequest.json()
      sessionId = body.sessionId
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  if (!id) return { error: 'Missing message ID', status: 400 }
  if (!user && !sessionId) return { error: 'Unauthorized', status: 401 }

  const message = await prisma.supportMessage.findUnique({ where: { id } })
  if (!message) return { error: 'Message not found', status: 404 }

  const isMyMessage = user ? message.userId === user.id : message.guestEmail === sessionId

  if (!isMyMessage) {
    return { error: 'Forbidden', status: 403 }
  }

  return { message }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await getMessageAndVerify(id, request)
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const updated = await prisma.supportMessage.update({
      where: { id },
      data: { message: message.trim() },
    })

    return NextResponse.json({ success: true, message: updated })
  } catch (error) {
    console.error('Update support message error:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await getMessageAndVerify(id, request)
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

    await prisma.supportMessage.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete support message error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
