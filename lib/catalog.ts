import { prisma } from '@/lib/prisma'

export async function getHomeCatalog() {
  const [hero, trending, popular, newReleases, topRated, series, live, documentaries] =
    await Promise.all([
      prisma.movie.findFirst({
        where: { published: true, featured: true },
        include: { genres: { include: { genre: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: { viewCount: 'desc' },
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: { releaseDate: 'desc' },
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.findMany({
        where: { published: true },
        orderBy: { averageRating: 'desc' },
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.series.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.liveChannel.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        take: 18,
      }),
      prisma.movie.findMany({
        where: {
          published: true,
          genres: { some: { genre: { slug: 'documentaries' } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 18,
        include: { genres: { include: { genre: true } } },
      }),
    ])

  return { hero, trending, popular, newReleases, topRated, series, live, documentaries }
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
