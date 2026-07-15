import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User, Mail, Shield, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login?next=/profile')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: { include: { role: true } }
    }
  })

  if (!dbUser) return null

  const isAdmin = dbUser.roles.some(r => r.role.name === 'ADMIN')

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-12 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold font-display mb-8">My Profile</h1>
        
        <div className="bg-[#141414] border border-white/10 rounded-xl p-6 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E50914] to-[#9f0710] flex items-center justify-center text-white font-bold text-4xl shrink-0">
              {dbUser.name?.[0]?.toUpperCase() ?? dbUser.email[0].toUpperCase()}
            </div>
            
            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{dbUser.name || 'User'}</h2>
                <div className="flex items-center gap-2 mt-1 text-white/60">
                  <Mail className="w-4 h-4" />
                  <span>{dbUser.email}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/5 rounded-md px-3 py-1.5 text-sm">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>Joined {dbUser.createdAt.toLocaleDateString()}</span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 bg-[#E50914]/10 text-[#E50914] rounded-md px-3 py-1.5 text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    <span>Administrator</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link href="/settings">Account Settings</Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="default" className="bg-[#E50914] hover:bg-[#b8070f]">
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
