import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'

async function syncSupabaseUser(user: {
  id: string
  email?: string | null
  user_metadata?: { name?: string; full_name?: string; avatar_url?: string }
}) {
  if (!user.email) return null

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      id: user.id, // keep Prisma UUID in sync with Supabase auth UUID
      name: user.user_metadata?.name ?? user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
      lastSeenAt: new Date(),
    },
    create: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
      lastSeenAt: new Date(),
    },
    include: {
      roles: {
        include: { role: true },
      },
    },
  })
}

export async function getSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return null
  return syncSupabaseUser(user)
}

export async function getBearerUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null

  const supabase = createSupabaseClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user?.email) return null
  return syncSupabaseUser(user)
}

export async function requireUser(request?: Request) {
  const user = (request ? await getBearerUser(request) : null) ?? await getSessionUser()
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user, response: null }
}

export function hasRole(user: Awaited<ReturnType<typeof getSessionUser>>, roleName: string) {
  if (!user) return false
  const roles = user.roles.map(r => r.role.name)
  if (roleName === 'ADMIN' && roles.includes('SUPER_ADMIN')) return true
  return roles.includes(roleName)
}
