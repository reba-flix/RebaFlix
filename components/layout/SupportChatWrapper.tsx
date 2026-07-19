'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const SupportChatDynamic = dynamic(
  () => import('./SupportChat').then((m) => m.SupportChat),
  { ssr: false }
)

export function SupportChatWrapper() {
  const pathname = usePathname()
  if (pathname?.startsWith('/watch')) return null

  return <SupportChatDynamic />
}
