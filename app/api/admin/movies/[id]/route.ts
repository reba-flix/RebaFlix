import { NextRequest, NextResponse } from 'next/server'
import { requireUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/movies/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireUser()
  if (response) return response
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

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
      genreIds,
    } = body

    const type = body.type || 'movie'
    const finalSlug = slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    if (type === 'series') {
      // Handle Series update
      const existing = await prisma.series.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: 'Series not found' }, { status: 404 })

      // Clear existing genres to replace them
      if (genreIds) {
        await prisma.seriesGenre.deleteMany({ where: { seriesId: id } })
      }

      const series = await prisma.series.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          slug: finalSlug !== undefined ? finalSlug : undefined,
          tagline: tagline !== undefined ? tagline : undefined,
          description: description !== undefined ? description : undefined,
          posterUrl: posterUrl !== undefined ? posterUrl : undefined,
          backdropUrl: backdropUrl !== undefined ? backdropUrl : undefined,
          trailerUrl: trailerUrl !== undefined ? trailerUrl : undefined,
          downloadUrl: downloadUrl !== undefined ? downloadUrl : undefined,
          contentRating: contentRating !== undefined ? contentRating : undefined,
          featured: featured !== undefined ? Boolean(featured) : undefined,
          published: published !== undefined ? Boolean(published) : undefined,
          genres: genreIds?.length
            ? { create: genreIds.map((genreId: string) => ({ genreId })) }
            : undefined,
        },
      })
      return NextResponse.json({ item: series, type: 'series' })
    } else {
      // Handle Movie update
      const existing = await prisma.movie.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: 'Movie not found' }, { status: 404 })

      if (genreIds) {
        await prisma.movieGenre.deleteMany({ where: { movieId: id } })
      }

      const movie = await prisma.movie.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          slug: finalSlug !== undefined ? finalSlug : undefined,
          tagline: tagline !== undefined ? tagline : undefined,
          description: description !== undefined ? description : undefined,
          posterUrl: posterUrl !== undefined ? posterUrl : undefined,
          backdropUrl: backdropUrl !== undefined ? backdropUrl : undefined,
          trailerUrl: trailerUrl !== undefined ? trailerUrl : undefined,
          videoUrl: videoUrl || externalVideoUrl || undefined,
          downloadUrl: downloadUrl !== undefined ? downloadUrl : undefined,
          runtimeMinutes: runtimeMinutes !== undefined ? Number(runtimeMinutes) : undefined,
          releaseDate: releaseDate ? new Date(releaseDate) : undefined,
          contentRating: contentRating !== undefined ? contentRating : undefined,
          featured: featured !== undefined ? Boolean(featured) : undefined,
          published: published !== undefined ? Boolean(published) : undefined,
          genres: genreIds?.length
            ? { create: genreIds.map((genreId: string) => ({ genreId })) }
            : undefined,
        },
      })
      return NextResponse.json({ item: movie, type: 'movie' })
    }
  } catch (err: any) {
    console.error('[admin/movies PATCH]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to update item' }, { status: 500 })
  }
}

// DELETE /api/admin/movies/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireUser()
  if (response) return response
  if (!hasRole(user, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'movie'

  try {
    if (type === 'series') {
      await prisma.series.delete({ where: { id } })
    } else {
      await prisma.movie.delete({ where: { id } })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/movies DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
