import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, hasRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // ── Date boundaries ──────────────────────────────────────────────────────
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59)
  sixtyDaysAgo.setHours(0, 0, 0, 0)

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  // ── Raw events for current 30-day window ─────────────────────────────────
  const events = await prisma.analyticsEvent.findMany({
    where: {
      name: 'site_visit',
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true, userId: true },
    orderBy: { createdAt: 'asc' },
  })

  // ── Raw events for previous 30-day window (comparison) ───────────────────
  const prevEvents = await prisma.analyticsEvent.findMany({
    where: {
      name: 'site_visit',
      createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
    select: { createdAt: true, userId: true },
  })

  // ── Totals ───────────────────────────────────────────────────────────────
  const totalAll = await prisma.analyticsEvent.count({ where: { name: 'site_visit' } })
  const totalToday = await prisma.analyticsEvent.count({
    where: { name: 'site_visit', createdAt: { gte: today } },
  })

  // ── Group current window by date ─────────────────────────────────────────
  const dateMap: Record<string, { total: number; newVisitors: number; returning: number }> = {}

  // Build a set of userIds that visited BEFORE this window (returning visitors)
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

  // Track first-seen within this window
  const seenThisWindow = new Set<string>()

  // Pre-fill every day in the window so gaps show as 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    dateMap[key] = { total: 0, newVisitors: 0, returning: 0 }
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10)
    if (!dateMap[key]) dateMap[key] = { total: 0, newVisitors: 0, returning: 0 }
    dateMap[key].total++

    if (event.userId) {
      if (priorVisitorIds.has(event.userId) || seenThisWindow.has(event.userId)) {
        dateMap[key].returning++
      } else {
        dateMap[key].newVisitors++
        seenThisWindow.add(event.userId)
      }
    } else {
      // Anonymous visit — count as new each day
      dateMap[key].newVisitors++
    }
  }

  // ── Group previous window by date ────────────────────────────────────────
  const prevDateMap: Record<string, number> = {}
  for (const event of prevEvents) {
    const key = event.createdAt.toISOString().slice(0, 10)
    prevDateMap[key] = (prevDateMap[key] || 0) + 1
  }

  // ── Build chart series: align prev-period day-by-day offset ──────────────
  const chartData = Object.entries(dateMap).map(([date, counts], i) => {
    const prevDate = new Date(thirtyDaysAgo)
    prevDate.setDate(prevDate.getDate() + i - 30)
    const prevKey = prevDate.toISOString().slice(0, 10)
    return {
      date,
      total: counts.total,
      newVisitors: counts.newVisitors,
      returning: counts.returning,
      prevTotal: prevDateMap[prevKey] ?? 0,
    }
  })

  // ── Summary stats ─────────────────────────────────────────────────────────
  const currentTotal = events.length
  const prevTotal = prevEvents.length
  const changePercent =
    prevTotal === 0 ? null : Math.round(((currentTotal - prevTotal) / prevTotal) * 100)

  const currentNew = events.filter((e) => e.userId && !priorVisitorIds.has(e.userId)).length
  const prevNew = prevEvents.filter((e) => {
    const priorSet = new Set<string>()
    return e.userId && !priorSet.has(e.userId)
  }).length

  return NextResponse.json({
    chartData,
    summary: {
      totalAll,
      totalToday,
      currentPeriod: currentTotal,
      prevPeriod: prevTotal,
      changePercent,
      newVisitors: currentNew,
      avgPerDay: Math.round(currentTotal / 30),
    },
  })
}
