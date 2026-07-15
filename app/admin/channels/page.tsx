import { getSessionUser, hasRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Radio } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminChannelsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex items-center gap-3 mb-8">
        <Radio className="w-8 h-8 text-[#E50914]" />
        <h1 className="font-display text-3xl font-bold text-white">Live Channels</h1>
      </div>
      
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Channel Management</h2>
        <p className="text-white/60 max-w-md">
          This section is currently under construction. Here you will be able to manage live streams, schedules, and broadcasts.
        </p>
      </div>
    </main>
  )
}
