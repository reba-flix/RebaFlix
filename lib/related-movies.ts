import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function getRelatedMovies(movieId: string, genreIds: string[]) {
  // Rank in the database before limiting, so an older multi-genre match is
  // never lost to an arbitrary candidate cutoff. Zero matches are the fallback.
  const ranked = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT m.id
    FROM "Movie" m
    LEFT JOIN "MovieGenre" mg ON mg."movieId" = m.id
      AND mg."genreId" IN (${genreIds.length ? Prisma.join(genreIds) : Prisma.sql`NULL`})
    WHERE m.published = true AND m.id <> ${movieId}
    GROUP BY m.id
    ORDER BY COUNT(mg."genreId") DESC, m."releaseDate" DESC NULLS LAST,
      m."createdAt" DESC, m.id ASC
    LIMIT 12
  `)
  const movies = await prisma.movie.findMany({
    where: { id: { in: ranked.map(({ id }) => id) }, published: true },
    include: { genres: { include: { genre: true } } },
  })
  const byId = new Map(movies.map(movie => [movie.id, movie]))
  return ranked.flatMap(({ id }) => {
    const movie = byId.get(id)
    return movie ? [movie] : []
  })
}
