import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const genres = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Anime',
  'Documentaries',
  'African Movies',
  'Rwandan Movies',
  'Kids',
]

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
]

async function main() {
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Full platform administration' },
  })
  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Standard subscriber role' },
  })

  for (const name of genres) {
    await prisma.genre.upsert({
      where: { slug: name.toLowerCase().replaceAll(' ', '-') },
      update: {},
      create: { name, slug: name.toLowerCase().replaceAll(' ', '-') },
    })
    await prisma.category.upsert({
      where: { slug: name.toLowerCase().replaceAll(' ', '-') },
      update: {},
      create: { name, slug: name.toLowerCase().replaceAll(' ', '-') },
    })
  }

  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: language,
      create: language,
    })
  }

  await prisma.movie.upsert({
    where: { slug: 'kigali-nights' },
    update: {},
    create: {
      slug: 'kigali-nights',
      title: 'Kigali Nights',
      tagline: 'A RebaFlix original thriller',
      description:
        'A detective follows a quiet trail through the city after a broadcast interruption reveals a hidden conspiracy.',
      posterUrl:
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=900&auto=format&fit=crop',
      backdropUrl:
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1800&auto=format&fit=crop',
      trailerUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      runtimeMinutes: 118,
      releaseDate: new Date('2026-06-01'),
      averageRating: 4.8,
      ratingCount: 245,
      viewCount: 0,
      featured: true,
      published: true,
    },
  })

  await prisma.liveChannel.upsert({
    where: { slug: 'rebaflix-live' },
    update: {},
    create: {
      slug: 'rebaflix-live',
      name: 'RebaFlix Live',
      description: 'Original premieres, behind-the-scenes coverage, and live events.',
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      active: true,
      sortOrder: 1,
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
