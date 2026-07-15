const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.movie.updateMany({ data: { viewCount: 0 } })
  console.log('Reset', result.count, 'movies to 0 plays')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
