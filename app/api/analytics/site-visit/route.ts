import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : null
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null

    let userId: string | null = null
    try {
      const user = await getSessionUser()
      userId = user?.id ?? null
    } catch {
      userId = null
    }

    await prisma.analyticsEvent.create({
      data: {
        userId,
        name: 'site_visit',
        path,
        metadata: {
          referrer,
          userAgent,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording site visit:', error)
    return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 })
  }
}
