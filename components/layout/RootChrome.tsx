'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { SupportChatWrapper } from '@/components/layout/SupportChatWrapper'

export function RootChrome() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Footer />}
      <SupportChatWrapper />
    </>
  )
}
