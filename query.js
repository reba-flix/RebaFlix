const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const series = await prisma.series.findMany({
    where: {
      title: { contains: 'I Will Find You', mode: 'insensitive' }
    }
  })
  console.log(JSON.stringify(series, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
