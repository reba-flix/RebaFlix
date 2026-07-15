import { NextResponse } from 'next/server'
import { requireUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { user, response } = await requireUser()
  if (response) return response
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [genres, languages] = await Promise.all([
    prisma.genre.findMany({ orderBy: { name: 'asc' } }),
    prisma.language.findMany({ orderBy: { name: 'asc' } }),
  ])

  return NextResponse.json({ genres, languages })
}
