import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const displayName = typeof name === 'string' ? name.trim() : ''

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: displayName ? { name: displayName } : undefined,
    })

    if (error) {
      const status = error.message.toLowerCase().includes('already') ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }

    if (!data.user?.id || !data.user.email) {
      throw new Error('Supabase did not return a valid user')
    }

    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER', description: 'Standard subscriber' },
    })

    const dbUser = await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email,
        name: displayName || null,
        lastSeenAt: new Date(),
      },
    })

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: dbUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: dbUser.id, roleId: userRole.id },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[register]', err)
    return NextResponse.json({ error: err.message ?? 'Registration failed' }, { status: 500 })
  }
}
