export const metadata = { title: 'Privacy notice' }

export default function PrivacyPage() {
  return <main className="mx-auto w-full max-w-4xl px-5 py-16 text-white sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">RebaaFlix privacy</p>
    <h1 className="mt-3 text-3xl font-bold">Audience measurement notice</h1>
    <p className="mt-5 leading-relaxed text-zinc-300">RebaaFlix is preparing a first-party, aggregate audience-measurement design for understanding content performance and technical operation. When enabled, it records daily totals for movie, series, episode, and part views and downloads; measured watch seconds and playback starts; completion counts; and coarse device categories (desktop, mobile, tablet, other). Episode totals are also included in parent-series reports. Exact unique viewers and visitor browsing histories are not measured in this design.</p>
    <section className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <h2 className="text-lg font-semibold">Data and retention</h2>
      <p className="text-sm leading-relaxed text-zinc-400">Permanent audience records are content/day/device counters and contain no account ID, email, username, IP address, full user-agent, or visitor identifier. A random playback operation ID and watched intervals exist only as short-lived calculation state while playback is active; state expires after two minutes without a heartbeat. A separate opaque retry/deduplication key expires after 30 seconds. Aggregate daily rows are retained for up to 13 months. Older lifetime view counters are kept separately.</p>
      <p className="text-sm leading-relaxed text-zinc-400">Analytics are not intended for advertising, marketing, cross-site tracking, or individual profiling. Audience analytics are not sent to advertising networks. Cloudflare, hosting, and database providers may process operational data as service providers; their applicable contracts, locations, and logs must be reviewed before production use.</p>
    </section>
    <section className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <h2 className="text-lg font-semibold">Your choice and rights</h2>
      <p className="text-sm leading-relaxed text-zinc-400">Use the persistent Privacy settings control to object to or resume audience measurement. The setting does not affect access to RebaaFlix or Google advertising preferences. Global Privacy Control and Do Not Track signals are also respected. Because daily data is aggregated by content and device category, it is not designed to identify or retrieve one person’s viewing activity.</p>
      <p className="text-sm leading-relaxed text-zinc-400">For questions or to exercise applicable data-protection rights, contact RebaaFlix through the site’s support channel and identify your request as a privacy request. The controller identity and designated privacy contact should be stated in the site’s production privacy documentation before this measurement path is activated.</p>
    </section>
    <p className="mt-8 text-xs leading-relaxed text-zinc-500">This notice describes the proposed aggregate analytics path only. Older analytics records remain stored separately and are not represented as anonymous by this notice. This implementation is a candidate design for legal evaluation, not a CNIL certification or a legal compliance determination.</p>
  </main>
}
