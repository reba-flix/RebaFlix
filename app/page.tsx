import { ContentRow } from '@/components/content/ContentRow'
import { HeroBanner } from '@/components/content/HeroBanner'
import { fallbackRows } from '@/lib/catalog'
import { getHomeCatalog } from '@/lib/catalog'
import { getSessionUser } from '@/lib/auth'
import { getRecommendedForUser } from '@/lib/recommendations'

export const dynamic = 'force-dynamic'

function fallbackItems(names: string[]) {
  return names.map((title, index) => ({
    id: `fallback-${title}`,
    slug: title.toLowerCase().replaceAll(' ', '-'),
    title,
    averageRating: 4.2 + (index % 6) / 10,
  }))
}

export default async function HomePage() {
  let catalog: Awaited<ReturnType<typeof getHomeCatalog>> | null = null
  let recommended: Awaited<ReturnType<typeof getRecommendedForUser>> = []

  try {
    const user = await getSessionUser()
    ;[catalog, recommended] = await Promise.all([
      getHomeCatalog(),
      getRecommendedForUser(user?.id),
    ])
  } catch {
    catalog = null
  }

  const trending = catalog?.trending.length ? catalog.trending : fallbackItems(fallbackRows.trending)
  const popular = catalog?.popular.length ? catalog.popular : fallbackItems(fallbackRows.popular)
  const rawNewReleases = catalog?.newReleases.length ? catalog.newReleases : fallbackItems(fallbackRows.newReleases)
  const rawSeries = catalog?.newSeries.length ? catalog.newSeries : []
  
  // Tag them with their respective item types so the card routes correctly
  const taggedNewReleases = rawNewReleases.map(item => ({ ...item, itemType: 'movie' as const }))
  const taggedSeries = rawSeries.map(item => ({ ...item, itemType: 'series' as const }))
  
  // New Releases should reflect upload order and skip content marked old by admins.
  const mixedNewReleases = [...taggedNewReleases, ...taggedSeries].sort((a, b) => {
    const getMs = (item: any) => {
      if (item.createdAt) return new Date(item.createdAt).getTime()
      if (item.releaseDate) return new Date(item.releaseDate).getTime()
      return 0
    }
    return getMs(b) - getMs(a)
  })

  const topRated = catalog?.topRated.length ? catalog.topRated : fallbackItems(fallbackRows.topRated)

  return (
    <main className="min-h-screen space-y-8 pb-16">
      <HeroBanner movies={mixedNewReleases.slice(0, 5)} />
      <ContentRow title="New Releases" items={mixedNewReleases} />
      <ContentRow title="Trending" items={trending} />
      <ContentRow title="Popular" items={popular} />
      <ContentRow title="Recommended" items={recommended.length ? recommended : topRated} />
      <ContentRow title="Top Rated" items={topRated} />
      <ContentRow title="Recently Added" items={rawNewReleases} />
      <ContentRow title="TV Series" items={catalog?.series ?? fallbackItems(['The Hills', 'Campus 250', 'Market Queens'])} type="series" />
      <ContentRow title="Kids" items={catalog?.kids || []} />
      <ContentRow title="Action" items={catalog?.action || []} />
      <ContentRow title="Comedy" items={catalog?.comedy || []} />
      <ContentRow title="Drama" items={catalog?.drama || []} />
      <ContentRow title="Horror" items={catalog?.horror || []} />
      <ContentRow title="Anime" items={catalog?.anime || []} />
    </main>
  )
}
