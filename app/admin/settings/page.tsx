import { getSessionUser, hasRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-[#E50914]" />
        <h1 className="font-display text-3xl font-bold text-white">Site Settings</h1>
      </div>
      
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Configuration</h2>
        <p className="text-white/60 max-w-md">
          This section is currently under construction. You will be able to manage global site configurations, API keys, and maintenance modes here.
        </p>
      </div>
    </main>
  )
}
