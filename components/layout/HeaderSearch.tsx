'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2, Mic } from 'lucide-react'
import type { SearchResult } from '@/lib/search-catalog'

export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const request = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const pathname = usePathname()
  const router = useRouter()
  const trimmed = query.trim()
  const expanded = open && trimmed.length > 0
  const href = (item: SearchResult) => `/${item.type}/${encodeURIComponent(item.slug)}`

  function close(restoreFocus = false) {
    generation.current++
    request.current?.abort()
    setOpen(false)
    setQuery('')
    setResults([])
    setActive(-1)
    setStatus('idle')
    if (restoreFocus) trigger.current?.focus()
  }

  useEffect(() => { close() }, [pathname])
  useEffect(() => {
    if (open) input.current?.focus()
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  useEffect(() => {
    if (!open || !trimmed) return
    const controller = new AbortController()
    request.current = controller
    const version = generation.current
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?autocomplete=1&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Search unavailable')
        const data = await response.json()
        if (!controller.signal.aborted && generation.current === version) {
          setResults(data.results)
          setStatus('ready')
        }
      } catch {
        if (!controller.signal.aborted && generation.current === version) setStatus('error')
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [open, query, trimmed])

  useEffect(() => {
    if (active >= 0) document.getElementById(`header-search-result-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <div ref={container} className="relative" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close()
    }}>
      <button ref={trigger} type="button" aria-label="Search" aria-expanded={open}
        onClick={() => open ? close() : setOpen(true)}
        className="rounded-md p-2 text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400">
        <Search className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[4.25rem] z-[60] md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[min(24rem,calc(100vw-2rem))]">
          <form className="flex items-center rounded-md border border-white/30 bg-[#141414] shadow-xl focus-within:border-red-400"
            onSubmit={event => {
              event.preventDefault()
              if (!trimmed) return
              router.push(active >= 0 && results[active] ? href(results[active]) : `/search?q=${encodeURIComponent(trimmed)}`)
              close()
            }}>
            <Search aria-hidden="true" className="ml-3 h-4 w-4 shrink-0 text-white/60" />
            <input ref={input} type="search" role="combobox" aria-label="Search movies, series, translators or genres"
              aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? 'header-search-results' : undefined}
              aria-activedescendant={active >= 0 ? `header-search-result-${active}` : undefined}
              autoComplete="off" maxLength={100} value={query} placeholder="Search titles, translators..."
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-white outline-none md:text-sm"
              onChange={event => {
                generation.current++
                request.current?.abort()
                setQuery(event.target.value)
                setResults([])
                setActive(-1)
                setStatus(event.target.value.trim() ? 'loading' : 'idle')
              }}
              onKeyDown={event => {
                if (event.key === 'Escape') { event.preventDefault(); close(true) }
                if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
                  event.preventDefault()
                  setActive(index => event.key === 'ArrowDown' ? (index + 1) % results.length : (index <= 0 ? results.length - 1 : index - 1))
                }
              }} />
            <button type="button" onClick={() => close(true)} aria-label="Close search" className="rounded p-3 text-white/70 focus-visible:outline focus-visible:outline-red-400"><X className="h-4 w-4" /></button>
          </form>
          {expanded && (
            <div className="mt-2 max-h-[min(65dvh,30rem)] overflow-y-auto rounded-md border border-white/15 bg-[#141414] p-2 shadow-2xl shadow-black/70">
              <p role="status" className={status === 'ready' && results.length ? 'sr-only' : 'px-2 py-3 text-sm text-white/75'}>
                {status === 'loading' ? <><Loader2 aria-hidden="true" className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" />Searching...</> :
                  status === 'error' ? 'Search is temporarily unavailable. Please try again.' :
                    results.length ? `${results.length} results` : 'No results found'}
              </p>
              <ul id="header-search-results" role="listbox" aria-label="Search results">
                {results.map((item, index) => (
                  <li key={`${item.type}-${item.id}`} role="option" id={`header-search-result-${index}`} aria-selected={active === index}>
                    <Link href={href(item)} onClick={() => close()} tabIndex={-1}
                      className={`flex gap-3 rounded-md p-2 ${active === index ? 'bg-white/15 outline outline-1 outline-red-400' : 'hover:bg-white/10'}`}>
                      {item.posterUrl ? <img src={item.posterUrl} alt="" className="h-[4.5rem] w-12 shrink-0 rounded object-cover" /> : <span className="h-[4.5rem] w-12 shrink-0 rounded bg-white/10" />}
                      <span className="min-w-0 self-center">
                        <span className="block break-words text-sm font-semibold text-white">{item.title}</span>
                        {item.translator && <span className="mt-1 block break-words text-xs text-red-400"><Mic aria-hidden="true" className="mr-1 inline h-3 w-3" />{item.translator}</span>}
                        <span className="mt-1 block break-words text-xs text-white/65">{[item.year, item.genres[0], item.type === 'movie' ? 'Movie' : 'Series'].filter(Boolean).join(' • ')}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
