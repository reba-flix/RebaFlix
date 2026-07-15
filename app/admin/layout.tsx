import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSessionUser, hasRole } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user || !hasRole(user, 'ADMIN')) {
    redirect('/')
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 flex max-w-[1600px] mx-auto">
      <AdminSidebar />
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 relative z-0 w-full min-h-[calc(100vh-6rem)] bg-gradient-to-br from-black to-[#0a0a0a] p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </div>
  )
}
