import { getSessionUser, hasRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Activity, Search, Filter } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const logs = await prisma.analyticsEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: true }
  })

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-[#E50914]" />
          <h1 className="font-display text-3xl font-bold text-white">System Logs</h1>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium transition-colors border border-white/10">
              <Filter className="w-4 h-4" /> Filter Logs
           </button>
        </div>
      </div>
      
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.04]">
                <th className="p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Event Name</th>
                <th className="p-4 text-xs font-medium text-white/50 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Path</th>
                <th className="p-4 text-xs font-medium text-white/50 uppercase tracking-wider">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.04] transition-colors group">
                  <td className="p-4 text-sm text-white/70 whitespace-nowrap group-hover:text-white transition-colors">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/10">
                      {log.name}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-white/70 group-hover:text-white transition-colors">
                    {log.user ? log.user.email : <span className="text-white/30 italic">Anonymous</span>}
                  </td>
                  <td className="p-4 text-sm text-white/70 group-hover:text-white transition-colors">
                    {log.path || <span className="text-white/30">-</span>}
                  </td>
                  <td className="p-4 text-sm text-white/50 font-mono text-xs max-w-xs truncate group-hover:text-white/80 transition-colors">
                    {log.metadata ? JSON.stringify(log.metadata) : <span className="text-white/30">-</span>}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-white/50 flex flex-col items-center justify-center gap-3">
                    <Activity className="w-8 h-8 opacity-20" />
                    <span>No system logs recorded yet.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
