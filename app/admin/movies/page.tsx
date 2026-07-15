import Link from 'next/link'
import { Plus, Pencil, Trash2, Film, Play, TrendingUp, Eye } from 'lucide-react'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MoviePlaysChart } from '@/components/admin/MoviePlaysChart'

export const dynamic = 'force-dynamic'

export default async function AdminMoviesPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const movies = await prisma.movie.findMany({
    orderBy: { createdAt: 'desc' },
    include: { genres: { include: { genre: true } } },
  })

  const totalPlays = movies.reduce((sum, m) => sum + m.viewCount, 0)
  const totalPublished = movies.filter((m) => m.published).length
  const mostWatched = [...movies].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)

  const chartData = mostWatched.map((m) => ({
    title: m.title,
    plays: m.viewCount,
  }))

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Film className="w-8 h-8 text-[#E50914]" />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Movies & Series</h1>
            <p className="text-white/50 text-sm mt-1">Manage content and track play counts.</p>
          </div>
        </div>
        <Link
          href="/admin/movies/new"
          className="flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#E50914]/20 w-fit"
        >
          <Plus className="w-4 h-4" /> Add Movie
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Movies', value: movies.length, icon: Film, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Published', value: totalPublished, icon: Eye, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Plays', value: totalPlays.toLocaleString(), icon: Play, color: 'text-[#E50914]', bg: 'bg-[#E50914]/10' },
          { label: 'Most Watched', value: mostWatched[0]?.title.slice(0, 14) + (mostWatched[0]?.title.length > 14 ? '…' : '') || 'N/A', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="group bg-[#1a1a1a] rounded-xl border border-white/5 p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-all">
            <div className={`p-3 rounded-lg ${bg} ${color} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/50 mb-1">{label}</p>
              <p className="text-xl font-bold text-white truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top Movies */}
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* Chart */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Top 5 Most Played</h2>
          {chartData.length > 0 ? (
            <MoviePlaysChart data={chartData} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-white/40 text-sm">
              No play data yet. Plays are counted when users hit the Play button.
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Play Count Leaderboard</h2>
          <div className="space-y-3">
            {mostWatched.length > 0 ? mostWatched.map((movie, i) => (
              <div key={movie.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-500/20 text-amber-400' :
                  i === 1 ? 'bg-slate-400/20 text-slate-300' :
                  i === 2 ? 'bg-orange-700/20 text-orange-400' :
                  'bg-white/5 text-white/50'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{movie.title}</p>
                  <p className="text-xs text-white/40">{movie.published ? 'Published' : 'Draft'}</p>
                </div>
                <div className="flex items-center gap-1 text-[#E50914] shrink-0">
                  <Play className="w-3 h-3 fill-current" />
                  <span className="text-sm font-bold">{movie.viewCount.toLocaleString()}</span>
                </div>
              </div>
            )) : (
              <p className="text-white/40 text-sm py-8 text-center">No movies added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* All Movies Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">All Movies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Title</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Play className="w-3 h-3" /> Plays
                  </div>
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Release Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Genres</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-white">{movie.title}</div>
                    <div className="text-xs text-white/40 mt-0.5">{movie.slug}</div>
                  </td>
                  <td className="py-4 px-6">
                    {movie.published ? (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">Published</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400">Draft</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      <Play className="w-3 h-3 fill-[#E50914] text-[#E50914]" />
                      <span className="font-semibold text-white">{movie.viewCount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white/60">
                    {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-4 px-6 text-white/60">
                    {movie.genres.map((g) => g.genre.name).join(', ') || '—'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/movies/${movie.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {movies.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    No movies found. Click <span className="text-white/70 font-medium">Add Movie</span> to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
