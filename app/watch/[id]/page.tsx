import { notFound, redirect } from 'next/navigation'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { prisma } from '@/lib/prisma'
import { isExternalVideoUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function WatchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ trailer?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  
  let mediaTitle = ''
  let mediaPoster: string | null = null
  let src: string | null = null
  let mediaSubtitles: any[] = []
  let mediaId = id
  let mediaContentType: 'movie' | 'episode' = 'movie'

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
  } else {
    // If not a movie, try fetching as an episode
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: { 
        subtitles: { include: { language: true } },
        season: { include: { series: true } }
      },
    })
    
    if (episode) {
      mediaTitle = `${episode.season.series.title} - ${episode.title || `Episode ${episode.number}`}`
      mediaPoster = episode.thumbnailUrl || episode.season.series.backdropUrl
      src = episode.videoUrl
      mediaSubtitles = episode.subtitles
      mediaContentType = 'episode'
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
          <p className="text-white/60 mb-6">The video for <span className="text-white font-semibold">{mediaTitle}</span> hasn&apos;t been uploaded yet. Please check back later or contact the admin.</p>
          <a href="javascript:history.back()" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-md transition-colors">
            ← Go Back
          </a>
        </div>
      </main>
    )
  }

  // If the video is an external link, redirect the user there
  if (isExternalVideoUrl(src)) {
    redirect(src)
  }


  return (
    <main className="min-h-screen bg-black px-4 pb-8 pt-24 md:px-8 lg:px-12">
      <VideoPlayer
        src={src}
        poster={mediaPoster}
        title={mediaTitle}
        subtitles={mediaSubtitles.map((subtitle) => ({
          src: subtitle.url,
          label: subtitle.label,
          srcLang: subtitle.language.code,
          default: subtitle.default,
        }))}
        contentId={mediaId}
        contentType={mediaContentType}
      />
    </main>
  )
}
