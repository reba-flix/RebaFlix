import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsForm } from './SettingsForm'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?next=/settings')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true },
  })

  if (!dbUser) redirect('/login')

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-[#E50914]/10 text-[#E50914]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Account Settings</h1>
            <p className="text-white/40 text-sm mt-0.5">Manage your personal information</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/40">
          <SettingsForm
            initialData={{
              name: dbUser.name ?? '',
              email: dbUser.email,
              phone: dbUser.phone ?? '',
            }}
          />
        </div>

        {/* Info note */}
        <p className="text-center text-white/25 text-xs mt-6">
          Your information is kept private and will never be shared.
        </p>
      </div>
    </main>
  )
}
