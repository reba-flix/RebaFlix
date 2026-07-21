import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clapperboard, Download, Play } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AddMoviePartForm } from './AddMoviePartForm'

export const dynamic = 'force-dynamic'

export default async function AdminMoviePartsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const { id } = await params
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      parts: { orderBy: { number: 'asc' } },
    },
  })

  if (!movie) redirect('/admin/movies')

  const maxPartNumber = movie.parts.reduce((max, part) => Math.max(max, part.number), 0)
  const hasOriginalUpload = Boolean(movie.videoUrl)
  const totalParts = movie.parts.length + (hasOriginalUpload ? 1 : 0)
  const nextPartNumber = Math.max(maxPartNumber, hasOriginalUpload ? 1 : 0) + 1
  const partLabel = (index: number) => `Part ${String.fromCharCode(65 + index)}`

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/movies" className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
              Manage Parts: {movie.title}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Add or update numbered parts for this movie.
              {totalParts > 0 && (
                <span className="ml-2 text-white/30">({totalParts} part{totalParts !== 1 ? 's' : ''} total)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          {totalParts > 0 ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-5 py-3">
                <Clapperboard className="h-5 w-5 text-primary-400" />
                <h3 className="text-lg font-bold text-white">Uploaded Movie Parts</h3>
                <span className="ml-auto text-xs text-white/30">{totalParts} part{totalParts !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-white/5">
                {hasOriginalUpload ? (
                  <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white/70">
                          {partLabel(0)}
                        </span>
                        <span className="font-medium text-white/90">{movie.title}</span>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Original upload</span>
                      </div>
                      <div className="max-w-sm truncate text-xs text-white/40">{movie.videoUrl}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10">
                        <Link href={`/watch/${movie.id}`} target="_blank">
                          <Play className="mr-1 h-3.5 w-3.5" /> Test
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10">
                        <a href={`/api/movies/${movie.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1 h-3.5 w-3.5" /> Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : null}

                {movie.parts.map((part, index) => (
                  <div key={part.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white/70">
                          {partLabel(index + (hasOriginalUpload ? 1 : 0))}
                        </span>
                        <span className="font-medium text-white/90">{part.title}</span>
                        {part.published ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Published</span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">Draft</span>
                        )}
                      </div>
                      <div className="max-w-sm truncate text-xs text-white/40">{part.videoUrl}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10">
                        <Link href={`/watch/${part.id}`} target="_blank">
                          <Play className="mr-1 h-3.5 w-3.5" /> Test
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10">
                        <a href={`/api/movies/${part.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1 h-3.5 w-3.5" /> Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10">
              <p className="text-white/40">No parts added yet. Add one using the form.</p>
            </div>
          )}
        </div>

        <AddMoviePartForm movieId={movie.id} defaultPartNumber={nextPartNumber} />
      </div>
    </main>
  )
}
