import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { rangeStart } from './metrics'

export type Performance = {
  id: string; title: string; posterUrl: string | null; type: string; views: number;
  seconds: number; plays: number; avgSeconds: number; completion: number; completed: number;
  downloads: number; downloadRate: number
}
export type AnalyticsReport = {
  range: string; enabled: boolean;
  totals: Omit<Performance, 'id' | 'title' | 'posterUrl' | 'type'>;
  devices: { device: string; count: number }[];
  trend: { date: string; hours: number; views: number; downloads: number }[];
  highlights: { label: string; item: Performance | null }[];
  topViews: Performance[]; movies: Performance[]; series: Performance[];
  rows: Performance[]; count: number; page: number; pages: number;
  downloads: { today: number; week: number; month: number }
}

async function queryAnalyticsReport(params: URLSearchParams): Promise<AnalyticsReport> {
  const range = ['today', '7d', '30d', '90d', 'year', 'all'].includes(params.get('range') ?? '') ? params.get('range')! : '30d'
  const start = rangeStart(range) ?? new Date('1970-01-01')
  const end = new Date()
  const page = Math.min(100000, Math.max(1, Math.floor(Number(params.get('page')) || 1)))
  const search = (params.get('search') ?? '').slice(0, 150)
  const type = ['movie', 'series', 'episode', 'part'].includes(params.get('type') ?? '') ? params.get('type')! : 'all'
  const order = ({ views: Prisma.sql`"views"`, seconds: Prisma.sql`"seconds"`, downloads: Prisma.sql`"downloads"`, completion: Prisma.sql`"completion"` } as Record<string, Prisma.Sql>)[params.get('sort') ?? 'views'] ?? Prisma.sql`"views"`
  const direction = params.get('direction') === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
  const catalog = Prisma.sql`WITH catalog AS (
    SELECT id, title, "posterUrl", 'movie' AS type, "viewCount"::float8 AS historical FROM "Movie"
    UNION ALL SELECT id, title, "posterUrl", 'series', "viewCount"::float8 FROM "Series"
    UNION ALL SELECT e.id, s.title || ' · S' || sn.number || ' E' || e.number || ' · ' || e.title, e."thumbnailUrl", 'episode', 0 FROM "Episode" e JOIN "Season" sn ON sn.id=e."seasonId" JOIN "Series" s ON s.id=sn."seriesId"
    UNION ALL SELECT p.id, m.title || ' · ' || p.title, m."posterUrl", 'part', 0 FROM "MoviePart" p JOIN "Movie" m ON m.id=p."movieId"
  ), daily AS (
    SELECT * FROM "ContentDailyAnalytics" WHERE date >= ${start}::date AND date <= ${end}::date
  ), expanded AS (
    SELECT "contentId" AS key, "viewCount", "downloadCount", "watchSeconds", "playCount", "completedCount" FROM daily
    UNION ALL SELECT "parentId", "viewCount", "downloadCount", "watchSeconds", "playCount", "completedCount" FROM daily WHERE "parentId" <> "contentId"
  ), content_metrics AS (
    SELECT key, SUM("viewCount")::float8 AS views, SUM("downloadCount")::float8 AS downloads,
      SUM("watchSeconds")::float8 AS seconds, SUM("playCount")::float8 AS plays,
      SUM("completedCount")::float8 AS completed
    FROM expanded GROUP BY key
  ), performance AS (
    SELECT c.id, c.title, c."posterUrl", c.type,
      CASE WHEN ${range === 'all'} AND c.type IN ('movie','series') THEN c.historical ELSE COALESCE(m.views,0) END AS views,
      COALESCE(m.downloads,0) AS downloads, COALESCE(m.seconds,0) AS seconds,
      COALESCE(m.plays,0) AS plays, COALESCE(m.completed,0) AS completed,
      COALESCE(m.seconds/NULLIF(m.plays,0),0)::float8 AS "avgSeconds",
      COALESCE(100.0*m.completed/NULLIF(m.plays,0),0)::float8 AS completion,
      COALESCE(100.0*m.downloads/NULLIF(m.views,0),0)::float8 AS "downloadRate"
    FROM catalog c LEFT JOIN content_metrics m ON m.key=c.id
  )`
  const where = Prisma.sql`WHERE (${type} = 'all' OR type = ${type}) AND position(lower(${search}) in lower(title)) > 0`
  const grain = range === 'all' ? 'month' : 'day'
  const results = await Promise.all([
    prisma.$queryRaw<{ rows: Performance[]; count: number; topViews: Performance[]; movies: Performance[]; series: Performance[]; leaders: (Performance & {label: string})[] }[]>(Prisma.sql`${catalog}
      SELECT
      (SELECT COALESCE(json_agg(r),'[]') FROM (SELECT * FROM performance ${where} ORDER BY ${order} ${direction}, title, id LIMIT 20 OFFSET ${(page - 1) * 20}) r) AS rows,
      (SELECT COUNT(*)::float8 FROM performance ${where}) AS count,
      (SELECT COALESCE(json_agg(r),'[]') FROM (SELECT * FROM performance WHERE type IN ('movie','series') ORDER BY views DESC, title LIMIT 10) r) AS "topViews",
      (SELECT COALESCE(json_agg(r),'[]') FROM (SELECT * FROM performance WHERE type='movie' ORDER BY views DESC, title LIMIT 100) r) AS movies,
      (SELECT COALESCE(json_agg(r),'[]') FROM (SELECT * FROM performance WHERE type='series' ORDER BY views DESC, title LIMIT 100) r) AS series,
      (SELECT COALESCE(json_agg(r),'[]') FROM (
      SELECT * FROM (SELECT *, 'Most Watched Movie' AS label FROM performance WHERE type='movie' AND views>0 ORDER BY views DESC, title LIMIT 1) a
      UNION ALL SELECT * FROM (SELECT *, 'Most Watched Series' AS label FROM performance WHERE type='series' AND views>0 ORDER BY views DESC, title LIMIT 1) b
      UNION ALL SELECT * FROM (SELECT *, 'Most Downloaded Movie' AS label FROM performance WHERE type='movie' AND downloads>0 ORDER BY downloads DESC, title LIMIT 1) c
      UNION ALL SELECT * FROM (SELECT *, 'Most Downloaded Series' AS label FROM performance WHERE type='series' AND downloads>0 ORDER BY downloads DESC, title LIMIT 1) d
      UNION ALL SELECT * FROM (SELECT *, 'Highest Watch Time' AS label FROM performance WHERE type IN ('movie','series') AND seconds>0 ORDER BY seconds DESC, title LIMIT 1) e
      UNION ALL SELECT * FROM (SELECT *, 'Highest Completion Rate' AS label FROM performance WHERE type IN ('movie','series') AND plays>0 ORDER BY completion DESC, plays DESC, title LIMIT 1) f
      ) r) AS leaders`),
    prisma.$queryRaw<AnalyticsReport['totals'][]>(Prisma.sql`WITH daily AS (SELECT * FROM "ContentDailyAnalytics" WHERE date>=${start}::date AND date<=${end}::date)
      SELECT
        CASE WHEN ${range === 'all'} THEN (SELECT COALESCE(SUM("viewCount"),0) FROM "Movie")+(SELECT COALESCE(SUM("viewCount"),0) FROM "Series") ELSE COALESCE(SUM("viewCount"),0) END::float8 AS views,
        COALESCE(SUM("watchSeconds"),0)::float8 AS seconds, COALESCE(SUM("playCount"),0)::float8 AS plays,
        COALESCE(SUM("completedCount"),0)::float8 AS completed, COALESCE(SUM("downloadCount"),0)::float8 AS downloads,
        COALESCE(SUM("watchSeconds")/NULLIF(SUM("playCount"),0),0)::float8 AS "avgSeconds",
        COALESCE(100.0*SUM("completedCount")/NULLIF(SUM("playCount"),0),0)::float8 AS completion,
        COALESCE(100.0*SUM("downloadCount")/NULLIF(SUM("viewCount"),0),0)::float8 AS "downloadRate"
      FROM daily`),
    prisma.$queryRaw<AnalyticsReport['devices']>(Prisma.sql`SELECT "deviceCategory" AS device, SUM("viewCount"+"downloadCount")::float8 AS count FROM "ContentDailyAnalytics" WHERE date>=${start}::date AND date<=${end}::date GROUP BY "deviceCategory" ORDER BY device`),
    prisma.$queryRaw<AnalyticsReport['trend']>(Prisma.sql`SELECT to_char(bucket,'YYYY-MM-DD') AS date, SUM("watchSeconds")/3600.0 AS hours, SUM("viewCount")::float8 AS views, SUM("downloadCount")::float8 AS downloads FROM (SELECT date_trunc(${grain},date::timestamp) AS bucket,"watchSeconds","viewCount","downloadCount" FROM "ContentDailyAnalytics" WHERE date>=${start}::date AND date<=${end}::date) grouped GROUP BY bucket ORDER BY bucket`),
    prisma.$queryRaw<AnalyticsReport['downloads'][]>(Prisma.sql`SELECT COALESCE(SUM("downloadCount") FILTER (WHERE date=date_trunc('day',${end}::timestamp)::date),0)::float8 AS today, COALESCE(SUM("downloadCount") FILTER (WHERE date>=date_trunc('week',${end}::timestamp)::date),0)::float8 AS week, COALESCE(SUM("downloadCount") FILTER (WHERE date>=date_trunc('month',${end}::timestamp)::date),0)::float8 AS month FROM "ContentDailyAnalytics" WHERE date>=date_trunc('month',${end}::timestamp)::date AND date<=${end}::date`),
  ])
  const [content, totalsRows, devices, trend, downloadRows] = results
  const { rows, count, topViews, movies, series, leaders } = content[0]
  if (trend.length) {
    const first = range === 'all' ? new Date(`${trend[0].date}T00:00:00Z`) : start
    const cursor = new Date(first)
    const points = new Map(trend.map(point => [point.date, point]))
    const filled: AnalyticsReport['trend'] = []
    while (cursor <= end) {
      const date = cursor.toISOString().slice(0, 10)
      filled.push(points.get(date) ?? { date, hours: 0, views: 0, downloads: 0 })
      if (range === 'all') cursor.setUTCMonth(cursor.getUTCMonth() + 1)
      else cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    trend.splice(0, trend.length, ...filled)
  }
  const labels = ['Most Watched Movie','Most Watched Series','Most Downloaded Movie','Most Downloaded Series','Highest Watch Time','Highest Completion Rate']
  return { range, enabled: process.env.ANALYTICS_ENABLED === 'true', rows, count, page, pages: Math.max(1,Math.ceil(count/20)), topViews, movies, series,
    highlights: labels.map(label => ({ label, item: leaders.find(item => item.label === label) ?? null })), totals: totalsRows[0], devices, trend, downloads: downloadRows[0] }
}

export async function getAnalyticsReport(params: URLSearchParams): Promise<AnalyticsReport> {
  return queryAnalyticsReport(params)
}
