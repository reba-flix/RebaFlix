export const HEARTBEAT_MS = 20_000
export type Range = [number, number]

export function deviceType(ua: string, mobileHint?: string | null): string {
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(ua)) return 'tablet'
  if (mobileHint === '?1' || /mobi|iphone|ipod|windows phone/i.test(ua)) return 'mobile'
  if (/windows|macintosh|linux|cros/i.test(ua)) return 'desktop'
  return 'other'
}

export function mergeRanges(ranges: Range[], duration: number): Range[] {
  const sorted = ranges.map(([a, b]) => [Math.max(0, a), Math.min(duration, b)] as Range)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .sort((a, b) => a[0] - b[0])
  const result: Range[] = []
  for (const range of sorted) {
    const previous = result[result.length - 1]
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1])
    else result.push([...range])
  }
  return result
}
export const coverage = (ranges: Range[]) => ranges.reduce((sum, [a, b]) => sum + b - a, 0)
export const percent = (value: number, total: number) => total > 0 ? 100 * value / total : 0

// Count wall time only while media advances normally. Seeking, stalls and long gaps earn no time.
export function playbackDelta(previous: number, position: number, elapsed: number, rate: number, active: boolean) {
  const delta = position - previous
  if (!active || elapsed <= 0 || elapsed > 3 || delta <= 0 || delta > elapsed * rate + 0.5) return 0
  return Math.min(elapsed, delta / Math.max(0.25, rate))
}

export function rangeStart(range: string, now = new Date()): Date | null {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (range === 'all') return null
  if (range === 'year') return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  if (range === 'today') return day
  const days = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[range] ?? 30
  day.setUTCDate(day.getUTCDate() - days + 1)
  return day
}
