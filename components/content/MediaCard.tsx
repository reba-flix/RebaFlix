'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Languages, Play, Download, Heart, Star, Bookmark, Film } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Genre → color mapping for the badge
const genreColors: Record<string, string> = {
  action:       'bg-red-600 text-white',
  adventure:    'bg-emerald-600 text-white',
  drama:        'bg-blue-600 text-white',
  comedy:       'bg-yellow-500 text-black',
  horror:       'bg-purple-700 text-white',
  thriller:     'bg-orange-600 text-white',
  romance:      'bg-pink-500 text-white',
  animation:    'bg-cyan-500 text-black',
  anime:        'bg-violet-600 text-white',
  documentary:  'bg-green-700 text-white',
  kids:         'bg-lime-400 text-black',
  hindi:        'bg-rose-600 text-white',
  crime:        'bg-gray-700 text-white',
  sci_fi:       'bg-indigo-500 text-white',
  'sci-fi':     'bg-indigo-500 text-white',
  fantasy:      'bg-teal-600 text-white',
}

function getGenreColor(genre: string) {
  const key = genre.toLowerCase().replace(/\s+/g, '_')
  return genreColors[key] ?? genreColors[genre.toLowerCase()] ?? 'bg-[#E50914] text-white'
}

type MediaCardProps = {
  id?: string
  slug?: string
  title: string
  image?: string | null
  type?: 'movie' | 'series' | 'live'
  rating?: number | null
  translator?: string | null
  href?: string
  compact?: boolean
  genres?: string[]
  latestEpisodeNumber?: number
  partCount?: number
  releaseYear?: number | string | null
}

export function MediaCard({
  id,
  slug,
  title,
  image,
  type = 'movie',
  rating,
  translator,
  href,
  compact,
  genres = [],
  latestEpisodeNumber,
  partCount,
  releaseYear,
}: MediaCardProps) {
  const target = href ?? (type === 'live' ? '/live' : `/${type === 'series' ? 'series' : 'movie'}/${slug ?? id}`)
  const watchTarget = type === 'series' ? target : (id ? `/watch/${id}` : target)
  const downloadTarget = id ? `/api/${type === 'series' ? 'series' : 'movies'}/${id}/download` : '#'

  const [liked, setLiked] = useState(false)
  const [liking, setLiking] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const primaryGenre = genres[0] ?? null
  const isSeason = type === 'series'

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (liking || !id) return
    setLiking(true)
    try {
      if (!liked) {
        const res = await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ movieId: id }) })
        if (res.ok) setLiked(true)
        else if (res.status === 401) window.location.href = '/login'
      } else { setLiked(false) }
    } catch {} finally { setLiking(false) }
  }

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (saving || !id) return
    setSaving(true)
    try {
      if (!saved) {
        const res = await fetch('/api/watch-later', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ movieId: id }) })
        if (res.ok) setSaved(true)
        else if (res.status === 401) window.location.href = '/login'
      } else { setSaved(false) }
    } catch {} finally { setSaving(false) }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    window.open(downloadTarget, '_blank')
  }

  return (
    <div className={cn(
      'group relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#151515] shadow-lg shadow-black/30 transition duration-300 hover:z-10 hover:scale-[1.035] hover:border-white/20 hover:shadow-2xl hover:shadow-black/70',
      compact ? 'w-44' : 'w-52 md:w-60'
    )}>
      <div className="relative aspect-[2/3] block">
        <Link href={target} className="absolute inset-0 z-0" aria-label={title}>
          <span className="sr-only">{title}</span>
        </Link>

        {image ? (
          <Image src={image} alt={title} fill sizes="(max-width: 768px) 44vw, 240px" className="object-cover pointer-events-none" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/50 pointer-events-none">{title}</div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-90 pointer-events-none" />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* ── TOP badges (genre + season) ── */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10 pointer-events-none">
          {primaryGenre && (
            <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide', getGenreColor(primaryGenre))}>
              {primaryGenre}
            </span>
          )}
          {isSeason && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide bg-amber-500 text-black">
              Season
            </span>
          )}
        </div>

        {/* ── HEART – bottom-left corner ── */}
        <button
          onClick={handleLike}
          aria-label={liked ? 'Remove from My List' : 'Add to My List'}
          className={cn(
            'absolute bottom-16 left-3 z-20 p-2 rounded-full transition-all duration-200',
            'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100',
            liked ? 'bg-[#E50914]/80 text-white' : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/80'
          )}
        >
          <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
        </button>

        {/* ── BOOKMARK – Watch Later ── */}
        <button
          onClick={handleWatchLater}
          aria-label={saved ? 'Saved to Watch Later' : 'Save to Watch Later'}
          className={cn(
            'absolute bottom-16 left-12 z-20 p-2 rounded-full transition-all duration-200',
            'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100',
            saved ? 'bg-white/20 text-white' : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/80'
          )}
        >
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
        </button>

        {/* ── CENTER: Play + Download ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <Link
            href={watchTarget}
            onClick={e => e.stopPropagation()}
            aria-label={`Play ${title}`}
            className="w-14 h-14 rounded-full bg-white hover:bg-white/90 flex items-center justify-center shadow-2xl shadow-black/60 transition-transform hover:scale-110 active:scale-95"
          >
            <Play className="h-6 w-6 fill-black text-black ml-1" />
          </Link>
          <button
            onClick={handleDownload}
            aria-label={`Download ${title}`}
            className="flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors border border-white/10"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>

        {/* ── LATEST EPISODE BADGE (always visible, bottom-left) ── */}
        {isSeason && latestEpisodeNumber !== undefined && latestEpisodeNumber > 0 && (
          <div className="absolute bottom-[4.75rem] left-1/2 z-10 -translate-x-1/2 pointer-events-none">
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#E50914] px-3 py-1.5 text-[11px] font-black text-white shadow-lg shadow-black/50">
              <Film className="h-3 w-3 flex-shrink-0" />
              Ep {latestEpisodeNumber}
            </span>
          </div>
        )}

        {type === 'movie' && partCount !== undefined && partCount > 1 && (
          <div className="absolute bottom-[4.75rem] left-1/2 z-10 -translate-x-1/2 pointer-events-none">
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#E50914] px-3 py-1.5 text-[11px] font-black text-white shadow-lg shadow-black/50">
              <Film className="h-3 w-3 flex-shrink-0" />
              {partCount} Parts
            </span>
          </div>
        )}

        {/* ── BOTTOM INFO ── */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
            {type === 'live' ? <Badge variant="live">LIVE</Badge> : <Badge variant="hd">HD</Badge>}
            {releaseYear && (
              <span className="text-white/80">{releaseYear}</span>
            )}
            {rating ? (
              <span className="inline-flex items-center gap-1 text-yellow-300">
                <Star className="h-3 w-3 fill-current" /> {rating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-sm font-bold text-white">{title}</h3>

          {translator ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium leading-tight text-white/75">
              <Languages className="h-3 w-3 flex-shrink-0 text-primary-300" />
              <span className="truncate">{translator}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
