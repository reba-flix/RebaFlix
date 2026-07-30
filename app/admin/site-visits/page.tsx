import { redirect } from 'next/navigation'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  CalendarDays,
  Minus,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { SiteVisitsChart } from '@/components/admin/SiteVisitsChart'

export const dynamic = 'force-dynamic'

export default async function SiteVisitsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const now = new Date()

  // ── Date boundaries ─────────────────────────────────────────────────────
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59)
  sixtyDaysAgo.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // ── Fetch raw events ─────────────────────────────────────────────────────
  const [events, prevEvents, totalAll, totalToday, totalYesterday] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { name: 'site_visit', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, userId: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.analyticsEvent.findMany({
      where: { name: 'site_visit', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      select: { createdAt: true, userId: true },
    }),
    prisma.analyticsEvent.count({ where: { name: 'site_visit' } }),
    prisma.analyticsEvent.count({ where: { name: 'site_visit', createdAt: { gte: today } } }),
    prisma.analyticsEvent.count({
      where: { name: 'site_visit', createdAt: { gte: yesterday, lt: today } },
    }),
  ])

  // ── Build prior visitor set (visited before current 30-day window) ────────
  const priorVisitorIds = new Set(
    (
      await prisma.analyticsEvent.findMany({
        where: { name: 'site_visit', createdAt: { lt: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ['userId'],
      })
    )
      .map((e) => e.userId)
      .filter(Boolean) as string[]
  )

  // ── Group current window by date ─────────────────────────────────────────
  const dateMap: Record<string, { total: number; newVisitors: number; returning: number }> = {}

  // Pre-fill every day so gaps render as 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    dateMap[d.toISOString().slice(0, 10)] = { total: 0, newVisitors: 0, returning: 0 }
  }

  const seenThisWindow = new Set<string>()
  let totalNew = 0
  let totalReturning = 0

  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10)
    if (!dateMap[key]) dateMap[key] = { total: 0, newVisitors: 0, returning: 0 }
    dateMap[key].total++

    if (event.userId) {
      if (priorVisitorIds.has(event.userId) || seenThisWindow.has(event.userId)) {
        dateMap[key].returning++
        totalReturning++
      } else {
        dateMap[key].newVisitors++
        totalNew++
        seenThisWindow.add(event.userId)
      }
    } else {
      // Anonymous — count as new each day
      dateMap[key].newVisitors++
      totalNew++
    }
  }

  // ── Group previous window by date (keyed to offset) ─────────────────────
  const prevDateMap: Record<string, number> = {}
  for (const event of prevEvents) {
    const key = event.createdAt.toISOString().slice(0, 10)
    prevDateMap[key] = (prevDateMap[key] || 0) + 1
  }

  // ── Build chart data ─────────────────────────────────────────────────────
  const chartData = Object.entries(dateMap).map(([date, counts], i) => {
    const prevDate = new Date(thirtyDaysAgo)
    prevDate.setDate(prevDate.getDate() + i - 30)
    const prevKey = prevDate.toISOString().slice(0, 10)
    return { date, ...counts, prevTotal: prevDateMap[prevKey] ?? 0 }
  })

  // ── Summary numbers ──────────────────────────────────────────────────────
  const currentPeriod = events.length
  const prevPeriod = prevEvents.length
  const changePercent =
    prevPeriod === 0 ? null : Math.round(((currentPeriod - prevPeriod) / prevPeriod) * 100)
  const avgPerDay = Math.round(currentPeriod / 30)
  const todayVsYesterday =
    totalYesterday === 0 ? null : Math.round(((totalToday - totalYesterday) / totalYesterday) * 100)

  // ── Stats cards data ─────────────────────────────────────────────────────
  const stats = [
    {
      label: 'All-time Visits',
      value: totalAll.toLocaleString(),
      icon: MousePointerClick,
      color: 'text-[#E50914]',
      bg: 'bg-[#E50914]/10',
      sub: 'Total recorded visits',
      change: null,
    },
    {
      label: 'Today',
      value: totalToday.toLocaleString(),
      icon: CalendarDays,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      sub: `Yesterday: ${totalYesterday}`,
      change: todayVsYesterday,
    },
    {
      label: 'Last 30 Days',
      value: currentPeriod.toLocaleString(),
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      sub: `Prev. 30d: ${prevPeriod.toLocaleString()}`,
      change: changePercent,
    },
    {
      label: 'Daily Average',
      value: avgPerDay.toLocaleString(),
      icon: CalendarDays,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      sub: 'Over last 30 days',
      change: null,
    },
    {
      label: 'New Visitors',
      value: totalNew.toLocaleString(),
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      sub: 'Last 30 days',
      change: null,
    },
    {
      label: 'Returning Visitors',
      value: totalReturning.toLocaleString(),
      icon: UserCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      sub: 'Last 30 days',
      change: null,
    },
  ]

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <MousePointerClick className="w-8 h-8 text-[#E50914]" />
            Site Visits
          </h1>
          <p className="text-white/50 text-sm">
            Daily traffic breakdown — total, new, returning visitors &amp; period comparison.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-10">
        {stats.map(({ label, value, icon: Icon, color, bg, sub, change }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              {change !== null && (
                <span
                  className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                    change > 0
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : change < 0
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {change > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : change < 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}
            </div>
            <p className="text-white/45 text-xs font-medium mb-0.5">{label}</p>
            <p className="font-display text-3xl font-bold text-white">{value}</p>
            <p className="text-white/30 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </section>

      {/* Main Chart */}
      <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6 mb-8">
        <div className="mb-6">
          <h2 className="font-semibold text-white text-lg">Daily Visit Breakdown</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Stacked bar shows new vs returning visitors per day. Faint grey bars = same day last period.
          </p>
        </div>
        <SiteVisitsChart data={chartData} />
      </section>

      {/* Day-by-day table */}
      <section className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h2 className="font-semibold text-white">Day-by-Day Breakdown (Last 30 days)</h2>
          <span className="text-xs text-white/30">{chartData.length} days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Total</th>
                <th className="text-right px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">New</th>
                <th className="text-right px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Returning</th>
                <th className="text-right px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Prev. Period</th>
                <th className="text-right px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[...chartData].reverse().map((row) => {
                const diff = row.total - row.prevTotal
                const pct = row.prevTotal === 0
                  ? null
                  : Math.round(((row.total - row.prevTotal) / row.prevTotal) * 100)
                return (
                  <tr key={row.date} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-white/80 font-mono text-xs">{row.date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">{row.total.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-emerald-400">{row.newVisitors.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-blue-400">{row.returning.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-white/35">{row.prevTotal.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      {pct === null ? (
                        <span className="text-white/20">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                            pct > 0 ? 'text-emerald-400' : pct < 0 ? 'text-red-400' : 'text-white/40'
                          }`}
                        >
                          {pct > 0 ? '↑' : pct < 0 ? '↓' : '–'}
                          {Math.abs(pct)}%
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
