import { getSessionUser, hasRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Users, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { UserGrowthChart } from '@/components/admin/UserGrowthChart'
import { format, subDays, isSameDay } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const sessionUser = await getSessionUser()
  if (!hasRole(sessionUser, 'ADMIN')) redirect('/')

  // Fetch all users
  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Get new users (created in the last 24 hours)
  const oneDayAgo = subDays(new Date(), 1)
  const newUsers = allUsers.filter(u => new Date(u.createdAt) >= oneDayAgo)

  // Generate chart data for the last 14 days
  const chartData = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), 13 - i)
    const count = allUsers.filter(u => isSameDay(new Date(u.createdAt), date)).length
    return {
      date: format(date, 'MMM dd'),
      users: count
    }
  })

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-[#E50914]" />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Manage Users</h1>
            <p className="text-white/50 text-sm mt-1">View user growth and manage accounts.</p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-white/10 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">User Growth (Last 14 Days)</h2>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <UserGrowthChart data={chartData} />
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-white/50 mb-2">Total Users</h3>
            <p className="text-5xl font-display font-bold text-white">{allUsers.length}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-white/50 mb-2">New Users (24h)</h3>
            <p className="text-5xl font-display font-bold text-emerald-500">+{newUsers.length}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Email</th>
                <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Joined Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/10">
                        {user.name?.[0] || user.email[0]}
                      </div>
                      <span className="font-medium text-white/90">{user.name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white/70">{user.email}</td>
                  <td className="py-4 px-6 text-white/50 text-sm">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-xs font-medium text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-white/50">
                    No users found.
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
