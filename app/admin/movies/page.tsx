import Link from 'next/link'
import { Plus, Film, Eye, Clapperboard, Search } from 'lucide-react'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AdminMoviesActions } from '@/components/admin/AdminMoviesActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

function paginationHref(page: number, q: string) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/admin/movies?${query}` : '/admin/movies'
}

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const { page: pageParam, q: rawQuery = '' } = await searchParams
  const q = rawQuery.trim()
  const currentPage = Math.max(1, Number(pageParam) || 1)
  const where: Prisma.MovieWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { genres: { some: { genre: { name: { contains: q, mode: 'insensitive' } } } } },
        ],
      }
    : {}

  const [movies, totalMovies, totalPublished] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        genres: { include: { genre: true } },
        parts: { where: { published: true }, select: { id: true } },
      },
    }),
    prisma.movie.count({ where }),
    prisma.movie.count({ where: { published: true } }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalMovies / PAGE_SIZE))
  const firstItem = totalMovies === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(currentPage * PAGE_SIZE, totalMovies)

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
          { label: q ? 'Matching Movies' : 'Total Movies', value: totalMovies, icon: Film, color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
        <div className="flex flex-col gap-4 px-6 py-4 border-b border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base font-semibold text-white">All Movies</h2>
          <form action="/admin/movies" className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search movies..."
              className="h-10 border-white/10 bg-black/30 pl-9 text-sm"
            />
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Title</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Release Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Genres</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Parts</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movies.map((movie) => {
                const partCount = movie.parts.length + (movie.videoUrl ? 1 : 0)

                return (
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
                  <td className="py-4 px-6 text-white/60">
                    <Link href={`/admin/movies/${movie.id}/parts`} className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                      <Clapperboard className="h-3.5 w-3.5" />
                      {partCount} part{partCount !== 1 ? 's' : ''}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <AdminMoviesActions
                      movieId={movie.id}
                      movieTitle={movie.title}
                      type="movie"
                    />
                  </td>
                </tr>
                )
              })}
              {movies.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    {q ? 'No movies match your search.' : (
                      <>No movies found. Click <span className="text-white/70 font-medium">Add Movie</span> to get started.</>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {firstItem}-{lastItem} of {totalMovies}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild disabled={currentPage <= 1} className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href={paginationHref(currentPage - 1, q)} aria-disabled={currentPage <= 1}>Previous</Link>
            </Button>
            <span className="min-w-20 text-center text-xs font-semibold text-white/60">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" asChild disabled={currentPage >= totalPages} className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href={paginationHref(currentPage + 1, q)} aria-disabled={currentPage >= totalPages}>Next</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
