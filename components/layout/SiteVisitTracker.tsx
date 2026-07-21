'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const VISIT_KEY = 'rebaflix_site_visit_recorded'

export function SiteVisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(VISIT_KEY)) return

    window.sessionStorage.setItem(VISIT_KEY, '1')

    const path = `${window.location.pathname}${window.location.search}`

    fetch('/api/analytics/site-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch(() => {
      window.sessionStorage.removeItem(VISIT_KEY)
    })
  }, [pathname])

  return null
}
