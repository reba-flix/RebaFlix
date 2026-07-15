import { Radio } from 'lucide-react'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function LivePage() {
  const channels = await prisma.liveChannel.findMany({
    where: { active: true },
    include: {
      category: true,
      schedules: {
        where: { endsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        take: 5,
      },
    },
    orderBy: { sortOrder: 'asc' },
  })
  const active = channels[0]

  return (
    <main className="min-h-screen px-4 pb-16 pt-28 md:px-8 lg:px-12">
      <div className="mb-6 flex items-center gap-3">
        <Radio className="h-6 w-6 text-primary-500" />
        <h1 className="font-display text-3xl font-black md:text-5xl">Live TV</h1>
      </div>
      {active ? (
        <VideoPlayer src={active.streamUrl} poster={active.logoUrl} title={active.name} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-md bg-white/[0.03] text-white/60">
          No live channels configured yet.
        </div>
      )}
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {channels.map((channel) => (
          <article key={channel.id} className="rounded-md border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{channel.name}</h2>
              <Badge variant="live">LIVE</Badge>
            </div>
            <p className="text-sm text-white/60">{channel.description}</p>
            <div className="mt-4 space-y-2">
              {channel.schedules.map((schedule) => (
                <div key={schedule.id} className="rounded bg-black/30 p-3 text-sm text-white/70">
                  <span className="font-semibold text-white">{schedule.title}</span>
                  <span className="ml-2">
                    {schedule.startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
