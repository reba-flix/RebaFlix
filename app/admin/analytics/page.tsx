import { redirect } from 'next/navigation'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Eye, TrendingUp, Film, Tv, Trophy } from 'lucide-react'
import Image from 'next/image'
import { MoviePlaysChart } from '@/components/admin/MoviePlaysChart'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  // Fetch view counts for all movies
  const movies = await prisma.movie.findMany({
    select: {
      id: true,
      title: true,
      viewCount: true,
      posterUrl: true,
    },
    orderBy: { viewCount: 'desc' },
  })

  // Fetch view counts for all series
  const series = await prisma.series.findMany({
    select: {
      id: true,
      title: true,
      viewCount: true,
      posterUrl: true,
    },
    orderBy: { viewCount: 'desc' },
  })

  const topMovie = movies[0]
  const topSeries = series[0]
  const chartData = [
    ...movies.slice(0, 6).map((movie) => ({ title: movie.title, plays: movie.viewCount })),
    ...series.slice(0, 6).map((seriesItem) => ({ title: seriesItem.title, plays: seriesItem.viewCount })),
  ]
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)

  return (
    <main className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-[#E50914]" />
          View Analytics
        </h1>
        <p className="text-white/50 text-sm">Detailed breakdown of content views across the platform.</p>
      </div>

      {/* Top Content Highlights */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {/* Most Watched Movie */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-24 h-24" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#E50914] mb-4 flex items-center gap-2">
            <Film className="w-4 h-4" /> Most Watched Movie
          </h2>
          {topMovie ? (
            <div className="flex items-center gap-4 relative z-10">
              {topMovie.posterUrl && (
                <div className="relative w-16 h-24 rounded-md overflow-hidden flex-shrink-0">
                  <Image src={topMovie.posterUrl} alt={topMovie.title} fill className="object-cover" />
                </div>
              )}
              <div>
                <h3 className="font-display text-xl font-bold text-white">{topMovie.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-white/70">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">{topMovie.viewCount.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/50">No movies found.</p>
          )}
        </div>

        {/* Most Watched Series */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-24 h-24" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#E50914] mb-4 flex items-center gap-2">
            <Tv className="w-4 h-4" /> Most Watched Series
          </h2>
          {topSeries ? (
            <div className="flex items-center gap-4 relative z-10">
              {topSeries.posterUrl && (
                <div className="relative w-16 h-24 rounded-md overflow-hidden flex-shrink-0">
                  <Image src={topSeries.posterUrl} alt={topSeries.title} fill className="object-cover" />
                </div>
              )}
              <div>
                <h3 className="font-display text-xl font-bold text-white">{topSeries.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-white/70">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">{topSeries.viewCount.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/50">No series found.</p>
          )}
        </div>
      </div>

      {/* Top Content Bar Chart */}
      <div className="mb-10 rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">Top Views Bar Chart</h2>
            <p className="text-sm text-white/40">Highest viewed movies and series ranked together.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E50914]" />
            Views
          </div>
        </div>
        {chartData.length > 0 ? (
          <MoviePlaysChart data={chartData} />
        ) : (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-white/40">
            No analytics data available yet.
          </div>
        )}
      </div>

      {/* Detailed Lists */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* All Movies */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="font-semibold text-white">All Movies</h3>
          </div>
          <div className="overflow-y-auto p-4 space-y-4">
            {movies.length > 0 ? (
              movies.map((movie, index) => (
                <div key={movie.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 font-mono w-4">{index + 1}.</span>
                    <span className="font-medium text-white/90 line-clamp-1">{movie.title}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-sm">
                    <Eye className="w-3 h-3 text-white/50" />
                    <span className="text-white/70">{movie.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-center py-4">No movies data available.</p>
            )}
          </div>
        </div>

        {/* All Series */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="font-semibold text-white">All Series</h3>
          </div>
          <div className="overflow-y-auto p-4 space-y-4">
            {series.length > 0 ? (
              series.map((seriesItem, index) => (
                <div key={seriesItem.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 font-mono w-4">{index + 1}.</span>
                    <span className="font-medium text-white/90 line-clamp-1">{seriesItem.title}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-sm">
                    <Eye className="w-3 h-3 text-white/50" />
                    <span className="text-white/70">{seriesItem.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-center py-4">No series data available.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
