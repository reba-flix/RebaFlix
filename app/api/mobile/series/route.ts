import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited

  const items = await prisma.series.findMany({
    where: { published: true },
    orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }],
    take: 50,
    include: {
      genres: { include: { genre: true } },
      seasons: {
        orderBy: { number: 'asc' },
        include: { episodes: { where: { published: true }, orderBy: { number: 'asc' }, take: 1 } },
      },
    },
  })

  return NextResponse.json({ items })
}
