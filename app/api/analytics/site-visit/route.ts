import { NextRequest } from 'next/server'
import { POST as createSession } from '@/app/api/analytics/session/route'

// Keep the old URL for cached clients, with the same consent and session checks.
export async function POST(request: NextRequest) {
  return createSession(request)
}
