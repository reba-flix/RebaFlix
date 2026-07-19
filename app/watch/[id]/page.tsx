import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { prisma } from '@/lib/prisma'
import { isExternalVideoUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ trailer?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])

  let mediaTitle = ''
  let mediaPoster: string | null = null
  let src: string | null = null
  let mediaSubtitles: any[] = []
  let mediaId = id
  let mediaContentType: 'movie' | 'episode' = 'movie'
  let seasons: any[] | undefined = undefined
  let currentEpisodeId: string | undefined = undefined
  let nextItem: { id: string; title: string } | undefined = undefined

  // Try fetching as movie first
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: { subtitles: { include: { language: true } } },
  })

  if (movie) {
    mediaTitle = movie.title
    mediaPoster = movie.backdropUrl
    src = query.trailer ? movie.trailerUrl : movie.videoUrl
    mediaSubtitles = movie.subtitles
    mediaContentType = 'movie'

    // Fetch next movie (most recent published movie that's not this one)
    if (!query.trailer) {
      const nextMovie = await prisma.movie.findFirst({
        where: { published: true, id: { not: movie.id } },
        orderBy: { createdAt: 'desc' },
      })
      if (nextMovie) {
        nextItem = { id: nextMovie.id, title: nextMovie.title }
      }
    }
  } else {
    // Try as episode
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: {
        subtitles: { include: { language: true } },
        season: {
          include: {
            series: true,
            episodes: { orderBy: { number: 'asc' } },
          },
        },
      },
    })

    if (episode) {
      mediaTitle = `${episode.season.series.title} — ${episode.title || `Episode ${episode.number}`}`
      mediaPoster = episode.thumbnailUrl || episode.season.series.backdropUrl
      src = episode.videoUrl
      mediaSubtitles = episode.subtitles
      mediaContentType = 'episode'
      currentEpisodeId = episode.id

      // Fetch all seasons + episodes for this series
      const allSeasons = await prisma.season.findMany({
        where: { seriesId: episode.season.seriesId },
        orderBy: { number: 'asc' },
        include: {
          episodes: {
            where: { published: true },
            orderBy: { number: 'asc' },
            select: { id: true, number: true, title: true, thumbnailUrl: true, runtimeMinutes: true },
          },
        },
      })
      seasons = allSeasons

      // Find next episode (same season first, then next season)
      const currentSeasonEps = episode.season.episodes.sort((a, b) => a.number - b.number)
      const currentIndex = currentSeasonEps.findIndex(e => e.id === episode.id)
      if (currentIndex >= 0 && currentIndex < currentSeasonEps.length - 1) {
        const next = currentSeasonEps[currentIndex + 1]
        nextItem = { id: next.id, title: `E${next.number}: ${next.title || `Episode ${next.number}`}` }
      } else {
        // Look for the first episode of the next season
        const nextSeasonData = allSeasons.find(s => s.number === episode.season.number + 1)
        if (nextSeasonData?.episodes?.[0]) {
          const ne = nextSeasonData.episodes[0]
          nextItem = { id: ne.id, title: `S${nextSeasonData.number} E${ne.number}: ${ne.title || `Episode ${ne.number}`}` }
        }
      }
    } else {
      notFound()
    }
  }

  if (!src) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 9.75v9A2.25 2.25 0 004.5 18.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Video Not Available</h1>
          <p className="text-white/60 mb-6">
            The video for <span className="text-white font-semibold">{mediaTitle}</span> hasn&apos;t been uploaded yet.
          </p>
          <a href="javascript:history.back()" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-md transition-colors">
            ← Go Back
          </a>
        </div>
      </main>
    )
  }

  // If external link, redirect
  if (isExternalVideoUrl(src)) {
    redirect(src)
  }

  return (
    <main className="min-h-screen bg-black flex flex-col relative">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-4 md:left-8 lg:left-12 z-50">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg shadow-black/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span className="text-sm font-semibold">Back to Home</span>
        </Link>
      </div>

      <div className="flex-1 w-full px-4 pb-8 pt-24 md:px-8 lg:px-12 flex items-center justify-center">
        <div className="w-full max-w-[1600px] mx-auto">
          <VideoPlayer
            src={src}
            poster={mediaPoster}
            title={mediaTitle}
            subtitles={mediaSubtitles.map(subtitle => ({
              src: subtitle.url,
              label: subtitle.label,
              srcLang: subtitle.language.code,
              default: subtitle.default,
            }))}
            contentId={mediaId}
            contentType={mediaContentType}
            seasons={seasons}
            currentEpisodeId={currentEpisodeId}
            nextItem={nextItem}
          />
        </div>
      </div>
    </main>
  )
}
