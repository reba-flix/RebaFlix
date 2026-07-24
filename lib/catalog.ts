import { prisma } from '@/lib/prisma'

export async function getHomeCatalog() {
  const [hero, trendingMovies, trendingSeries, popularMovies, popularSeries, newReleases, newSeries, topRated, series, kids, action, comedy, drama, horror, anime] =
    await Promise.all([
      prisma.movie.findFirst({
        where: { published: true, featured: true },
        include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { viewCount: 'desc' }, { updatedAt: 'desc' }],
        take: 18,
        include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.series.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { viewCount: 'desc' }, { updatedAt: 'desc' }],
        take: 18,
        include: {
          genres: { include: { genre: true } },
          seasons: {
            orderBy: { number: 'desc' },
            take: 1,
            select: {
              createdAt: true,
              episodes: {
                orderBy: { number: 'desc' },
                take: 1,
                select: { number: true, createdAt: true },
              },
            },
          },
        },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { viewCount: 'desc' }],
        take: 18,
        include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.series.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { viewCount: 'desc' }],
        take: 18,
        include: {
          genres: { include: { genre: true } },
          seasons: {
            orderBy: { number: 'desc' },
            take: 1,
            select: {
              createdAt: true,
              episodes: {
                orderBy: { number: 'desc' },
                take: 1,
                select: { number: true, createdAt: true },
              },
            },
          },
        },
      }),
      // New Releases: movies created recently OR movies that got new parts recently
      prisma.movie.findMany({
        where: {
          published: true,
          isOldContent: false,
          OR: [
            { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
            { parts: { some: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } } }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        take: 24,
        include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true, createdAt: true } } },
      }),
      // New Series: series created recently OR series that got new seasons/episodes recently
      prisma.series.findMany({
        where: {
          published: true,
          isOldContent: false,
          OR: [
            // Series itself was newly created
            { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
            // OR an existing series got a new season recently
            {
              seasons: {
                some: {
                  createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
                },
              },
            },
            // OR an existing series got a new episode recently
            {
              seasons: {
                some: {
                  episodes: {
                    some: {
                      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
                    },
                  },
                },
              },
            },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 24,
        include: {
          genres: { include: { genre: true } },
          seasons: {
            orderBy: { number: 'desc' },
            take: 1,
            select: {
              createdAt: true,
              episodes: {
                orderBy: { number: 'desc' },
                take: 1,
                select: { number: true, createdAt: true },
              },
            },
          },
        },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { averageRating: 'desc' }],
        take: 18,
        include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.series.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }],
        take: 18,
        include: {
          genres: { include: { genre: true } },
          seasons: {
            include: { episodes: { select: { number: true } } },
          },
        },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'kids', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'action', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'comedy', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'drama', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'horror', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'anime', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { updatedAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } }, parts: { where: { published: true }, select: { id: true } } },
      }),
    ])

  const taggedTrendingMovies = (trendingMovies || []).map((item: any) => ({
    ...item,
    itemType: 'movie' as const,
    partCount: (item.parts?.length ?? 0) + (item.videoUrl ? 1 : 0),
  }))

  const taggedTrendingSeries = (trendingSeries || []).map((item: any) => {
    const latestEp = item.seasons?.[0]?.episodes?.[0]
    const latestEpisodeNumber = latestEp?.number ?? undefined
    return {
      ...item,
      itemType: 'series' as const,
      latestEpisodeNumber,
    }
  })

  const trending = [...taggedTrendingMovies, ...taggedTrendingSeries].sort((a: any, b: any) => {
    const aOld = a.isOldContent ? 1 : 0
    const bOld = b.isOldContent ? 1 : 0
    if (aOld !== bOld) return aOld - bOld

    const aViews = a.viewCount || 0
    const bViews = b.viewCount || 0
    if (bViews !== aViews) return bViews - aViews

    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bTime - aTime
  })

  const taggedPopularMovies = (popularMovies || []).map((item: any) => ({
    ...item,
    itemType: 'movie' as const,
    partCount: (item.parts?.length ?? 0) + (item.videoUrl ? 1 : 0),
  }))

  const taggedPopularSeries = (popularSeries || []).map((item: any) => {
    const latestEp = item.seasons?.[0]?.episodes?.[0]
    const latestEpisodeNumber = latestEp?.number ?? undefined
    return {
      ...item,
      itemType: 'series' as const,
      latestEpisodeNumber,
    }
  })

  const popular = [...taggedPopularMovies, ...taggedPopularSeries].sort((a: any, b: any) => {
    const aOld = a.isOldContent ? 1 : 0
    const bOld = b.isOldContent ? 1 : 0
    if (aOld !== bOld) return aOld - bOld

    const aViews = a.viewCount || 0
    const bViews = b.viewCount || 0
    return bViews - aViews
  })

  return { hero, trending, popular, newReleases, newSeries, topRated, series, kids, action, comedy, drama, horror, anime }
}

export const demoPosters = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=900&auto=format&fit=crop',
]

export const fallbackRows = {
  trending: ['Kigali Nights', 'The Last Drum', 'Nyungwe Signal', 'Lake Kivu Run'],
  popular: ['Rwanda Rising', 'The Bridge Home', 'Imigongo', 'Beyond the Hills'],
  newReleases: ['Umurage', 'Rain Over Nyarugenge', 'The Archive', 'Midnight Market'],
  topRated: ['Echoes of Reba', 'Kingdom Road', 'City of Thousand Hills', 'The Witness'],
  documentaries: ['Made in Kigali', 'Gorilla Guardians', 'Coffee Routes', 'Rwanda Reborn'],
}
