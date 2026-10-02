import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { extractTranslator } from '@/lib/translator'

export type SearchResult = {
  id: string
  slug: string
  title: string
  posterUrl: string | null
  type: 'movie' | 'series'
  year: number | null
  genres: string[]
  translator: string | null
}

export async function autocompleteCatalog(query: string): Promise<SearchResult[]> {
  // Only public display fields leave the server; playback/download URLs are not selected.
  // Rank before LIMIT so even a one-letter query gives title matches priority.
  const rows = await prisma.$queryRaw<(Omit<SearchResult, 'translator'> & { description: string })[]>(Prisma.sql`
    WITH catalog AS (
      SELECT m.id, m.slug, m.title, m."posterUrl", m.description,
        'movie'::text AS type, EXTRACT(YEAR FROM m."releaseDate")::int AS year,
        m."createdAt", ARRAY(SELECT g.name FROM "MovieGenre" mg
          JOIN "Genre" g ON g.id = mg."genreId" WHERE mg."movieId" = m.id ORDER BY g.name) AS genres
      FROM "Movie" m WHERE m.published = true
      UNION ALL
      SELECT s.id, s.slug, s.title, s."posterUrl", s.description,
        'series'::text AS type, NULL::int AS year, s."createdAt",
        ARRAY(SELECT g.name FROM "SeriesGenre" sg
          JOIN "Genre" g ON g.id = sg."genreId" WHERE sg."seriesId" = s.id ORDER BY g.name) AS genres
      FROM "Series" s WHERE s.published = true
    )
    SELECT id, slug, title, "posterUrl", description, type, year, genres
    FROM catalog
    WHERE POSITION(LOWER(${query}) IN LOWER(title)) > 0
      OR POSITION(LOWER(${query}) IN LOWER(description)) > 0
      OR EXISTS (SELECT 1 FROM unnest(genres) AS genre WHERE POSITION(LOWER(${query}) IN LOWER(genre)) > 0)
    ORDER BY CASE
      WHEN LOWER(title) = LOWER(${query}) THEN 0
      WHEN LEFT(LOWER(title), LENGTH(${query})) = LOWER(${query}) THEN 1
      WHEN POSITION(LOWER(${query}) IN LOWER(title)) > 0 THEN 2
      WHEN POSITION(LOWER(${query}) IN LOWER(COALESCE(substring(description FROM '(?im)(?:^|\n)[[:blank:]]*Translator:[[:blank:]]*([^\r\n]+)'), ''))) > 0 THEN 3
      ELSE 4 END,
      "createdAt" DESC, title ASC, type ASC, id ASC
    LIMIT 8
  `)
  return rows.map(({ description, ...item }) => ({ ...item, translator: extractTranslator(description) }))
}
