import { redirect } from 'next/navigation'
import { getSessionUser, hasRole } from '@/lib/auth'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'
export const dynamic = 'force-dynamic'
export default async function AnalyticsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')
  return <AnalyticsDashboard />
}
