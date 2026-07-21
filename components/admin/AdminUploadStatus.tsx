'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useMovieUploadStore } from '@/components/admin/movie-upload-store'

export function AdminUploadStatus() {
  const { movies, loading, progress, error, success } = useMovieUploadStore()

  useEffect(() => {
    if (!loading) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [loading])

  const { activeCount, completedCount, failedCount, averageProgress } = useMemo(() => {
    const items = Object.values(progress)
    const active = items.filter((item) => item.state === 'uploading' || item.state === 'saving').length
    const completed = items.filter((item) => item.state === 'done').length
    const failed = items.filter((item) => item.state === 'error').length
    const uploadPercentages = items.flatMap((item) => [item.posters, item.backdrops, item.videos].filter((value): value is number => typeof value === 'number'))
    const average = uploadPercentages.length
      ? Math.round(uploadPercentages.reduce((total, value) => total + value, 0) / uploadPercentages.length)
      : completed > 0
        ? 100
        : 0

    return {
      activeCount: active,
      completedCount: completed,
      failedCount: failed,
      averageProgress: average,
    }
  }, [progress])

  if (!loading && !error && !success && completedCount === 0 && failedCount === 0) return null

  const icon = loading
    ? <Loader2 className="h-4 w-4 animate-spin" />
    : failedCount > 0
      ? <AlertCircle className="h-4 w-4" />
      : <CheckCircle2 className="h-4 w-4" />

  const label = loading
    ? `${activeCount || movies.length} uploading`
    : failedCount > 0
      ? `${failedCount} failed`
      : `${completedCount} completed`

  return (
    <Link
      href="/admin/movies/new"
      className="fixed bottom-5 left-5 z-50 w-[min(calc(100vw-2.5rem),320px)] rounded-md border border-white/10 bg-black/90 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur transition-colors hover:border-[#E50914]/60 md:left-auto md:right-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E50914]/15 text-[#ff3942]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span className="truncate">Movie uploads</span>
            <span className="shrink-0 text-white/60">{label}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#E50914] transition-all" style={{ width: `${averageProgress}%` }} />
          </div>
        </div>
      </div>
    </Link>
  )
}
