import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { ContentGrid } from '@/components/content/ContentGrid'

export const dynamic = 'force-dynamic'

async function BrowseContent({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const query = await searchParams
  const type = query.type
  const category = query.category

  let items: any[] = []
  let title = 'Browse All'

  if (category === 'new') {
    title = 'New & Popular'
    const movies = await prisma.movie.findMany({
      where: { published: true },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      include: { parts: { where: { published: true }, select: { id: true } } },
    })
    items = movies.map(item => ({ ...item, type: 'movie' }))
  } else if (type === 'series') {
    title = 'TV Series'
    const series = await prisma.series.findMany({
      where: { published: true },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      include: {
        seasons: {
          include: { episodes: { select: { number: true } } },
        },
      },
    })
    items = series.map(item => ({ ...item, type: 'series' }))
  } else if (type === 'movie') {
    title = 'Movies'
    const movies = await prisma.movie.findMany({
      where: { published: true },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      include: { parts: { where: { published: true }, select: { id: true } } },
    })
    items = movies.map(item => ({ ...item, type: 'movie' }))
  } else {
    // Just fetch some movies for general browse
    const movies = await prisma.movie.findMany({
      where: { published: true },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      include: { parts: { where: { published: true }, select: { id: true } } },
    })
    items = movies.map(item => ({ ...item, type: 'movie' }))
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-12">
      <h1 className="text-3xl font-bold font-display mb-8">{title}</h1>
      {items.length > 0 ? (
        <ContentGrid items={items} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-white/50">
          <p>No content found.</p>
        </div>
      )}
    </main>
  )
}

export default function BrowsePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 px-8 text-center text-white/50">Loading...</div>}>
      <BrowseContent searchParams={searchParams} />
    </Suspense>
  )
}
