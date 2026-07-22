'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Trash2, Clock, Film, Tv, ChevronRight, History } from 'lucide-react'

type WatchItem = {
  historyId: string
  watchId: string
  type: 'movie' | 'episode'
  title: string
  subtitle: string | null
  slug: string
  poster: string | null
  backdrop: string | null
  positionSeconds: number
  durationSeconds: number
  runtimeMinutes: number | null
  percentWatched: number
  genres: string[]
  updatedAt: string
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m left`
  if (m > 0) return `${m}m ${s}s left`
  return `${s}s left`
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

function WatchCard({ item, onRemove }: { item: WatchItem; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false)
  const [hovered, setHovered] = useState(false)

  const remaining = item.durationSeconds - item.positionSeconds

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setRemoving(true)
    try {
      await fetch('/api/continue-watching', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId: item.historyId }),
      })
      onRemove(item.historyId)
    } catch {
      setRemoving(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/watch/${item.watchId}`} className="block">
        {/* Card */}
        <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 shadow-xl hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1">
          {/* Poster / Backdrop Image */}
          <div className="relative aspect-[16/9] overflow-hidden bg-black/40">
            {item.backdrop || item.poster ? (
              <img
                src={(item.backdrop ?? item.poster)!}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {item.type === 'movie'
                  ? <Film className="w-12 h-12 text-white/20" />
                  : <Tv className="w-12 h-12 text-white/20" />
                }
              </div>
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Type badge */}
            <div className="absolute top-3 left-3">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border ${
                item.type === 'movie'
                  ? 'bg-[#E50914]/20 border-[#E50914]/40 text-[#ff4c54]'
                  : 'bg-blue-500/20 border-blue-400/40 text-blue-400'
              }`}>
                {item.type === 'movie' ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                {item.type === 'movie' ? 'Movie' : 'Series'}
              </span>
            </div>

            {/* Time ago */}
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white/60 bg-black/50 backdrop-blur-sm border border-white/10">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo(item.updatedAt)}
              </span>
            </div>

            {/* Play button on hover */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
                    <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Percent badge bottom-right on backdrop */}
            <div className="absolute bottom-3 right-3">
              <span className="text-xs font-bold text-white/80 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                {item.percentWatched}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-0.5 bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.percentWatched}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-gradient-to-r from-[#E50914] to-[#ff6b35] shadow-sm shadow-[#E50914]/50"
            />
          </div>

          {/* Card Content */}
          <div className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm leading-tight line-clamp-1 group-hover:text-white/90 transition-colors">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{item.subtitle}</p>
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={handleRemove}
                disabled={removing}
                title="Remove from Continue Watching"
                className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-[#E50914] hover:bg-[#E50914]/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Genres */}
            {item.genres.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {item.genres.slice(0, 2).map((g) => (
                  <span key={g} className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Time remaining */}
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[11px] text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {remaining > 0 ? formatTime(remaining) : 'Almost done'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#E50914] font-semibold group-hover:gap-2 transition-all">
                Resume <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function ContinueWatchingGrid({ items: initialItems }: { items: WatchItem[] }) {
  const [items, setItems] = useState<WatchItem[]>(initialItems)
  const router = useRouter()

  // Force Next.js to refresh the data when the page is visited
  // This bypasses the client-side router cache which might hide newly watched items
  useEffect(() => {
    router.refresh()
  }, [router])

  const handleRemove = useCallback((historyId: string) => {
    setItems((prev) => prev.filter((i) => i.historyId !== historyId))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative pt-28 pb-10 px-4 md:px-8 lg:px-12 overflow-hidden">
        {/* Ambient background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#E50914]/8 rounded-full blur-[100px]" />
          <div className="absolute -top-20 right-1/4 w-72 h-72 bg-purple-600/6 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#9f0710] shadow-lg shadow-[#E50914]/30">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Continue Watching
              </h1>
              <p className="text-white/40 text-sm mt-0.5">
                {items.length > 0
                  ? `${items.length} title${items.length !== 1 ? 's' : ''} in progress — pick up where you left off`
                  : 'Your in-progress titles will appear here'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 h-px bg-gradient-to-r from-[#E50914]/40 via-white/10 to-transparent" />
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        {items.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <History className="w-10 h-10 text-white/20" />
              </div>
              <div className="absolute inset-0 rounded-full bg-[#E50914]/5 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white/70 mb-2">Nothing in progress yet</h2>
            <p className="text-white/40 text-sm max-w-xs leading-relaxed mb-8">
              Start watching a movie or series and it will automatically appear here so you can pick up right where you left off.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#E50914]/30 hover:shadow-[#E50914]/50 hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              Browse Content
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 pb-16"
            >
              {items.map((item, i) => (
                <motion.div
                  key={item.historyId}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <WatchCard item={item} onRemove={handleRemove} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
