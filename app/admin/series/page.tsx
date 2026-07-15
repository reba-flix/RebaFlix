import Link from 'next/link'
import { Plus, Pencil, Trash2, Tv, Play, Layers } from 'lucide-react'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminSeriesPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const series = await prisma.series.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      genres: { include: { genre: true } },
      seasons: { include: { episodes: true } }
    },
  })

  const totalPublished = series.filter((s) => s.published).length

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
          { label: 'Total Series', value: series.length, icon: Tv, color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">All Series</h2>
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
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/series/${s.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )})}
              {series.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    No series found. Click <span className="text-white/70 font-medium">Add Series</span> to get started.
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
