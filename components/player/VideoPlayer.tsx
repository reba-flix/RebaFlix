'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Hls from 'hls.js'
import {
  Captions,
  ChevronDown,
  ChevronRight,
  Layers,
  Maximize,
  Minimize,
  MonitorUp,
  Pause,
  PictureInPicture,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SubtitleTrack = { src: string; label: string; srcLang: string; default?: boolean }

type Episode = {
  id: string
  number: number
  title: string
  thumbnailUrl?: string | null
  runtimeMinutes?: number | null
}

type Season = {
  id: string
  number: number
  title?: string | null
  episodes: Episode[]
}

type NextItem = {
  id: string
  title: string
}

type VideoPlayerProps = {
  src: string
  poster?: string | null
  title: string
  subtitles?: SubtitleTrack[]
  onProgress?: (positionSeconds: number, durationSeconds: number) => void
  contentId?: string
  contentType?: 'movie' | 'series' | 'episode'
  /** For series episodes: full season/episode data for the side panel */
  seasons?: Season[]
  /** Current episode id (for highlighting in panel) */
  currentEpisodeId?: string
  /** Next episode or movie to auto-play */
  nextItem?: NextItem
}

export function VideoPlayer({
  src,
  poster,
  title,
  subtitles = [],
  onProgress,
  contentId,
  contentType = 'movie',
  seasons,
  currentEpisodeId,
  nextItem,
}: VideoPlayerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [activeSeason, setActiveSeason] = useState<string>(seasons?.[0]?.id ?? '')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCounted = useRef(false)
  const playlistLabel = contentType === 'movie' ? 'Parts' : 'Episodes'

  const [showControls, setShowControls] = useState(true)
  const [isMouseOverControls, setIsMouseOverControls] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Progress persistence (dual: localStorage + API) ────────────────────
  const localKey = contentId ? `reba_progress_${contentId}` : null
  const apiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastLocalSaveRef = useRef<number>(0)
  const lastApiSaveRef = useRef<number>(-1)
  const resumedRef = useRef(false)

  /** Save position to localStorage immediately (throttled to once per second) */
  const saveToLocal = useCallback(
    (positionSeconds: number, durationSeconds: number, completed = false) => {
      if (!localKey || durationSeconds < 5) return
      const now = Date.now()
      if (!completed && now - lastLocalSaveRef.current < 1000) return
      lastLocalSaveRef.current = now
      try {
        const payload = {
          contentId,
          contentType,
          positionSeconds: Math.floor(positionSeconds),
          durationSeconds: Math.floor(durationSeconds),
          completed,
          savedAt: now,
        }
        localStorage.setItem(localKey, JSON.stringify(payload))
      } catch { /* storage full — ignore */ }
    },
    [localKey, contentId, contentType]
  )

  /** Save position to /api/history (called every 10 seconds + on pause/end) */
  const saveToApi = useCallback(
    (positionSeconds: number, durationSeconds: number, completed = false) => {
      if (!contentId || durationSeconds < 5) return
      if (!completed && Math.abs(positionSeconds - lastApiSaveRef.current) < 3) return
      lastApiSaveRef.current = positionSeconds
      const body = contentType === 'episode'
        ? { episodeId: contentId, positionSeconds: Math.floor(positionSeconds), durationSeconds: Math.floor(durationSeconds), completed }
        : { movieId: contentId, positionSeconds: Math.floor(positionSeconds), durationSeconds: Math.floor(durationSeconds), completed }
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => { /* will retry on next interval */ })
    },
    [contentId, contentType]
  )

  /** Resume: check localStorage first (instant, no auth), then API (cross-device) */
  const resumeFromSaved = useCallback(async () => {
    if (!contentId || resumedRef.current) return
    resumedRef.current = true
    const video = videoRef.current
    if (!video) return

    // 1. Try localStorage first (fastest, works offline)
    if (localKey) {
      try {
        const raw = localStorage.getItem(localKey)
        if (raw) {
          const saved = JSON.parse(raw)
          if (saved.positionSeconds > 5 && !saved.completed) {
            if (video.currentTime < saved.positionSeconds) {
              video.currentTime = saved.positionSeconds
            }
            // Still try API in background for cross-device sync
            fetch('/api/history')
              .then(r => r.ok ? r.json() : null)
              .then((data: any[] | null) => {
                if (!data) return
                const entry = data.find((h: any) =>
                  contentType === 'episode' ? h.episodeId === contentId : h.movieId === contentId
                )
                // Use API position only if it's further ahead than local
                if (entry && !entry.completed && entry.positionSeconds > (video.currentTime + 10)) {
                  video.currentTime = entry.positionSeconds
                }
              })
              .catch(() => {})
            return
          }
        }
      } catch { /* ignore localStorage errors */ }
    }

    // 2. Fallback: API only
    try {
      const res = await fetch('/api/history')
      if (!res.ok) return
      const data: any[] = await res.json()
      const entry = data.find((h: any) =>
        contentType === 'episode' ? h.episodeId === contentId : h.movieId === contentId
      )
      if (entry && entry.positionSeconds > 5 && !entry.completed) {
        if (video.currentTime < entry.positionSeconds) {
          video.currentTime = entry.positionSeconds
        }
      }
    } catch { /* silently ignore */ }
  }, [contentId, contentType, localKey])

  // Reset resume flag + local key tracking when src/contentId changes
  useEffect(() => { resumedRef.current = false }, [src, contentId])

  // Auto-save to API every 10 seconds while playing
  useEffect(() => {
    if (apiIntervalRef.current) clearInterval(apiIntervalRef.current)
    apiIntervalRef.current = setInterval(() => {
      const video = videoRef.current
      if (video && !video.paused && video.duration > 0) {
        saveToApi(video.currentTime, video.duration)
      }
    }, 10000)
    return () => {
      if (apiIntervalRef.current) clearInterval(apiIntervalRef.current)
    }
  }, [saveToApi])

  const resetHideTimeout = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current)
    
    if (!isMouseOverControls && !isInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 1000)
    }
  }, [isMouseOverControls, isInteracting])

  useEffect(() => {
    resetHideTimeout()
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current)
    }
  }, [resetHideTimeout])

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsInteracting(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const recordPlay = useCallback(() => {
    if (!contentId || hasCounted.current) return
    hasCounted.current = true
    const endpoint =
      contentType === 'episode'
        ? `/api/episodes/${contentId}/play`
        : contentType === 'series'
        ? `/api/series/${contentId}/play`
        : `/api/movies/${contentId}/play`
    fetch(endpoint, { method: 'POST' }).catch(console.warn)
  }, [contentId, contentType])

  // HLS / direct video source
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    setError(null)
    hasCounted.current = false

    const isHls = src.includes('.m3u8')
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError('Failed to stream HLS video. The source might be offline or broken.')
      })
      return () => hls.destroy()
    }
    video.src = src
  }, [src])

  useEffect(() => {
    setActiveSeason(seasons?.[0]?.id ?? '')
  }, [seasons])

  // Sync volume/mute to video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume
    video.muted = muted
  }, [volume, muted])

  // Keyboard shortcuts
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleKeydown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (event.key === ' ') { event.preventDefault(); void togglePlay() }
      if (event.key === 'ArrowRight') video.currentTime += 10
      if (event.key === 'ArrowLeft') video.currentTime -= 10
      if (event.key === 'ArrowUp') { event.preventDefault(); setVolume(v => Math.min(1, v + 0.1)) }
      if (event.key === 'ArrowDown') { event.preventDefault(); setVolume(v => Math.max(0, v - 0.1)) }
      if (event.key.toLowerCase() === 'm') setMuted(v => !v)
      if (event.key.toLowerCase() === 'f') void video.requestFullscreen()
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  // Fullscreen change listener (standard + webkit for iOS)
  useEffect(() => {
    const handler = () => setIsFullscreen(
      !!document.fullscreenElement || !!(document as any).webkitFullscreenElement
    )
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  // Close volume slider on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(e.target as Node)) {
        setShowVolumeSlider(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      try {
        setError(null)
        await video.play()
        setPlaying(true)
      } catch (err) {
        setError('Failed to start playback. The link might be broken or the format is unsupported.')
      }
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  const changeSpeed = () => {
    const video = videoRef.current
    if (!video) return
    const speeds = [0.75, 1, 1.25, 1.5, 2]
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length]
    video.playbackRate = next
    setSpeed(next)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (val === 0) setMuted(true)
    else setMuted(false)
  }

  const toggleMute = () => setMuted(v => !v)

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setProgress(video.currentTime)
    setDuration(video.duration || 0)
    onProgress?.(Math.floor(video.currentTime), Math.floor(video.duration || 0))
    if (video.duration > 0) {
      saveToLocal(video.currentTime, video.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = parseFloat(e.target.value)
    setProgress(parseFloat(e.target.value))
  }

  const handleEnded = () => {
    setPlaying(false)
    if (!nextItem) return
    // Start 3-second countdown
    setCountdown(3)
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimer.current!)
          router.push(`/watch/${nextItem.id}`)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelCountdown = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    setCountdown(null)
  }

  const goToNext = () => {
    cancelCountdown()
    if (nextItem) router.push(`/watch/${nextItem.id}`)
  }

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const volumeIcon = muted || volume === 0 ? VolumeX : Volume2
  const VolumeIcon = volumeIcon

  const toggleFullscreen = () => {
    const video = videoRef.current
    const container = containerRef.current
    const isFs = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement
    if (!isFs) {
      if (container?.requestFullscreen) {
        container.requestFullscreen()
      } else if ((container as any)?.webkitRequestFullscreen) {
        ;(container as any).webkitRequestFullscreen()
      } else if ((video as any)?.webkitEnterFullscreen) {
        // iOS Safari fallback — enter native video fullscreen
        ;(video as any).webkitEnterFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        ;(document as any).webkitExitFullscreen()
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("group relative aspect-video w-full overflow-hidden rounded-md bg-black", !showControls && "cursor-none")}
      onMouseMove={resetHideTimeout}
      onMouseLeave={() => {
        if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current)
        hideControlsTimeoutRef.current = setTimeout(() => setShowControls(false), 1000)
      }}
    >
      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center z-30 pointer-events-auto">
          <p className="text-[#E50914] font-bold text-lg mb-2">Playback Error</p>
          <p className="text-white/70 text-sm max-w-md mb-4">{error}</p>
          <Button onClick={() => { setError(null); void togglePlay() }} className="bg-[#E50914] hover:bg-[#b80710] text-white">
            Try Again
          </Button>
        </div>
      )}

      {/* Auto-play Countdown Overlay */}
      {countdown !== null && nextItem && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 pointer-events-auto">
          <p className="text-white/70 text-sm font-medium mb-2">Up Next</p>
          <h3 className="text-white text-2xl font-bold mb-6">{nextItem.title}</h3>
          <div className="relative w-20 h-20 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#E50914" strokeWidth="2"
                strokeDasharray={`${(3 - countdown) / 3 * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-3xl font-black">{countdown}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={goToNext}
              className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-md hover:bg-white/90 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" /> Play Now
            </button>
            <button
              onClick={cancelCountdown}
              className="flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Episode / Parts List Panel */}
      {showEpisodes && seasons && seasons.length > 0 && (
        <div className="absolute inset-y-2 right-2 z-30 flex max-h-[calc(100%-1rem)] w-[min(22rem,calc(100%-1rem))] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#141414]/70 shadow-2xl shadow-black/60 backdrop-blur-sm pointer-events-auto sm:inset-y-4 sm:right-4 sm:max-h-[calc(100%-2rem)]">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/20 px-3 py-2.5">
            <h3 className="text-white font-bold text-sm">{playlistLabel}</h3>
            <button onClick={() => setShowEpisodes(false)} className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white" aria-label={`Close ${playlistLabel.toLowerCase()} list`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Season Tabs */}
          {seasons.length > 1 && (
            <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 scrollbar-hide">
              {seasons.map(season => (
                <button
                  key={season.id}
                  onClick={() => setActiveSeason(season.id)}
                  className={cn(
                    'shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    activeSeason === season.id
                      ? 'bg-[#E50914] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  )}
                >
                  S{season.number}
                </button>
              ))}
            </div>
          )}

          {/* Episode List */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-white/20">
            {(seasons.find(s => s.id === activeSeason) ?? seasons[0])?.episodes.map(ep => (
              <button
                key={ep.id}
                onClick={() => { setShowEpisodes(false); router.push(`/watch/${ep.id}`) }}
                className={cn(
                  'w-full text-left px-3 py-2.5 border-b border-white/[0.06] transition-colors flex items-center gap-3',
                  ep.id === currentEpisodeId
                    ? 'bg-[#E50914]/25 border-l-2 border-l-[#E50914]'
                    : 'hover:bg-white/10'
                )}
              >
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base font-black leading-none',
                  ep.id === currentEpisodeId ? 'text-[#E50914]' : 'text-white/30'
                )}>
                  {ep.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'line-clamp-2 text-xs font-semibold leading-snug sm:text-sm',
                    ep.id === currentEpisodeId ? 'text-[#E50914]' : 'text-white'
                  )}>
                    {ep.title || `Episode ${ep.number}`}
                  </p>
                  {ep.runtimeMinutes && (
                    <p className="text-xs text-white/40 mt-0.5">{ep.runtimeMinutes}m</p>
                  )}
                </div>
                {ep.id === currentEpisodeId && (
                  <Play className="w-3.5 h-3.5 fill-[#E50914] text-[#E50914] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        className="h-full w-full bg-black object-contain"
        playsInline
        controls={false}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={e => {
          setDuration(e.currentTarget.duration)
          resumeFromSaved()
        }}
        onPlay={() => { setPlaying(true); recordPlay() }}
        onPause={() => {
          setPlaying(false)
          const video = videoRef.current
          if (video && video.duration > 0) {
            saveToLocal(video.currentTime, video.duration)
            saveToApi(video.currentTime, video.duration)
          }
        }}
        onEnded={() => {
          const video = videoRef.current
          if (video && video.duration > 0) {
            saveToLocal(video.duration, video.duration, true)
            saveToApi(video.duration, video.duration, true)
          }
          handleEnded()
        }}
        onError={() => setError('Failed to load video. The format may be unsupported or the link is broken.')}
        onClick={togglePlay}
      >
        {subtitles.map(subtitle => (
          <track
            key={`${subtitle.srcLang}-${subtitle.label}`}
            kind="subtitles"
            src={subtitle.src}
            srcLang={subtitle.srcLang}
            label={subtitle.label}
            default={subtitle.default}
          />
        ))}
      </video>

      {/* Gradient overlays */}
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0")} />

      {/* Controls */}
      <div 
        className={cn("absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-2 sm:gap-2 sm:p-3 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0", showControls ? "pointer-events-auto" : "pointer-events-none")}
        onMouseEnter={() => setIsMouseOverControls(true)}
        onMouseLeave={() => setIsMouseOverControls(false)}
        onMouseDown={() => setIsInteracting(true)}
      >
        
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-white/70 tabular-nums w-8 sm:w-10 shrink-0">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 accent-[#E50914] cursor-pointer"
            style={{ background: `linear-gradient(to right, #E50914 ${duration ? (progress / duration) * 100 : 0}%, rgba(255,255,255,0.3) 0%)` }}
          />
          <span className="text-[10px] sm:text-xs text-white/70 tabular-nums w-8 sm:w-10 shrink-0 text-right">{formatTime(duration)}</span>
        </div>

        {/* Buttons row — two rows on mobile, single row on desktop */}
        <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-1">
          {/* LEFT GROUP: Play, Replay, Next, Volume, Title */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Play/Pause */}
            <Button size="icon" variant="glass" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}
              className="h-7 w-7 sm:h-9 sm:w-9">
              {playing ? <Pause className="h-3.5 w-3.5 sm:h-5 sm:w-5 fill-current" /> : <Play className="h-3.5 w-3.5 sm:h-5 sm:w-5 fill-current" />}
            </Button>

            {/* Replay */}
            <Button size="icon" variant="glass" aria-label="Replay"
              className="h-7 w-7 sm:h-9 sm:w-9"
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0 }}>
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            {/* Next Episode */}
            {nextItem && (
              <Button size="icon" variant="glass" aria-label={`Next: ${nextItem.title}`} onClick={goToNext}
                className="h-7 w-7 sm:h-9 sm:w-9">
                <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}

            {/* Volume */}
            <div className="relative flex items-center" ref={volumeSliderRef}>
              <Button size="icon" variant="glass" aria-label={muted ? 'Unmute' : 'Mute'}
                className="h-7 w-7 sm:h-9 sm:w-9"
                onClick={toggleMute} onMouseEnter={() => setShowVolumeSlider(true)}>
                <VolumeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              {showVolumeSlider && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a]/95 backdrop-blur-sm rounded-md px-3 py-3 flex flex-col items-center gap-2 shadow-xl border border-white/10 z-50"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="h-20 cursor-pointer accent-[#E50914]"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                  <span className="text-xs text-white/60 tabular-nums">{Math.round((muted ? 0 : volume) * 100)}%</span>
                </div>
              )}
            </div>

            {/* Title — desktop only */}
            <span className="hidden md:inline text-sm font-semibold text-white ml-1 truncate max-w-xs">{title}</span>
            {nextItem && (
              <span className="hidden md:inline text-xs text-white/40 truncate max-w-[160px]">
                Next: {nextItem.title}
              </span>
            )}
          </div>

          {/* RIGHT GROUP: Speed, Subtitles, Episodes, PiP, Cast, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Speed */}
            <Button size="icon" variant="glass" onClick={changeSpeed} aria-label="Playback speed"
              className="h-7 w-7 sm:h-9 sm:w-9">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <span className="text-[10px] sm:text-xs font-semibold text-white min-w-[18px] sm:min-w-[28px]">{speed}x</span>

            {/* Subtitles */}
            <Button size="icon" variant="glass" aria-label="Subtitles"
              className="h-7 w-7 sm:h-9 sm:w-9">
              <Captions className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            {/* Episode / Parts List */}
            {seasons && seasons.length > 0 && (
              <Button
                size="icon"
                variant="glass"
                aria-label={`${playlistLabel} list`}
                onClick={() => setShowEpisodes(v => !v)}
                className={`h-7 w-7 sm:h-9 sm:w-9 ${showEpisodes ? 'text-[#E50914]' : ''}`}
              >
                <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}

            {/* PiP — hidden on very small screens */}
            <Button size="icon" variant="glass" aria-label="Picture in picture"
              className="hidden xs:flex h-7 w-7 sm:h-9 sm:w-9"
              onClick={() => videoRef.current?.requestPictureInPicture?.()}>
              <PictureInPicture className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            {/* Cast — hidden on small screens */}
            <Button size="icon" variant="glass" aria-label="Cast"
              className="hidden sm:flex h-7 w-7 sm:h-9 sm:w-9">
              <MonitorUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            {/* Fullscreen */}
            <Button size="icon" variant="glass"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="h-7 w-7 sm:h-9 sm:w-9"
              onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-3 w-3 sm:h-4 sm:w-4" /> : <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
