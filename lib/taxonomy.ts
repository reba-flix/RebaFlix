import { prisma } from '@/lib/prisma'
import { defaultGenres, slugifyTaxonomyName } from '@/lib/taxonomy-data'

export { defaultGenres, slugifyTaxonomyName }

export async function ensureDefaultGenres() {
  await Promise.all(
    defaultGenres.map((name) =>
      prisma.genre.upsert({
        where: { slug: slugifyTaxonomyName(name) },
        update: { name },
        create: { name, slug: slugifyTaxonomyName(name) },
      })
    )
  )
}
