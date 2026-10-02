'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { analyticsOptedOut, setAnalyticsOptOut } from '@/lib/analytics/client'

export function SiteVisitTracker() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [optedOut, setOptedOut] = useState(false)
  const enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true'
  const privacySignal = navigatorSignal()

  useEffect(() => {
    setOptedOut(analyticsOptedOut())
  }, [])

  if (!enabled || pathname?.startsWith('/admin')) return null
  const toggle = () => {
    const next = !optedOut
    setAnalyticsOptOut(next)
    setOptedOut(next)
  }

  return <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="fixed bottom-3 left-3 z-40 rounded-full border border-white/15 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-300 shadow-lg hover:border-red-500/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
      aria-haspopup="dialog"
    >Privacy settings</button>
    {open && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-3 sm:items-center" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="analytics-preferences-title" className="w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="analytics-preferences-title" className="text-lg font-semibold">Privacy settings</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">RebaaFlix uses first-party audience measurement to total content views, downloads, watch time, completion, and broad device categories. It is for site performance and content statistics, not advertising or cross-site tracking.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close privacy settings" className="rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-zinc-300 hover:text-white">Close</button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">Daily aggregate rows are retained for up to 13 months. Active playback calculation state expires after 2 minutes without a heartbeat; duplicate-protection state expires after 30 seconds. No account ID, email, IP address, full user-agent, or visitor history is stored by this aggregate analytics path. See the <Link className="text-white underline underline-offset-2" href="/privacy">privacy notice</Link>.</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <span className="text-sm text-zinc-300">Audience measurement is {optedOut ? 'off' : 'on'}{privacySignal ? ' due to your browser privacy signal' : ''}.</span>
          <button type="button" disabled={privacySignal} onClick={toggle} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
            {optedOut ? 'Turn on audience measurement' : 'Object and turn off'}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">This setting is separate from Google advertising and CMP preferences.</p>
      </section>
    </div>}
  </>
}

function navigatorSignal() {
  return typeof navigator !== 'undefined' && ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true || navigator.doNotTrack === '1')
}
