'use client'

import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Film, Plus, Search, Save, Trash2, Tv } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CatalogItem = {
  id: string
  title: string
  slug: string
  posterUrl?: string | null
  releaseDate?: string | Date | null
  createdAt?: string | Date | null
  itemType: 'movie' | 'series'
  genres?: Array<{ genre: { name: string } }>
}

type Promotion = {
  id: string
  contentType: 'MOVIE' | 'SERIES'
  sortOrder: number
  active: boolean
  movie?: CatalogItem | null
  series?: CatalogItem | null
}

type HomepagePromotionsClientProps = {
  initialPromotions: Promotion[]
}

function itemFromPromotion(promotion: Promotion) {
  return promotion.contentType === 'SERIES' ? promotion.series : promotion.movie
}

function getYear(item?: CatalogItem | null) {
  const value = item?.releaseDate ?? item?.createdAt
  if (!value) return null
  const year = new Date(value).getFullYear()
  return Number.isFinite(year) ? year : null
}

function getGenres(item?: CatalogItem | null) {
  return item?.genres?.map((entry) => entry.genre.name).filter(Boolean).slice(0, 2) ?? []
}

export function HomepagePromotionsClient({ initialPromotions }: HomepagePromotionsClientProps) {
  const [promotions, setPromotions] = useState(initialPromotions)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogItem[]>([])
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const promotedContentKeys = useMemo(() => new Set(promotions.map((promotion) => {
    const item = itemFromPromotion(promotion)
    return item ? `${promotion.contentType}:${item.id}` : promotion.id
  })), [promotions])

  const refreshPromotions = async () => {
    const response = await fetch('/api/admin/promotions', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'Failed to load promotions')
    setPromotions(data.promotions)
  }

  const searchCatalog = () => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    startTransition(async () => {
      setMessage('')
      const response = await fetch(`/api/admin/promotions?q=${encodeURIComponent(trimmed)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error ?? 'Search failed')
        return
      }
      setResults(data.results)
    })
  }

  const addItem = (item: CatalogItem) => {
    startTransition(async () => {
      setMessage('')
      const contentType = item.itemType === 'series' ? 'SERIES' : 'MOVIE'
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          movieId: contentType === 'MOVIE' ? item.id : undefined,
          seriesId: contentType === 'SERIES' ? item.id : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error ?? 'Could not add item')
        return
      }
      await refreshPromotions()
      setMessage('Promoted item added.')
    })
  }

  const removeItem = (id: string) => {
    startTransition(async () => {
      setMessage('')
      const response = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error ?? 'Could not remove item')
        return
      }
      setPromotions((current) => current.filter((promotion) => promotion.id !== id).map((promotion, index) => ({ ...promotion, sortOrder: index + 1 })))
      setMessage('Promoted item removed. Save lineup to persist the new numbering.')
    })
  }

  const moveItem = (id: string, targetIndex: number) => {
    setPromotions((current) => {
      const index = current.findIndex((promotion) => promotion.id === id)
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next.map((promotion, orderIndex) => ({ ...promotion, sortOrder: orderIndex + 1 }))
    })
  }

  const toggleActive = (id: string) => {
    setPromotions((current) => current.map((promotion) => (
      promotion.id === id ? { ...promotion, active: !promotion.active } : promotion
    )))
  }

  const saveLineup = () => {
    startTransition(async () => {
      setMessage('')
      const response = await fetch('/api/admin/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: promotions.map((promotion, index) => ({
            id: promotion.id,
            sortOrder: index + 1,
            active: promotion.active,
          })),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error ?? 'Could not save lineup')
        return
      }
      setPromotions(data.promotions)
      setMessage('Lineup saved.')
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-xl border border-white/10 bg-[#1a1a1a] overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Current lineup</h2>
            <p className="mt-1 text-xs text-white/45">The homepage reads this exact order from the database.</p>
          </div>
          <Button onClick={saveLineup} disabled={isPending || promotions.length === 0} className="w-fit">
            <Save className="h-4 w-4" /> Save Lineup
          </Button>
        </div>

        <div className="divide-y divide-white/5">
          {promotions.map((promotion, index) => {
            const item = itemFromPromotion(promotion)
            const genres = getGenres(item)
            const year = getYear(item)
            const isSeries = promotion.contentType === 'SERIES'

            return (
              <div key={promotion.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white/70">
                    {index + 1}
                  </div>
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-white/5">
                    {item?.posterUrl ? (
                      <Image src={item.posterUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-white">{item?.title ?? 'Missing content'}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                        {isSeries ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                        {isSeries ? 'Series' : 'Movie'}
                      </span>
                      <span className={promotion.active ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300' : 'rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300'}>
                        {promotion.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {[year, ...genres].filter(Boolean).join(' / ') || item?.slug || 'This referenced item may have been removed.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="outline" size="sm" onClick={() => moveItem(promotion.id, 0)} disabled={index === 0 || isPending} aria-label={`Move ${item?.title ?? 'item'} to top`}>
                    <ChevronsUp className="h-3.5 w-3.5" /> Top
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => moveItem(promotion.id, index - 1)} disabled={index === 0 || isPending} aria-label={`Move ${item?.title ?? 'item'} up`}>
                    <ArrowUp className="h-3.5 w-3.5" /> Up
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => moveItem(promotion.id, index + 1)} disabled={index === promotions.length - 1 || isPending} aria-label={`Move ${item?.title ?? 'item'} down`}>
                    <ArrowDown className="h-3.5 w-3.5" /> Down
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => moveItem(promotion.id, promotions.length - 1)} disabled={index === promotions.length - 1 || isPending} aria-label={`Move ${item?.title ?? 'item'} to bottom`}>
                    <ChevronsDown className="h-3.5 w-3.5" /> Bottom
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => toggleActive(promotion.id)} disabled={isPending}>
                    {promotion.active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => removeItem(promotion.id)} disabled={isPending} aria-label={`Remove ${item?.title ?? 'item'} from promotions`}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>
            )
          })}

          {promotions.length === 0 && (
            <div className="px-5 py-14 text-center text-sm text-white/40">No promoted items yet.</div>
          )}
        </div>
      </section>

      <aside className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 h-fit">
        <h2 className="text-base font-semibold text-white">Add content</h2>
        <p className="mt-1 text-xs text-white/45">Search published movies and series, then add existing catalog items.</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && searchCatalog()}
            placeholder="Search catalog..."
          />
          <Button onClick={searchCatalog} disabled={isPending} size="icon" aria-label="Search catalog">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {results.map((item) => {
            const contentType = item.itemType === 'series' ? 'SERIES' : 'MOVIE'
            const alreadyPromoted = promotedContentKeys.has(`${contentType}:${item.id}`)
            const year = getYear(item)

            return (
              <div key={`${item.itemType}-${item.id}`} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-white/5">
                  {item.posterUrl ? <Image src={item.posterUrl} alt="" fill sizes="44px" className="object-cover" unoptimized /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-white/45">{item.itemType === 'series' ? 'Series' : 'Movie'}{year ? ` / ${year}` : ''}</p>
                </div>
                <Button size="icon-sm" onClick={() => addItem(item)} disabled={alreadyPromoted || isPending} aria-label={`Add ${item.title} to promotions`}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
          {query && results.length === 0 && !isPending ? (
            <p className="py-6 text-center text-sm text-white/40">No published content found.</p>
          ) : null}
        </div>

        {message ? <p className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70">{message}</p> : null}
      </aside>
    </div>
  )
}