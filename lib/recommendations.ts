import { prisma } from '@/lib/prisma'

export async function getRecommendedForUser(userId?: string) {
  if (!userId) {
    return prisma.movie.findMany({
      where: { published: true },
      orderBy: [{ averageRating: 'desc' }, { viewCount: 'desc' }],
      take: 20,
      include: { genres: { include: { genre: true } } },
    })
  }

  const recent = await prisma.history.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 25,
    include: {
      movie: { include: { genres: true } },
      episode: {
        include: {
          season: {
            include: {
              series: { include: { genres: true } },
            },
          },
        },
      },
    },
  })

  const genreIds = new Set<string>()
  recent.forEach((item) => {
    item.movie?.genres.forEach((genre) => genreIds.add(genre.genreId))
    item.episode?.season.series.genres.forEach((genre) => genreIds.add(genre.genreId))
  })

  return prisma.movie.findMany({
    where: {
      published: true,
      genres: genreIds.size ? { some: { genreId: { in: [...genreIds] } } } : undefined,
    },
    orderBy: [{ averageRating: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
    take: 20,
    include: { genres: { include: { genre: true } } },
  })
}
