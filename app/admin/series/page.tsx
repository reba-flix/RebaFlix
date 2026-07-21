import Link from 'next/link'
import { Plus, Tv, Play, Layers, Search } from 'lucide-react'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AdminMoviesActions } from '@/components/admin/AdminMoviesActions'
import { Input } from '@/components/ui/input'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

function paginationHref(page: number, q: string) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/admin/series?${query}` : '/admin/series'
}

export default async function AdminSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const { page: pageParam, q: rawQuery = '' } = await searchParams
  const q = rawQuery.trim()
  const currentPage = Math.max(1, Number(pageParam) || 1)
  const where: Prisma.SeriesWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { genres: { some: { genre: { name: { contains: q, mode: 'insensitive' } } } } },
        ],
      }
    : {}

  const [series, totalSeries, totalPublished] = await Promise.all([
    prisma.series.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        genres: { include: { genre: true } },
        seasons: { include: { episodes: { where: { published: true }, select: { id: true } } } }
      },
    }),
    prisma.series.count({ where }),
    prisma.series.count({ where: { published: true } }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalSeries / PAGE_SIZE))
  const firstItem = totalSeries === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(currentPage * PAGE_SIZE, totalSeries)

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Tv className="w-8 h-8 text-[#E50914]" />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">TV Series</h1>
            <p className="text-white/50 text-sm mt-1">Manage series, seasons, and episodes.</p>
          </div>
        </div>
        <Link
          href="/admin/series/new"
          className="flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#E50914]/20 w-fit"
        >
          <Plus className="w-4 h-4" /> Add Series
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: q ? 'Matching Series' : 'Total Series', value: totalSeries, icon: Tv, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Published', value: totalPublished, icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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

      {/* All Series Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-4 border-b border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base font-semibold text-white">All Series</h2>
          <form action="/admin/series" className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search series..."
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
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Episodes</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Release Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {series.map((s) => {
                const totalEpisodes = s.seasons.reduce((acc, season) => acc + season.episodes.length, 0);
                return (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-white">{s.title}</div>
                    <div className="text-xs text-white/40 mt-0.5">{s.slug}</div>
                  </td>
                  <td className="py-4 px-6">
                    {s.published ? (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">Published</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400">Draft</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <Layers className="w-4 h-4 text-primary-400" />
                      <span>{s.seasons.length} Seasons ({totalEpisodes} eps)</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white/60">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild className="bg-transparent border-white/20 hover:bg-white/10 text-white font-medium">
                        <Link href={`/admin/series/${s.id}/episodes`}>
                          Manage Episodes
                        </Link>
                      </Button>
                      <AdminMoviesActions
                        movieId={s.id}
                        movieTitle={s.title}
                        type="series"
                      />
                    </div>
                  </td>
                </tr>
              )})}
              {series.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    {q ? 'No series match your search.' : (
                      <>No series found. Click <span className="text-white/70 font-medium">Add Series</span> to get started.</>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {firstItem}-{lastItem} of {totalSeries}
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
