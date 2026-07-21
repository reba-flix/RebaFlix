import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Clock, Play, Star, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ContentRow } from '@/components/content/ContentRow'
import { PlayButton } from '@/components/content/PlayButton'
import { prisma } from '@/lib/prisma'
import { formatRuntime, isExternalVideoUrl } from '@/lib/utils'
import { WatchLaterButton } from './WatchLaterButton'

export const dynamic = 'force-dynamic'

export default async function MoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const movie = await prisma.movie.findUnique({
    where: { slug },
    include: {
      director: true,
      actors: { include: { person: true }, orderBy: { sortOrder: 'asc' } },
      genres: { include: { genre: true } },
      languages: { include: { language: true } },
      subtitles: { include: { language: true } },
      parts: { where: { published: true }, orderBy: { number: 'asc' } },
      comments: { include: { user: true }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })

  if (!movie) notFound()

  const related = await prisma.movie.findMany({
    where: {
      id: { not: movie.id },
      published: true,
      genres: { some: { genreId: { in: movie.genres.map((item) => item.genreId) } } },
    },
    take: 12,
    include: { genres: { include: { genre: true } } },
  })

  const watchParts = [
    ...(movie.videoUrl
      ? [{
          id: movie.id,
          title: movie.title,
          videoUrl: movie.videoUrl,
          downloadId: movie.id,
        }]
      : []),
    ...movie.parts.map((part) => ({
      id: part.id,
      title: part.title,
      videoUrl: part.videoUrl,
      downloadId: part.id,
    })),
  ]
  const shouldShowParts = movie.parts.length > 0
  const partLabel = (index: number) => `Part ${String.fromCharCode(65 + index)}`

  return (
    <main className="min-h-screen pb-16">
      <section className="relative min-h-[72vh] overflow-hidden">
        {movie.backdropUrl ? (
          <Image src={movie.backdropUrl} alt={movie.title} fill priority sizes="100vw" className="object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#141414_0%,rgba(20,20,20,0.78)_40%,rgba(20,20,20,0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#141414] to-transparent" />
        <div className="relative z-10 flex min-h-[72vh] max-w-4xl flex-col justify-end px-4 pb-20 pt-32 md:px-8 lg:px-12">
          <div className="mb-4 flex flex-wrap gap-2">
            {movie.genres.map(({ genre }) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>
          <h1 className="font-display text-5xl font-black md:text-7xl">{movie.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm font-semibold text-white/75">
            <span className="inline-flex items-center gap-1 text-yellow-300">
              <Star className="h-4 w-4 fill-current" /> {movie.averageRating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatRuntime(movie.runtimeMinutes)}
            </span>
            {movie.releaseDate ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {movie.releaseDate.getFullYear()}
              </span>
            ) : null}
            {movie.contentRating ? <Badge variant="outline">{movie.contentRating.replace('_', '-')}</Badge> : null}
          </div>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/78">{movie.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {isExternalVideoUrl(movie.videoUrl) ? (
              <PlayButton
                href={movie.videoUrl!}
                contentId={movie.id}
                contentType="movie"
                label="Play on External Site"
                className="inline-flex items-center gap-2 bg-white text-black hover:bg-white/90 font-bold px-6 py-3 rounded-md text-base transition-colors"
              />
            ) : (
              <Button asChild size="lg" variant="white">
                <Link href={`/watch/${movie.id}`}>
                  <Play className="h-5 w-5 fill-current" />
                  Play
                </Link>
              </Button>
            )}

            {movie.trailerUrl ? (
              <Button asChild size="lg" variant="secondary">
                <Link href={`/watch/${movie.id}?trailer=1`}>Watch Trailer</Link>
              </Button>
            ) : null}

            <WatchLaterButton movieId={movie.id} />

            {movie.downloadUrl || movie.videoUrl ? (
              <Button asChild size="lg" variant="default" className="bg-primary-600 hover:bg-primary-700">
                <a href={`/api/movies/${movie.id}/download`} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Download
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-8 px-4 md:px-8 lg:grid-cols-[1fr_22rem] lg:px-12">
        <div className="space-y-8">
          {shouldShowParts ? (
            <div>
              <h2 className="mb-3 font-display text-2xl font-bold">Watch / Download</h2>
              <div className="space-y-3">
                {watchParts.map((part, index) => (
                  <article key={part.id} className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-white">{partLabel(index)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3">
                      {isExternalVideoUrl(part.videoUrl) ? (
                        <PlayButton
                          href={part.videoUrl}
                          contentId={movie.id}
                          contentType="movie"
                          label="Watch"
                          className="inline-flex items-center gap-2 rounded-md bg-[#E50914] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b80710]"
                        />
                      ) : (
                        <Button asChild className="bg-[#E50914] text-white hover:bg-[#b80710]">
                          <Link href={`/watch/${part.id}`}>
                            <Play className="h-4 w-4 fill-current" />
                            Watch
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                        <a href={`/api/movies/${part.downloadId}/download`} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="mb-3 font-display text-2xl font-bold">Cast & Crew</h2>
            <p className="text-white/70">Director: {movie.director?.name ?? 'RebaFlix Studios'}</p>
            <p className="mt-2 text-white/70">
              Actors: {movie.actors.map(({ person }) => person.name).join(', ') || 'To be announced'}
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-display text-2xl font-bold">Comments</h2>
            <div className="space-y-3">
              {movie.comments.length ? (
                movie.comments.map((comment) => (
                  <article key={comment.id} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold">{comment.user.name ?? comment.user.email}</p>
                    <p className="mt-2 text-white/70">{comment.body}</p>
                  </article>
                ))
              ) : (
                <p className="text-white/60">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
        <aside className="space-y-4 rounded-md border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-display text-xl font-bold">Details</h2>
          <p className="text-sm text-white/65">Languages: {movie.languages.map(({ language }) => language.name).join(', ') || 'English'}</p>
          <p className="text-sm text-white/65">Subtitles: {movie.subtitles.map((subtitle) => subtitle.label).join(', ') || 'Available soon'}</p>
          <p className="text-sm text-white/65">Runtime: {formatRuntime(movie.runtimeMinutes)}</p>
          <p className="text-sm text-white/65">Ratings: {movie.ratingCount.toLocaleString()} reviews</p>
        </aside>
      </section>

      <div className="mt-12">
        <ContentRow title="Related Movies" items={related} />
      </div>
    </main>
  )
}
