// Plain CommonJS admin setup — no ts-node required
// Usage: node --env-file=.env scripts/setup-admin.js

const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'rebaflix@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rebaflix@123'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const prisma = new PrismaClient()

async function main() {
  console.log(`Setting up admin: ${ADMIN_EMAIL}`)

  // 1. Find or create in Supabase Auth
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError

  let authUser = listData.users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ?? null

  if (!authUser) {
    console.log('Creating Supabase auth user...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'ADMIN', protected_admin: true },
    })
    if (error) throw error
    authUser = data.user
    console.log('  → Created auth user:', authUser.id)
  } else {
    console.log('Updating existing Supabase auth user:', authUser.id)
    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { ...authUser.app_metadata, role: 'ADMIN', protected_admin: true },
    })
    if (error) throw error
    authUser = data.user
    console.log('  → Updated auth user')
  }

  if (!authUser?.id || !authUser?.email) throw new Error('No valid auth user returned')

  // 2. Ensure roles exist
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
  console.log('  → Roles ensured')

  // 3. Upsert Prisma user (sync id to Supabase UUID)
  const dbUser = await prisma.user.upsert({
    where: { email: authUser.email },
    update: { id: authUser.id, name: 'RebaFlix Admin', lastSeenAt: new Date() },
    create: { id: authUser.id, email: authUser.email, name: 'RebaFlix Admin', lastSeenAt: new Date() },
  })
  console.log('  → DB user upserted:', dbUser.id)

  // 4. Assign ADMIN role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: dbUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: dbUser.id, roleId: adminRole.id },
  })
  console.log('  → ADMIN role assigned')

  console.log('\n✅ Admin ready!')
  console.log(`   Email:    ${dbUser.email}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log(`   UUID:     ${dbUser.id}`)
}

main()
  .catch(err => { console.error('\n❌ Error:', err.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
