const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const movie = await prisma.movie.findUnique({
    where: { id: 'cmrrummj90000712xeu6jg8n3' }
  })
  console.log(movie)
}
main().finally(() => prisma.$disconnect())
