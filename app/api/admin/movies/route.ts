import { NextRequest, NextResponse } from 'next/server'
import { requireUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/movies — paginated list for admin table
export async function GET(request: NextRequest) {
  const { user, response } = await requireUser()
  if (response) return response
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, Number(searchParams.get('page')  ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 20))

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        genres:     { include: { genre: true } },
        subtitles:  { include: { language: true } },
      },
    }),
    prisma.movie.count(),
  ])

  return NextResponse.json({ movies, page, limit, total })
}

// POST /api/admin/movies — create a movie
export async function POST(request: NextRequest) {
  const { user, response } = await requireUser()
  if (response) return response
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const {
      title,
      slug,
      tagline,
      description,
      posterUrl,
      backdropUrl,
      trailerUrl,
      videoUrl,
      externalVideoUrl,
      downloadUrl,
      runtimeMinutes,
      releaseDate,
      contentRating,
      featured,
      published,
      genreIds,       // string[]
      subtitles,      // { languageId, label, url, default }[]
      isOldContent,   // boolean — if true, movie sorts to end of catalog
    } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const type = body.type || 'movie'

    if (type === 'series') {
      const existing = await prisma.series.findUnique({ where: { slug: finalSlug } })
      if (existing) return NextResponse.json({ error: `Slug "${finalSlug}" is already taken` }, { status: 409 })

      const series = await prisma.series.create({
        data: {
          title,
          slug: finalSlug,
          tagline:        tagline   || null,
          description:    body.translator ? `${description}\n\nTranslator: ${body.translator}` : description,
          posterUrl:      posterUrl || null,
          backdropUrl:    backdropUrl || null,
          trailerUrl:     trailerUrl  || null,
          downloadUrl:    downloadUrl || null,
          contentRating:  contentRating || null,
          featured:       Boolean(featured),
          published:      Boolean(published),
          isOldContent:   Boolean(isOldContent),
          genres: genreIds?.length
            ? { create: genreIds.map((genreId: string) => ({ genreId })) }
            : undefined,
        },
        include: { genres: { include: { genre: true } } },
      })
      return NextResponse.json({ item: series, type: 'series' }, { status: 201 })
    } else {
      const existing = await prisma.movie.findUnique({ where: { slug: finalSlug } })
      if (existing) return NextResponse.json({ error: `Slug "${finalSlug}" is already taken` }, { status: 409 })

      const movie = await prisma.movie.create({
        data: {
          title,
          slug: finalSlug,
          tagline:        tagline   || null,
          description:    body.translator ? `${description}\n\nTranslator: ${body.translator}` : description,
          posterUrl:      posterUrl || null,
          backdropUrl:    backdropUrl || null,
          trailerUrl:     trailerUrl  || null,
          videoUrl:       videoUrl || externalVideoUrl || null,
          downloadUrl:    downloadUrl || null,
          runtimeMinutes: runtimeMinutes ? Number(runtimeMinutes) : null,
          releaseDate:    releaseDate ? new Date(releaseDate) : null,
          contentRating:  contentRating || null,
          featured:       Boolean(featured),
          published:      Boolean(published),
          isOldContent:   Boolean(isOldContent),
          genres: genreIds?.length
            ? { create: genreIds.map((genreId: string) => ({ genreId })) }
            : undefined,
          subtitles: subtitles?.length
            ? {
                create: subtitles.map((s: any) => ({
                  languageId: s.languageId,
                  label:      s.label,
                  url:        s.url,
                  default:    Boolean(s.default),
                })),
              }
            : undefined,
        },
        include: {
          genres:    { include: { genre: true } },
          subtitles: { include: { language: true } },
        },
      })
      return NextResponse.json({ item: movie, type: 'movie' }, { status: 201 })
    }
  } catch (err: any) {
    console.error('[admin/movies POST]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create movie' }, { status: 500 })
  }
}
