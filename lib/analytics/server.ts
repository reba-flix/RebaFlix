import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deviceType } from './metrics'

const OPT_OUT_COOKIE = 'reba_analytics_optout'
const LEGACY_CHOICE_COOKIE = 'reba_analytics_consent'
const DEDUPE_COOKIE = 'reba_analytics_action'
export const PLAYBACK_STATE_TTL_MS = 2 * 60_000
export const ACTION_DEDUPE_TTL_MS = 30_000
export const AGGREGATE_RETENTION_MONTHS = 13

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return origin === request.nextUrl.origin && request.headers.get('sec-fetch-site') !== 'cross-site'
}

export function analyticsIsOptedOut(request: NextRequest) {
  return request.cookies.get(OPT_OUT_COOKIE)?.value === '1'
    || request.cookies.get(LEGACY_CHOICE_COOKIE)?.value === 'no'
    || request.headers.get('sec-gpc') === '1'
    || request.headers.get('dnt') === '1'
}

export function consentExemptAnalyticsEnabled(request: NextRequest) {
  return process.env.ANALYTICS_ENABLED === 'true' && !analyticsIsOptedOut(request)
}

export function setActionCookie(response: NextResponse, actionKey: string | null, request: NextRequest) {
  if (!actionKey) return response
  response.cookies.set(DEDUPE_COOKIE, actionKey, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.ceil(ACTION_DEDUPE_TTL_MS / 1000),
  })
  return response
}

export async function resolveContent(id: string, type: 'movie' | 'episode' | 'series' | 'part') {
  if (type === 'episode') {
    const item = await prisma.episode.findFirst({ where: { id, published: true, season: { series: { published: true } } }, select: { season: { select: { seriesId: true } } } })
    return item ? { contentId: id, parentId: item.season.seriesId } : null
  }
  if (type === 'part') {
    const item = await prisma.moviePart.findFirst({ where: { id, published: true, movie: { published: true } }, select: { movieId: true } })
    return item ? { contentId: id, parentId: item.movieId } : null
  }
  const item = type === 'series'
    ? await prisma.series.findFirst({ where: { id, published: true }, select: { id: true } })
    : await prisma.movie.findFirst({ where: { id, published: true }, select: { id: true } })
  return item ? { contentId: id, parentId: id } : null
}

type ContentType = 'movie' | 'episode' | 'series' | 'part'

// Only a short-lived action key is used for retry/double-click deduplication.
// It cannot be used to join events across content or time and is never reported.
export async function recordContentEvent(request: NextRequest, name: 'content_view' | 'content_download', id: string, type: ContentType) {
  try {
    if (!consentExemptAnalyticsEnabled(request)) return { actionKey: null as string | null, cookieKey: null as string | null }
    const content = await resolveContent(id, type)
    if (!content) return { actionKey: null, cookieKey: null }
    const existingKey = request.cookies.get(DEDUPE_COOKIE)?.value
    const actionKey = existingKey && /^[a-f0-9-]{36}$/i.test(existingKey) ? existingKey : crypto.randomUUID()
    const cookieKey = existingKey === actionKey ? null : actionKey
    const deviceCategory = deviceType(request.headers.get('user-agent') ?? '', request.headers.get('sec-ch-ua-mobile'))

    const result = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${actionKey}:${name}:${id}`}))`
      const previous = await tx.analyticsActionDedupe.findUnique({
        where: { actionKey_contentId_eventName: { actionKey, contentId: id, eventName: name } },
        select: { id: true, expiresAt: true },
      })
      if (previous && previous.expiresAt > new Date()) return { recorded: false, refreshCookie: false }
      const expiresAt = new Date(Date.now() + ACTION_DEDUPE_TTL_MS)
      if (previous) await tx.analyticsActionDedupe.update({ where: { id: previous.id }, data: { expiresAt } })
      else await tx.analyticsActionDedupe.create({ data: { id: crypto.randomUUID(), actionKey, contentId: id, eventName: name, expiresAt } })
      await tx.contentDailyAnalytics.upsert({
        where: { date_contentId_deviceCategory: { date: utcDay(new Date()), contentId: id, deviceCategory } },
        create: { date: utcDay(new Date()), contentId: id, parentId: content.parentId, contentType: type, deviceCategory, viewCount: name === 'content_view' ? 1 : 0, downloadCount: name === 'content_download' ? 1 : 0 },
        update: name === 'content_view' ? { viewCount: { increment: 1 } } : { downloadCount: { increment: 1 } },
      })
      return { recorded: true, refreshCookie: Boolean(previous) }
    })
    return { actionKey: result.recorded ? actionKey : null, cookieKey: result.refreshCookie ? actionKey : cookieKey }
  } catch {
    console.warn('Aggregate analytics event could not be recorded')
    return { actionKey: null, cookieKey: null }
  }
}

export function utcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export async function cleanupAnalyticsTemporaryState(now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - AGGREGATE_RETENTION_MONTHS)
  const [playbacks, dedupe, aggregates] = await prisma.$transaction([
    prisma.analyticsPlaybackState.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.analyticsActionDedupe.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.contentDailyAnalytics.deleteMany({ where: { date: { lt: utcDay(cutoff) } } }),
  ])
  return { playbacks: playbacks.count, dedupe: dedupe.count, aggregates: aggregates.count }
}

export function applyOptOutCookie(response: NextResponse, request: NextRequest, optedOut: boolean) {
  response.cookies.set(OPT_OUT_COOKIE, optedOut ? '1' : '', {
    httpOnly: false,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: optedOut ? 60 * 60 * 24 * 180 : 0,
  })
  if (optedOut) response.cookies.set(DEDUPE_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
