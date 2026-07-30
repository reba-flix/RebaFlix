import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const items = await prisma.liveChannel.findMany({
    where: { active: true },
    include: {
      category: true,
      language: true,
      schedules: {
        where: { endsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        take: 5,
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ items })
}
