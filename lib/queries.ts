import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export function getPublishedMovies(args: {
  page: number
  limit: number
  genre?: string | null
  q?: string | null
}) {
  const where: Prisma.MovieWhereInput = {
    published: true,
    ...(args.genre ? { genres: { some: { genre: { slug: args.genre } } } } : {}),
    ...(args.q
      ? {
          OR: [
            { title: { contains: args.q, mode: 'insensitive' } },
            { description: { contains: args.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  return Promise.all([
    prisma.movie.findMany({
      where,
      skip: (args.page - 1) * args.limit,
      take: args.limit,
      orderBy: { createdAt: 'desc' },
      include: { genres: { include: { genre: true } } },
    }),
    prisma.movie.count({ where }),
  ])
}

export function getUserFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: { movie: true, series: true, episode: true },
    orderBy: { createdAt: 'desc' },
  })
}

export function addUserFavorite(userId: string, data: Omit<Prisma.FavoriteUncheckedCreateInput, 'userId'>) {
  return prisma.favorite.create({
    data: { ...data, userId },
  })
}

export function removeUserMovieFavorite(userId: string, movieId: string) {
  return prisma.favorite.deleteMany({ where: { userId, movieId } })
}

export function getUserHistory(userId: string) {
  return prisma.history.findMany({
    where: { userId },
    include: { movie: true, episode: { include: { season: { include: { series: true } } } } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })
}

export function upsertUserProgress(userId: string, data: Omit<Prisma.HistoryUncheckedCreateInput, 'userId'>) {
  const where = data.movieId
    ? { userId_movieId: { userId, movieId: data.movieId } }
    : { userId_episodeId: { userId, episodeId: data.episodeId! } }

  return prisma.history.upsert({
    where,
    update: data,
    create: { userId, ...data },
  })
}

export function upsertUserRating(userId: string, data: Omit<Prisma.RatingUncheckedCreateInput, 'userId'>) {
  return prisma.rating.upsert({
    where: data.movieId
      ? { userId_movieId: { userId, movieId: data.movieId } }
      : { userId_seriesId: { userId, seriesId: data.seriesId! } },
    update: data,
    create: { userId, ...data },
  })
}

export function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export function getComments(target: { movieId?: string; seriesId?: string }) {
  return prisma.comment.findMany({
    where: target,
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export function createComment(userId: string, data: { movieId?: string; seriesId?: string; body: string }) {
  return prisma.comment.create({
    data: { userId, ...data },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  })
}

export function getWatchLater(userId: string) {
  return prisma.watchLater.findMany({
    where: { userId },
    include: { movie: true, series: true, episode: true },
    orderBy: { createdAt: 'desc' },
  })
}

export function addWatchLater(userId: string, data: Omit<Prisma.WatchLaterUncheckedCreateInput, 'userId'>) {
  return prisma.watchLater.create({ data: { userId, ...data } })
}
