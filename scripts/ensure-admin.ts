import { PrismaClient } from '@prisma/client'
import { createAdminClient } from '../lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required')
}

const prisma = new PrismaClient()
const supabase = createAdminClient()

async function getAuthUserByEmail(email: string) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function main() {
  let authUser = await getAuthUserByEmail(ADMIN_EMAIL!)

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: {
        role: 'ADMIN',
        protected_admin: true,
      },
    })

    if (error) throw error
    authUser = data.user
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: {
        ...authUser.app_metadata,
        role: 'ADMIN',
        protected_admin: true,
      },
    })

    if (error) throw error
    authUser = data.user
  }

  if (!authUser?.id || !authUser.email) {
    throw new Error('Supabase did not return a valid admin user')
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Full platform administration' },
  })

  const user = await prisma.user.upsert({
    where: { email: authUser.email },
    update: {
      id: authUser.id,
      name: authUser.user_metadata?.name ?? 'RebaFlix Admin',
      lastSeenAt: new Date(),
    },
    create: {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name ?? 'RebaFlix Admin',
      lastSeenAt: new Date(),
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id,
    },
  })

  console.log(`Admin ready: ${user.email}`)
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
