import { getSessionUser, hasRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Settings, Save } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#E50914]" />
          <h1 className="font-display text-3xl font-bold text-white">Site Settings</h1>
        </div>
        <button className="flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#E50914]/20 border border-[#E50914]/50">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        {/* General Configuration */}
        <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:p-8 shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#E50914] rounded-full"></span>
            General Configuration
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Site Name</label>
              <input type="text" defaultValue="RebaFlix" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all shadow-inner" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Support Email</label>
              <input type="email" defaultValue="support@rebaflix.com" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all shadow-inner" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Site Description</label>
              <textarea rows={4} defaultValue="The best place to watch movies and series." className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all shadow-inner resize-none" />
            </div>
          </div>
        </section>

        {/* Features & Maintenance */}
        <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:p-8 shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#E50914] rounded-full"></span>
            Features & Maintenance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-[#1a1a1a] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
              <div>
                <h3 className="font-medium text-white mb-1">Maintenance Mode</h3>
                <p className="text-sm text-white/50">Disable access to the site for non-admins.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-5 bg-[#1a1a1a] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
              <div>
                <h3 className="font-medium text-white mb-1">Allow Registrations</h3>
                <p className="text-sm text-white/50">Enable or disable new user signups.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-[#1a1a1a] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
              <div>
                <h3 className="font-medium text-white mb-1">Require Email Verification</h3>
                <p className="text-sm text-white/50">Users must verify email before watching.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
              </label>
            </div>
          </div>
        </section>

        {/* API Keys & Integrations */}
        <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:p-8 md:col-span-2 shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#E50914] rounded-full"></span>
            API Keys & Integrations
          </h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Stripe Public Key</label>
                <input type="text" placeholder="pk_test_..." defaultValue="pk_test_51OaXXXXXXXXXXXX" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Stripe Secret Key</label>
                <input type="password" placeholder="sk_test_..." defaultValue="sk_test_51OaXXXXXXXXXXXX" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">TMDB API Key</label>
                <input type="password" placeholder="Enter TMDB API Key" defaultValue="ab1234567890cdef1234567890abcdef" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">AWS S3 Bucket Name</label>
                <input type="text" placeholder="my-streaming-bucket" defaultValue="rebaflix-media-production" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all font-mono text-sm" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
