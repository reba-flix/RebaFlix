import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  const { user, response } = await requireUser()
  if (!user) return response!

  let body: { name?: string; email?: string; phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, phone } = body

  // Basic validation
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
  }
  if (phone !== undefined && phone !== '' && !/^\+?[0-9\s\-().]{6,20}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 422 })
  }

  try {
    // If email is changing, update Supabase Auth first
    if (email && email !== user.email) {
      const supabase = await createClient()
      const { error: authError } = await supabase.auth.updateUser({ email })
      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    // Update Prisma record
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name.trim() || null }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone.trim() || null }),
      },
      select: { id: true, name: true, email: true, phone: true },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error: any) {
    console.error('Profile update error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
