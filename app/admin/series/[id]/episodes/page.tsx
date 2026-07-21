import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ArrowLeft, Layers, Play } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AddEpisodeForm } from './AddEpisodeForm'
import { EpisodeActions } from './EpisodeActions'

export const dynamic = 'force-dynamic'

export default async function AdminSeriesEpisodesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const { id } = await params
  const series = await prisma.series.findUnique({
    where: { id },
    include: {
      seasons: {
        include: { episodes: { orderBy: { number: 'asc' } } },
        orderBy: { number: 'asc' }
      }
    }
  })

  if (!series) redirect('/admin/series')

  // Calculate the next suggested episode number
  const allEpisodes = series.seasons.flatMap(s => s.episodes)
  const maxEpNumber = allEpisodes.reduce((max, ep) => Math.max(max, ep.number), 0)
  const nextEpisodeNumber = maxEpNumber + 1

  // Get the latest season number
  const latestSeasonNumber = series.seasons.length > 0
    ? Math.max(...series.seasons.map(s => s.number))
    : 1

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/series" className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
              Manage Episodes: {series.title}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Add or edit episodes for this series.
              {allEpisodes.length > 0 && (
                <span className="ml-2 text-white/30">({allEpisodes.length} episode{allEpisodes.length !== 1 ? 's' : ''} total)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form to Add Episode */}
        <div className="lg:col-span-1">
          <AddEpisodeForm
            seriesId={series.id}
            defaultSeasonNumber={latestSeasonNumber}
            defaultEpisodeNumber={nextEpisodeNumber}
          />
        </div>

        {/* Right Column: List of Episodes */}
        <div className="lg:col-span-2">
          {series.seasons.length > 0 ? (
            <div className="flex flex-col gap-6">
              {series.seasons.map((season) => (
                <div key={season.id} className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary-400" />
                    <h3 className="font-bold text-white text-lg">Season {season.number}</h3>
                    <span className="ml-auto text-xs text-white/30">{season.episodes.length} ep{season.episodes.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {season.episodes.length > 0 ? season.episodes.map((episode) => (
                      <div key={episode.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded">
                              EP {episode.number}
                            </span>
                            <span className="font-medium text-white/90">
                              {episode.title}
                            </span>
                            {episode.published ? (
                              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Published</span>
                            ) : (
                              <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Draft</span>
                            )}
                          </div>
                            <div className="text-xs text-white/40 truncate max-w-sm">
                              {episode.videoUrl}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="sm" asChild className="bg-transparent border-white/20 text-white hover:bg-white/10">
                              <Link href={`/watch/${episode.id}`} target="_blank">
                                <Play className="w-3.5 h-3.5 mr-1" /> Test
                              </Link>
                            </Button>
                            <EpisodeActions
                              episode={{
                                id: episode.id,
                                seasonNumber: season.number,
                                number: episode.number,
                                title: episode.title,
                                videoUrl: episode.videoUrl || '',
                                published: episode.published,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-4 text-sm text-white/40">No episodes in this season yet.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center border border-white/10 rounded-xl border-dashed">
              <p className="text-white/40">No seasons or episodes added yet. Add one using the form.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
