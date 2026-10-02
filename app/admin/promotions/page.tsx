import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { HomepagePromotionsClient } from '@/components/admin/HomepagePromotionsClient'
import { getSessionUser, hasRole } from '@/lib/auth'
import { getHomepagePromotions } from '@/lib/homepage-promotions'

export const dynamic = 'force-dynamic'

export default async function AdminPromotionsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const promotions = await getHomepagePromotions({ activeOnly: false })

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-[#E50914]" />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Homepage Promotions</h1>
            <p className="mt-1 text-sm text-white/50">Choose and order the Featured Picks row shown on the homepage.</p>
          </div>
        </div>
      </div>

      <HomepagePromotionsClient initialPromotions={JSON.parse(JSON.stringify(promotions))} />
    </main>
  )
}