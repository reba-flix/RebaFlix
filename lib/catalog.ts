import { prisma } from '@/lib/prisma'

export async function getHomeCatalog() {
  const [hero, trending, popular, newReleases, newSeries, topRated, series, kids, action, comedy, drama, horror, anime] =
    await Promise.all([
      prisma.movie.findFirst({
        where: { published: true, featured: true },
        include: { genres: { include: { genre: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { viewCount: 'desc' }],
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, isOldContent: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.series.findMany({
        where: { published: true, isOldContent: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          genres: { include: { genre: true } },
          seasons: {
            include: { _count: { select: { episodes: true } } },
          },
        },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { averageRating: 'desc' }],
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.series.findMany({
        where: { published: true },
        orderBy: [{ isOldContent: 'asc' }, { createdAt: 'desc' }],
        take: 18,
        include: {
          genres: { include: { genre: true } },
          seasons: {
            include: { _count: { select: { episodes: true } } },
          },
        },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'kids', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { createdAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'action', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { createdAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'comedy', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { createdAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'drama', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { createdAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'horror', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { createdAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true, genres: { some: { genre: { name: { contains: 'anime', mode: 'insensitive' } } } } },
        orderBy: [{ isOldContent: 'asc' }, { createdAt: 'desc' }], take: 18, include: { genres: { include: { genre: true } } },
      }),
    ])

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
