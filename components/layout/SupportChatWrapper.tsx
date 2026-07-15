'use client'

import dynamic from 'next/dynamic'

const SupportChatDynamic = dynamic(
  () => import('./SupportChat').then((m) => m.SupportChat),
  { ssr: false }
)

export function SupportChatWrapper() {
  return <SupportChatDynamic />
}
