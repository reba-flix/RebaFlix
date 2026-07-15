import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return null

  const profile = await prisma.user.upsert({
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

  return profile
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user, response: null }
}

export function hasRole(user: Awaited<ReturnType<typeof getSessionUser>>, roleName: string) {
  return Boolean(user?.roles.some(({ role }) => role.name === roleName))
}
