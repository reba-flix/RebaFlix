'use client'

import { usePathname } from 'next/navigation'
import { AdminUploadStatus } from '@/components/admin/AdminUploadStatus'
import { Footer } from '@/components/layout/Footer'
import { SiteVisitTracker } from '@/components/layout/SiteVisitTracker'
import { SupportChatWrapper } from '@/components/layout/SupportChatWrapper'

export function RootChrome() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <>
      {!isAdmin && <SiteVisitTracker />}
      {!isAdmin && <Footer />}
      <SupportChatWrapper />
      <AdminUploadStatus />
    </>
  )
}
