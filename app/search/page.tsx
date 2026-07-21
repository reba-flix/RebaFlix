import { Search } from 'lucide-react'
import { ContentRow } from '@/components/content/ContentRow'
import { Input } from '@/components/ui/input'
import { prisma } from '@/lib/prisma'
import { translatorMatches } from '@/lib/translator'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const query = q.trim()
  const [rawMovies, rawSeries] = query
    ? await Promise.all([
        prisma.movie.findMany({
          where: {
            published: true,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { genres: { some: { genre: { name: { contains: query, mode: 'insensitive' } } } } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: {
            genres: { include: { genre: true } },
            parts: { where: { published: true }, select: { id: true } },
          },
        }),
        prisma.series.findMany({
          where: {
            published: true,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { genres: { some: { genre: { name: { contains: query, mode: 'insensitive' } } } } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: {
            genres: { include: { genre: true } },
            seasons: {
              include: { _count: { select: { episodes: true } } },
            },
          },
        }),
      ])
    : [[], []]

  const sortTranslatorMatchesFirst = <T extends { description?: string | null; createdAt?: Date }>(items: T[]) =>
    [...items].sort((a, b) => {
      const aTranslator = translatorMatches(a.description, query) ? 1 : 0
      const bTranslator = translatorMatches(b.description, query) ? 1 : 0
      if (aTranslator !== bTranslator) return bTranslator - aTranslator
      return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    })

  const movies = sortTranslatorMatchesFirst(rawMovies).slice(0, 50)
  const series = sortTranslatorMatchesFirst(rawSeries).slice(0, 50)

  return (
    <main className="min-h-screen space-y-8 px-4 pb-16 pt-28 md:px-8 lg:px-12">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-black md:text-6xl">Search</h1>
        <form className="relative mt-6" action="/search">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
          <Input name="q" defaultValue={query} placeholder="Try 'Rwandan drama with strong female lead'" className="h-12 pl-11" />
        </form>
        <p className="mt-3 text-sm text-white/55">
          Natural language and AI ranking can be connected through `/api/search` when an embeddings provider is configured.
        </p>
      </div>
      {query ? (
        <>
          <ContentRow title={`Movies matching "${query}"`} items={movies} />
          <ContentRow title="Series" items={series} type="series" />
        </>
      ) : null}
    </main>
  )
}
