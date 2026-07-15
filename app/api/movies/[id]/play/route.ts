import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({ success: true, viewCount: movie.viewCount })
  } catch (error) {
    console.error('Error incrementing play count:', error)
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 })
  }
}
