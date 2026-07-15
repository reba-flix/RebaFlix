import { getSessionUser, hasRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminRevenuePage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-8 h-8 text-[#E50914]" />
        <h1 className="font-display text-3xl font-bold text-white">Revenue & Payments</h1>
      </div>
      
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Financial Overview</h2>
        <p className="text-white/60 max-w-md">
          This section is currently under construction. Check back soon for detailed revenue analytics and subscription management.
        </p>
      </div>
    </main>
  )
}
