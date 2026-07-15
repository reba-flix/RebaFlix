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

  if (!src) notFound()

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
