const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const series = await prisma.series.findMany()
  for (const s of series) {
    const properSlug = toSlug(s.title)
    if (s.slug !== properSlug) {
      console.log(`Fixing series slug: ${s.slug} -> ${properSlug}`)
      try {
        await prisma.series.update({
          where: { id: s.id },
          data: { slug: properSlug }
        })
      } catch (e) {
        console.error(`Failed to update ${s.title}: ${e.message}`)
      }
    }
  }

  const movies = await prisma.movie.findMany()
  for (const m of movies) {
    const properSlug = toSlug(m.title)
    if (m.slug !== properSlug) {
      console.log(`Fixing movie slug: ${m.slug} -> ${properSlug}`)
      try {
        await prisma.movie.update({
          where: { id: m.id },
          data: { slug: properSlug }
        })
      } catch (e) {
        console.error(`Failed to update ${m.title}: ${e.message}`)
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
