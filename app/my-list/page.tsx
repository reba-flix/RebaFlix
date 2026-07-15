import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MyListTabs } from './MyListTabs'

export const dynamic = 'force-dynamic'

export default async function MyListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  let user
  try {
    user = await getSessionUser()
  } catch (e) {
    console.error('[my-list] getSessionUser error:', e)
    user = null
  }

  if (!user) redirect('/login?next=/my-list')

  let favorites: any[] = []
  let watchLaterFlat: any[] = []

  try {
    const [favs, later] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: user.id },
        include: { movie: true, series: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.watchLater.findMany({
        where: { userId: user.id },
        include: { movie: true, series: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    favorites = favs.map((f) => {
      if (f.movie) return { ...f.movie, type: 'movie' }
      if (f.series) return { ...f.series, type: 'series' }
      return null
    }).filter(Boolean) as any[]

    watchLaterFlat = later.map((w) => {
      if (w.movie) return { ...w.movie, type: 'movie' }
      if (w.series) return { ...w.series, type: 'series' }
      return null
    }).filter(Boolean) as any[]
  } catch (e) {
    console.error('[my-list] DB query error:', e)
  }

  const { tab } = await searchParams
  const initialTab = tab === 'later' ? 'later' : 'list'

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-12">
      <h1 className="text-3xl font-bold font-display mb-8">My List</h1>
      <MyListTabs
        favorites={favorites}
        watchLater={watchLaterFlat}
        initialTab={initialTab}
      />
    </main>
  )
}
