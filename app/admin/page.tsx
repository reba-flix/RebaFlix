import { redirect } from 'next/navigation'
import { BarChart3, Clapperboard, CreditCard, Radio, Settings, Users, ArrowUpRight, ArrowDownRight, Upload, Play, ShieldAlert, Activity, Eye, MousePointerClick } from 'lucide-react'
import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [movies, users, channels, payments, movieViews, seriesViews, siteVisits, visitsToday] = await Promise.all([
    prisma.movie.count(),
    prisma.user.count(),
    prisma.liveChannel.count(),
    prisma.payment.aggregate({ _sum: { amountCents: true } }),
    prisma.movie.aggregate({ _sum: { viewCount: true } }),
    prisma.series.aggregate({ _sum: { viewCount: true } }),
    prisma.analyticsEvent.count({ where: { name: 'site_visit' } }),
    prisma.analyticsEvent.count({ where: { name: 'site_visit', createdAt: { gte: today } } }),
  ])
  
  const totalViews = (movieViews._sum.viewCount || 0) + (seriesViews._sum.viewCount || 0)

  const stats = [
    { label: 'Total Movies', value: movies, icon: Clapperboard, trend: '+12%', up: true, href: '/admin/movies' },
    { label: 'Active Users', value: users, icon: Users, trend: '+4%', up: true, href: '/admin/users' },
    { label: 'Live Channels', value: channels, icon: Radio, trend: '0%', up: true, href: '/admin/channels' },
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, trend: '+8%', up: true, href: '/admin/analytics' },
    { label: 'Site Visits', value: siteVisits.toLocaleString(), icon: MousePointerClick, trend: `${visitsToday.toLocaleString()} today`, up: true, href: '/admin/analytics' },
    { label: 'Revenue', value: `$${((payments._sum.amountCents ?? 0) / 100).toLocaleString()}`, icon: CreditCard, trend: '+24%', up: true, href: '/admin/revenue' },
  ]

  const recentActivity = [
    { id: 1, type: 'Upload', desc: 'Inception was added to Movies', time: '2 hours ago' },
    { id: 2, type: 'User', desc: 'New user registration (john@example.com)', time: '4 hours ago' },
    { id: 3, type: 'Subscription', desc: 'Payment received: $14.99 via Stripe', time: '5 hours ago' },
    { id: 4, type: 'System', desc: 'Daily database backup completed successfully', time: '12 hours ago' },
  ]

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-white/50 text-sm">Welcome back, {user?.name || user?.email}. Here is what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/movies/new" className="flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#E50914]/20">
            <Upload className="w-4 h-4" /> Upload Content
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-10">
        {stats.map(({ label, value, icon: Icon, trend, up, href }) => (
          <Link href={href} key={label} className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40">
            {/* Subtle Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-white/50">{label}</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-white">{value}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-[#E50914] group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6" />
              </div>
            </div>
            
            <div className="relative z-10 mt-4 flex items-center text-sm">
              <span className={`flex items-center font-medium ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                {up ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
                {trend}
              </span>
              <span className="ml-2 text-white/40 text-xs">vs last month</span>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <section className="lg:col-span-1 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white/90">Quick Actions</h2>
          <div className="grid gap-3">
            {[
              { label: 'Manage Users & Roles', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Site Settings & Config', icon: Settings, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'Review Reported Comments', icon: ShieldAlert, color: 'text-orange-400', bg: 'bg-orange-400/10' },
              { label: 'Broadcast Live Event', icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((action, i) => (
              <button key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-left group">
                <div className={`p-3 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-white/80 group-hover:text-white text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white/90">Recent Activity</h2>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="divide-y divide-white/5">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <span className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70 mb-2">
                      {activity.type}
                    </span>
                    <p className="text-sm text-white/90">{activity.desc}</p>
                  </div>
                  <div className="text-xs text-white/40 text-right whitespace-nowrap ml-4">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 text-xs font-medium text-white/50 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] transition-colors border-t border-white/5">
              View All Activity
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
