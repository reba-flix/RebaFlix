import { prisma } from '@/lib/prisma'

const promotionInclude = {
  movie: {
    include: {
      genres: { include: { genre: true } },
      parts: { where: { published: true }, select: { id: true } },
    },
  },
  series: {
    include: {
      genres: { include: { genre: true } },
      seasons: {
        orderBy: { number: 'desc' as const },
        take: 1,
        select: {
          number: true,
          episodes: {
            orderBy: { number: 'desc' as const },
            take: 1,
            select: { number: true, isFinal: true },
          },
        },
      },
    },
  },
}

export async function getHomepagePromotions({ activeOnly = true } = {}) {
  return prisma.homepagePromotion.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: promotionInclude,
  })
}

export async function getActivePromotionItems(): Promise<any[]> {
  const promotions = await getHomepagePromotions()

  const items: any[] = []

  for (const promotion of promotions) {
    if (promotion.contentType === 'MOVIE' && promotion.movie?.published) {
      items.push({
        ...promotion.movie,
        itemType: 'movie' as const,
        partCount: (promotion.movie.parts?.length ?? 0) + (promotion.movie.videoUrl ? 1 : 0),
      })
    }

    if (promotion.contentType === 'SERIES' && promotion.series?.published) {
      const latestSeason = promotion.series.seasons?.[0]
      const latestEp = latestSeason?.episodes?.[0]

      items.push({
        ...promotion.series,
        itemType: 'series' as const,
        latestEpisodeNumber: latestEp?.number ?? undefined,
        latestSeasonNumber: latestSeason?.number ?? undefined,
        isFinalEpisode: latestEp?.isFinal ?? false,
      })
    }
  }

  return items
}