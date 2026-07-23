'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Star, Film, Sparkles } from 'lucide-react'
import { demoPosters } from '@/lib/catalog'
import { extractTranslator } from '@/lib/translator'
import { cn } from '@/lib/utils'

type RowItem = {
  id?: string
  slug?: string
  title?: string
  name?: string
  posterUrl?: string | null
  backdropUrl?: string | null
  logoUrl?: string | null
  averageRating?: number | null
  description?: string | null
  translator?: string | null
  itemType?: 'movie' | 'series' | 'live'
  genres?: Array<{ genre: { name: string } }>
  seasons?: Array<{ _count?: { episodes?: number }; episodes?: Array<{ number?: number | null }> }>
  parts?: Array<unknown>
  _count?: { seasons?: number }
  latestEpisodeNumber?: number
  partCount?: number
  videoUrl?: string | null
  releaseDate?: string | Date | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

type NewReleasesRowProps = {
  items: RowItem[]
}

const genreColors: Record<string, string> = {
  action:      'bg-red-600',
  adventure:   'bg-emerald-600',
  drama:       'bg-blue-600',
  comedy:      'bg-yellow-500',
  horror:      'bg-purple-700',
  thriller:    'bg-orange-600',
  romance:     'bg-pink-500',
  animation:   'bg-cyan-500',
  anime:       'bg-violet-600',
  documentary: 'bg-green-700',
  kids:        'bg-lime-400',
  hindi:       'bg-rose-600',
  crime:       'bg-gray-700',
  sci_fi:      'bg-indigo-500',
  'sci-fi':    'bg-indigo-500',
  fantasy:     'bg-teal-600',
}

function getGenreColor(genre: string) {
  const key = genre.toLowerCase().replace(/\s+/g, '_')
  return genreColors[key] ?? genreColors[genre.toLowerCase()] ?? 'bg-[#E50914]'
}

function formatDate(date?: string | Date | null) {
  if (!date) return null
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Spotlight (featured first card) ──────────────────────────────────────────
function SpotlightCard({ item, index }: { item: RowItem; index: number }) {
  const title = item.title ?? item.name ?? 'Untitled'
  const image = item.backdropUrl ?? item.posterUrl ?? item.logoUrl ?? demoPosters[0]
  const isSeries = item.itemType === 'series'
  const genres = item.genres?.map(g => g.genre.name) ?? []
  const primaryGenre = genres[0]
  const watchUrl = isSeries
    ? `/series/${item.slug ?? item.id}`
    : item.id ? `/watch/${item.id}` : '#'
  const infoUrl = isSeries
    ? `/series/${item.slug ?? item.id}`
    : `/movie/${item.slug ?? item.id}`
  const addedDate = item.createdAt ?? item.releaseDate

  return (
    <div className="relative shrink-0 w-[320px] sm:w-[420px] md:w-[520px] h-[280px] sm:h-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10 group">
      {/* Backdrop */}
      <Image
        src={image}
        alt={title}
        fill
        sizes="520px"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        unoptimized
        priority
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

      {/* #1 Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center gap-2">
          <span className="text-5xl font-black text-white/20 leading-none select-none" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.35)', fontFamily: 'Impact, sans-serif' }}>
            #{index + 1}
          </span>
        </div>
      </div>

      {/* NEW ribbon */}
      <div className="absolute top-3 right-3 z-20">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E50914] px-3 py-1 text-[11px] font-black text-white uppercase tracking-widest shadow-lg animate-pulse">
          <Sparkles className="h-3 w-3" />
          NEW
        </span>
      </div>

      {/* Genre badge */}
      {primaryGenre && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide text-white', getGenreColor(primaryGenre))}>
            {primaryGenre}
          </span>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-2 mb-2">{title}</h3>
        <div className="flex items-center gap-3 mb-4">
          {item.averageRating ? (
            <span className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
              <Star className="h-3.5 w-3.5 fill-current" />
              {item.averageRating.toFixed(1)}
            </span>
          ) : null}
          {addedDate && (
            <span className="text-white/50 text-xs">{formatDate(addedDate)}</span>
          )}
          {isSeries && item.latestEpisodeNumber && (
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <Film className="h-3 w-3" /> Ep {item.latestEpisodeNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={watchUrl}
            className="flex items-center gap-2 bg-white hover:bg-white/90 text-black text-sm font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Play className="h-4 w-4 fill-black" />
            Play
          </Link>
          <Link
            href={infoUrl}
            className="text-white/70 hover:text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20 hover:border-white/50 transition-all backdrop-blur-sm"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Small numbered card ───────────────────────────────────────────────────────
function NumberedCard({ item, rank }: { item: RowItem; rank: number }) {
  const title = item.title ?? item.name ?? 'Untitled'
  const image = item.posterUrl ?? item.logoUrl ?? demoPosters[rank % demoPosters.length]
  const isSeries = item.itemType === 'series'
  const genres = item.genres?.map(g => g.genre.name) ?? []
  const primaryGenre = genres[0]
  const watchUrl = isSeries
    ? `/series/${item.slug ?? item.id}`
    : item.id ? `/watch/${item.id}` : '#'

  let latestEpisodeNumber: number | undefined
  if (isSeries) {
    if (item.latestEpisodeNumber !== undefined) {
      latestEpisodeNumber = item.latestEpisodeNumber
    } else if (item.seasons) {
      latestEpisodeNumber = item.seasons.reduce((max, season) => {
        const seasonMax = season.episodes?.reduce((epMax, ep) => Math.max(epMax, Number(ep.number) || 0), 0) ?? season._count?.episodes ?? 0
        return Math.max(max, seasonMax)
      }, 0)
    }
  }

  return (
    <div className="group relative shrink-0 flex items-end gap-0">
      {/* Big rank number behind the card */}
      <span
        className="relative z-0 select-none leading-none text-[5rem] sm:text-[6.5rem] font-black text-white/10 -mr-4"
        style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.12)', fontFamily: 'Impact, Arial Black, sans-serif' }}
      >
        {rank}
      </span>

      {/* Poster card */}
      <div className="relative z-10 w-[110px] sm:w-[130px] shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-xl shadow-black/50 transition-transform duration-300 group-hover:scale-105 group-hover:border-white/30">
        <div className="relative aspect-[2/3]">
          <Link href={watchUrl} className="absolute inset-0 z-0" aria-label={`Play ${title}`} />
          <Image
            src={image}
            alt={title}
            fill
            sizes="130px"
            className="object-cover pointer-events-none"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Genre badge */}
          {primaryGenre && (
            <div className="absolute top-1.5 left-1.5 z-10">
              <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide text-white', getGenreColor(primaryGenre))}>
                {primaryGenre}
              </span>
            </div>
          )}

          {/* NEW badge (only for top 5) */}
          {rank <= 5 && (
            <div className="absolute top-1.5 right-1.5 z-10">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#E50914] text-white uppercase tracking-wider">
                NEW
              </span>
            </div>
          )}

          {/* Episode badge */}
          {isSeries && latestEpisodeNumber && latestEpisodeNumber > 0 && (
            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center z-10">
              <span className="inline-flex items-center gap-0.5 bg-[#E50914] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                <Film className="h-2.5 w-2.5" /> Ep {latestEpisodeNumber}
              </span>
            </div>
          )}

          {/* Play overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="h-4 w-4 fill-black text-black ml-0.5" />
            </div>
          </div>
        </div>

        {/* Title below poster */}
        <div className="px-2 py-1.5 bg-[#1a1a1a]">
          <p className="text-[11px] font-semibold text-white line-clamp-1">{title}</p>
          {item.averageRating ? (
            <p className="text-[10px] text-yellow-400 flex items-center gap-0.5 mt-0.5">
              <Star className="h-2.5 w-2.5 fill-current" /> {item.averageRating.toFixed(1)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
export function NewReleasesRow({ items }: NewReleasesRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  if (!items.length) return null

  const spotlight = items[0]
  const rest = items.slice(1)

  const updateScrollState = () => {
    const el = rowRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current
    if (!el) return
    const amount = dir === 'left' ? -el.clientWidth + 100 : el.clientWidth - 100
    el.scrollBy({ left: amount, behavior: 'smooth' })
    setTimeout(updateScrollState, 400)
  }

  return (
    <section className="px-4 md:px-8 lg:px-12 space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-1.5 rounded-full bg-[#E50914] shadow-[0_0_8px_#E50914]" />
          <h2 className="font-display text-xl md:text-2xl font-black text-white tracking-tight">
            New Releases
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E50914]/15 border border-[#E50914]/30 px-3 py-0.5 text-[11px] font-bold text-[#E50914] uppercase tracking-widest">
          <Sparkles className="h-3 w-3" />
          Just Added
        </span>
      </div>

      {/* Scroll container */}
      <div className="relative group/scroll">
        {/* Left gradient fade */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-20 bg-gradient-to-r from-[#141414] to-transparent transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* Right gradient fade */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-20 bg-gradient-to-l from-[#141414] to-transparent" />

        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:bg-black hover:border-white/40 hover:scale-110',
            'opacity-0 group-hover/scroll:opacity-100',
            !canScrollLeft && 'hidden'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:bg-black hover:border-white/40 hover:scale-110',
            'opacity-0 group-hover/scroll:opacity-100',
            !canScrollRight && 'hidden'
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Scrollable row */}
        <div
          ref={rowRef}
          onScroll={updateScrollState}
          className="scrollbar-hide flex items-end gap-4 overflow-x-auto pb-4 pt-1"
        >
          {/* Featured spotlight card */}
          <SpotlightCard item={spotlight} index={0} />

          {/* Numbered cards */}
          {rest.map((item, i) => (
            <NumberedCard key={item.id ?? item.slug ?? `nr-${i}`} item={item} rank={i + 2} />
          ))}
        </div>
      </div>
    </section>
  )
}
