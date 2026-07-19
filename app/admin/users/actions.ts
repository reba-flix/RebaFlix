'use server'

import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function toggleAdminRole(userId: string, makeAdmin: boolean) {
  const sessionUser = await getSessionUser()
  // Only SUPER_ADMIN can manage other admins
  if (!hasRole(sessionUser, 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: Only Super Admins can manage roles.')
  }

  // Find the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!targetUser) throw new Error('User not found')

  // Find the ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  })
  if (!adminRole) throw new Error('Admin role not found')

  const supabase = createAdminClient()

  if (makeAdmin) {
    // Add to Prisma
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: adminRole.id } },
      update: {},
      create: { userId, roleId: adminRole.id },
    })

    // Update Supabase Auth metadata
    const { data: userAuthData } = await supabase.auth.admin.getUserById(userId)
    if (userAuthData?.user) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { ...userAuthData.user.app_metadata, role: 'ADMIN' },
      })
    }
  } else {
    // Remove from Prisma
    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId: adminRole.id } },
    }).catch(() => {}) // Ignore if not found

    // Update Supabase Auth metadata
    const { data: userAuthData } = await supabase.auth.admin.getUserById(userId)
    if (userAuthData?.user) {
      const app_metadata = { ...userAuthData.user.app_metadata }
      delete app_metadata.role
      await supabase.auth.admin.updateUserById(userId, { app_metadata })
    }
  }

  revalidatePath('/admin/users')
  return { success: true }
}
