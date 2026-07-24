import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Download, Languages } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { extractTranslator } from '@/lib/translator'
import { Badge } from '@/components/ui/badge'
import { PlayButton } from '@/components/content/PlayButton'
import { isExternalVideoUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function toSeriesSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeSlug(slug)
  
  let series = await prisma.series.findUnique({
    where: { slug: decodedSlug },
    include: {
      genres: { include: { genre: true } },
      seasons: {
        include: {
          episodes: {
            where: { published: true },
            orderBy: { number: 'asc' }
          }
        },
        orderBy: { number: 'asc' }
      }
    }
  })

  if (!series) {
    series = await prisma.series.findFirst({
      where: {
        published: true,
        OR: [
          { slug: toSeriesSlug(decodedSlug) },
          { title: { equals: decodedSlug, mode: 'insensitive' } },
          { title: { equals: decodedSlug.replace(/-/g, ' '), mode: 'insensitive' } },
        ],
      },
      include: {
        genres: { include: { genre: true } },
        seasons: {
          include: {
            episodes: {
              where: { published: true },
              orderBy: { number: 'asc' }
            }
          },
          orderBy: { number: 'asc' }
        }
      }
    })

    if (series && series.slug !== decodedSlug) {
      redirect(`/series/${series.slug}`)
    }
  }

  if (!series) {
    notFound()
  }

  const translator = extractTranslator(series.description)
  
  // Flatten episodes for a continuous list
  const allEpisodes = series.seasons.flatMap(s => s.episodes)

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        {(series.backdropUrl || series.posterUrl) && (
          <Image
            src={(series.backdropUrl || series.posterUrl) as string}
            alt={series.title}
            fill
            className="object-cover opacity-80 mask-image-bottom-fade"
            sizes="100vw"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        
        {/* Title and Metadata */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 lg:px-12 pb-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-white tracking-tight">
                {series.title}
              </h1>
              <div className="flex gap-2 items-center self-end pb-2">
                {series.genres.map(g => (
                  <Badge key={g.genre.id} variant="secondary" className="uppercase bg-[#E50914] text-white hover:bg-[#E50914]/90 border-transparent">
                    {g.genre.name}
                  </Badge>
                ))}
                <Badge variant="outline" className="uppercase border-[#e5a009] text-[#e5a009] bg-[#e5a009]/10">
                  SEASON
                </Badge>
              </div>
            </div>
            
            {/* Translator Section */}
            {translator && (
              <div className="flex items-center gap-3 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/10 mt-2">
                <div className="bg-primary/20 p-1.5 rounded-full">
                  <Languages className="w-5 h-5 text-primary-400" />
                </div>
                <span className="font-semibold text-white/90 text-sm md:text-base">{translator}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watch / Download Section */}
      <div className="px-4 md:px-8 lg:px-12 py-8 pb-24 max-w-5xl">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Watch / Download</h2>
        
        <div className="flex flex-col gap-3">
          {allEpisodes.length > 0 ? (
            allEpisodes.map((episode, index) => (
              <div 
                key={episode.id}
                className="flex items-center justify-between p-4 md:p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {episode.title || `Episode ${index + 1}`}
                  </h3>
                </div>
                
                <div className="flex items-center gap-3">
                  {isExternalVideoUrl(episode.videoUrl) ? (
                    <PlayButton
                      href={episode.videoUrl!}
                      contentId={episode.id}
                      contentType="episode"
                      label="Watch"
                      className="flex items-center gap-2 bg-[#E50914] hover:bg-[#E50914]/90 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-md font-bold transition-all text-sm md:text-base"
                    />
                  ) : (
                    <Link 
                      href={`/watch/${episode.id}`}
                      className="flex items-center gap-2 bg-[#E50914] hover:bg-[#E50914]/90 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-md font-bold transition-all text-sm md:text-base"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Watch
                    </Link>
                  )}
                  <a 
                    href={`/api/episodes/${episode.id}/download`}
                    target="_blank"
                    className="flex items-center gap-2 bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 md:px-5 py-2 md:py-2.5 rounded-md font-medium transition-all text-sm md:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-white/50 border border-white/10 rounded-xl bg-white/5">
              No episodes available for this series yet.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
