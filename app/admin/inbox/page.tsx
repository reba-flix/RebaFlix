import { getSessionUser, hasRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Inbox } from 'lucide-react'
import { AdminInboxClient } from '@/components/admin/AdminInboxClient'

export const dynamic = 'force-dynamic'

export default async function AdminInboxPage() {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const messages = await prisma.supportMessage.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, name: true } },
    },
  })

  const pending = messages.filter((m) => !m.reply).length

  return (
    <main className="px-4 pb-16 pt-8 md:px-8 lg:px-12 w-full">
      <div className="flex items-center gap-3 mb-8">
        <Inbox className="w-8 h-8 text-[#E50914]" />
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Support Inbox
            {pending > 0 && (
              <span className="ml-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E50914] text-white text-xs font-bold">
                {pending}
              </span>
            )}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {messages.length} total · {pending} pending reply
          </p>
        </div>
      </div>

      <AdminInboxClient messages={messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
        repliedAt: m.repliedAt?.toISOString() ?? null,
      }))} />
    </main>
  )
}
