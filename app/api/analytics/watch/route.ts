import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { consentExemptAnalyticsEnabled, PLAYBACK_STATE_TTL_MS, resolveContent, sameOrigin, utcDay } from '@/lib/analytics/server'
import { coverage, mergeRanges, Range } from '@/lib/analytics/metrics'
import { deviceType } from '@/lib/analytics/metrics'

const schema = z.object({
  id: z.string().uuid(), contentId: z.string().min(1).max(100), type: z.enum(['movie', 'episode', 'part']),
  sequence: z.number().int().min(0).max(100000), seconds: z.number().finite().min(0).max(45),
  duration: z.number().finite().min(1).max(86400),
  ranges: z.array(z.tuple([z.number().finite().min(0), z.number().finite().min(0)])).max(100),
  finished: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 })
  if (!consentExemptAnalyticsEnabled(request)) return new NextResponse(null, { status: 204 })
  if (Number(request.headers.get('content-length') ?? 0) > 16000) return new NextResponse(null, { status: 413 })
  try {
    const body = schema.safeParse(await request.json())
    if (!body.success) return NextResponse.json({ error: 'Invalid playback sample' }, { status: 400 })
    const sample = body.data
    const content = await resolveContent(sample.contentId, sample.type)
    if (!content) return new NextResponse(null, { status: 404 })
    const now = new Date()
    const expiresAt = new Date(now.getTime() + PLAYBACK_STATE_TTL_MS)
    const deviceCategory = deviceType(request.headers.get('user-agent') ?? '', request.headers.get('sec-ch-ua-mobile'))

    const accepted = await prisma.$transaction(async tx => {
      // Serialize retries/concurrent heartbeats for this play UUID, never for a person.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`play:${sample.id}`}))`
      let existing = await tx.analyticsPlaybackState.findUnique({ where: { id: sample.id } })
      if (existing?.expiresAt && existing.expiresAt <= now) {
        await tx.analyticsPlaybackState.delete({ where: { id: sample.id } })
        existing = null
      }
      if (!existing) {
        if (sample.sequence !== 0) return false
        await tx.analyticsPlaybackState.create({ data: {
          id: sample.id, contentId: content.contentId, parentId: content.parentId, contentType: sample.type,
          deviceCategory, duration: sample.duration, ranges: [], expiresAt, lastAcceptedAt: now,
        } })
        await tx.contentDailyAnalytics.upsert({
          where: { date_contentId_deviceCategory: { date: utcDay(now), contentId: content.contentId, deviceCategory } },
          create: { date: utcDay(now), contentId: content.contentId, parentId: content.parentId, contentType: sample.type, deviceCategory, playCount: 1 },
          update: { playCount: { increment: 1 } },
        })
        return true
      }
      if (existing.contentId !== content.contentId || existing.contentType !== sample.type) return false
      if (sample.sequence <= existing.sequence) return true

      const elapsedBudget = Math.max(0, Math.min(45, (now.getTime() - existing.lastAcceptedAt.getTime()) / 1000))
      const seconds = Math.min(sample.seconds, elapsedBudget)
      const incoming = mergeRanges(sample.ranges, existing.duration)
      const validCoverage = coverage(incoming) <= seconds * 2 + 1
      const ranges = mergeRanges([...(existing.ranges as Range[]), ...(validCoverage ? incoming : [])], existing.duration).slice(0, 2000)
      const coveredSeconds = coverage(ranges)
      const completed = existing.completed || coveredSeconds / existing.duration >= 0.9
      const completedIncrement = !existing.completed && completed ? 1 : 0

      await tx.analyticsPlaybackState.update({ where: { id: sample.id }, data: {
        sequence: sample.sequence, ranges, coveredSeconds, completed, lastAcceptedAt: now, expiresAt,
      } })
      if (seconds > 0 || completedIncrement) {
        await tx.contentDailyAnalytics.upsert({
          where: { date_contentId_deviceCategory: { date: utcDay(now), contentId: content.contentId, deviceCategory: existing.deviceCategory } },
          create: { date: utcDay(now), contentId: content.contentId, parentId: content.parentId, contentType: sample.type, deviceCategory: existing.deviceCategory, watchSeconds: seconds, completedCount: completedIncrement },
          update: { watchSeconds: { increment: seconds }, completedCount: { increment: completedIncrement } },
        })
      }
      if (sample.finished) await tx.analyticsPlaybackState.delete({ where: { id: sample.id } })
      return true
    })
    if (!accepted) return new NextResponse(null, { status: 409 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 }) }
}
