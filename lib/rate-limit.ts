import { NextRequest, NextResponse } from 'next/server'

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function rateLimit(request: NextRequest, limit = 120, windowMs = 60_000) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const key = forwardedFor || request.headers.get('x-real-ip') || 'anonymous'
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  bucket.count += 1

  if (bucket.count > limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((bucket.resetAt - now) / 1000).toString(),
        },
      }
    )
  }

  return null
}
