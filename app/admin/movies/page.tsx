import Link from 'next/link'
import { Plus, Film, Eye } from 'lucide-react'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AdminMoviesActions } from '@/components/admin/AdminMoviesActions'

export const dynamic = 'force-dynamic'

export default async function AdminMoviesPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const movies = await prisma.movie.findMany({
    orderBy: { createdAt: 'desc' },
    include: { genres: { include: { genre: true } } },
  })

  const totalPublished = movies.filter((m) => m.published).length

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
        <div className="flex items-center gap-3">
          <Link
            href="/admin/movies/bulk-upload"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-fit"
          >
            Bulk Upload
          </Link>
          <Link
            href="/admin/movies/new"
            className="flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#E50914]/20 w-fit"
          >
            <Plus className="w-4 h-4" /> Add Movie
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Movies', value: movies.length, icon: Film, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Published', value: totalPublished, icon: Eye, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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
                  <td className="py-4 px-6 text-white/60">
                    {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-4 px-6 text-white/60">
                    {movie.genres.map((g) => g.genre.name).join(', ') || '—'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <AdminMoviesActions
                      movieId={movie.id}
                      movieTitle={movie.title}
                      type="movie"
                    />
                  </td>
                </tr>
              ))}
              {movies.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
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
