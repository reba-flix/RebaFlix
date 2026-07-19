import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, hasRole } from '@/lib/auth'
import { z } from 'zod'

const bulkMovieSchema = z.array(z.object({
  title: z.string().min(1),
  type: z.enum(['movie', 'series']).default('movie'),
  description: z.string().optional(),
  releaseYear: z.number().optional(),
  externalVideoUrl: z.string().url().optional().or(z.literal('')),
  posterUrl: z.string().url().optional().or(z.literal('')),
}))

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user || !hasRole(user, 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = bulkMovieSchema.safeParse(body.movies)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data format', details: parsed.error.issues }, { status: 400 })
    }

    const items = parsed.data
    let createdCount = 0

    // For simplicity, we create them one by one to handle slugs safely, or we can use createMany
    // Since some might be series and some might be movies, we iterate
    for (const item of items) {
      const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
      const releaseDate = item.releaseYear ? new Date(`${item.releaseYear}-01-01T00:00:00Z`) : null

      if (item.type === 'movie') {
        await prisma.movie.create({
          data: {
            title: item.title,
            slug,
            description: item.description || '',
            releaseDate,
            videoUrl: item.externalVideoUrl || null,
            posterUrl: item.posterUrl || null,
            published: true, // auto-publish for bulk
          }
        })
      } else {
        await prisma.series.create({
          data: {
            title: item.title,
            slug,
            description: item.description || '',
            posterUrl: item.posterUrl || null,
            published: true,
          }
        })
      }
      createdCount++
    }

    return NextResponse.json({ success: true, count: createdCount })
  } catch (error: any) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
