import { redirect } from 'next/navigation'
import { getSessionUser, hasRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SiteVisitsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')
  redirect('/admin/analytics')
}
