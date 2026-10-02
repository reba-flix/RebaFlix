import { redirect } from 'next/navigation'
import { getSessionUser, hasRole } from '@/lib/auth'
import { Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')
  return <main className="w-full px-4 py-10 md:px-8">
    <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
      <Activity className="mb-4 h-7 w-7 text-red-500" />
      <h1 className="text-2xl font-semibold">System Logs</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">Visitor-level audience event records are not displayed here. Professional Analytics reports aggregate content statistics only. Security and administrator audit logs are a separate operational record and are not sourced from audience-measurement data.</p>
      <p className="mt-3 text-sm text-zinc-500">No separate security-log provider is currently connected to this page.</p>
    </div>
  </main>
}
