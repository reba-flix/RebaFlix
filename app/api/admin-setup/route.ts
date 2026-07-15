import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Guard: block if an admin user already exists
    const existingAdminRole = await prisma.role.findFirst({
      where: { name: 'ADMIN' },
      include: { users: true },
    })
    if (existingAdminRole && existingAdminRole.users.length > 0) {
      return NextResponse.json(
        { error: 'An admin account already exists. Sign in normally.' },
        { status: 409 }
      )
    }

    // 1. Find or create in Supabase Auth
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (listError) throw listError

    let authUser =
      listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: 'ADMIN', protected_admin: true },
      })
      if (error) throw error
      authUser = data.user
    } else {
      const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
        app_metadata: { ...authUser.app_metadata, role: 'ADMIN', protected_admin: true },
      })
      if (error) throw error
      authUser = data.user
    }

    if (!authUser?.id || !authUser.email) {
      throw new Error('Supabase did not return a valid user')
    }

    // 2. Ensure roles exist in DB
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Full platform administration' },
    })
    await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER', description: 'Standard subscriber' },
    })

    // 3. Upsert Prisma user — force id = Supabase UUID
    const dbUser = await prisma.user.upsert({
      where: { email: authUser.email },
      update: { id: authUser.id, name: 'RebaFlix Admin', lastSeenAt: new Date() },
      create: {
        id: authUser.id,
        email: authUser.email,
        name: 'RebaFlix Admin',
        lastSeenAt: new Date(),
      },
    })

    // 4. Assign ADMIN role
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: dbUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: dbUser.id, roleId: adminRole.id },
    })

    return NextResponse.json({ success: true, email: dbUser.email })
  } catch (err: any) {
    console.error('[admin-setup]', err)
    return NextResponse.json({ error: err.message ?? 'Setup failed' }, { status: 500 })
  }
}
