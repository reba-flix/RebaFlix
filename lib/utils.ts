import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRuntime(minutes?: number | null) {
  if (!minutes) return 'Unknown'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours ? `${hours}h ${mins}m` : `${mins}m`
}

export function absoluteUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function isExternalVideoUrl(url?: string | null): boolean {
  if (!url) return false
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false
  }

  try {
    const hostname = new URL(url).hostname
    const internalDomains = [
      'supabase.co',
      'supabase.in',
      'r2.cloudflarestorage.com',
      'r2.dev',
      'cdn.rebaflix.com',
      'localhost',
      '127.0.0.1',
    ]

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      try {
        const appHostname = new URL(appUrl).hostname
        if (!internalDomains.includes(appHostname)) {
          internalDomains.push(appHostname)
        }
      } catch {}
    }

    const r2Public = process.env.R2_PUBLIC_URL
    if (r2Public) {
      try {
        const r2Hostname = new URL(r2Public).hostname
        if (!internalDomains.includes(r2Hostname)) {
          internalDomains.push(r2Hostname)
        }
      } catch {}
    }

    const isInternal = internalDomains.some((domain) =>
      hostname === domain || hostname.endsWith('.' + domain)
    )

    return !isInternal
  } catch {
    return false
  }
}

