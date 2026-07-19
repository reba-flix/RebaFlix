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

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
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
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-md bg-black"
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

      {/* Episode List Panel */}
      {showEpisodes && seasons && seasons.length > 0 && (
        <div className="absolute inset-y-0 right-0 z-30 w-72 bg-[#141414]/97 backdrop-blur-sm flex flex-col pointer-events-auto border-l border-white/10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-bold text-sm">Episodes</h3>
            <button onClick={() => setShowEpisodes(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Season Tabs */}
          {seasons.length > 1 && (
            <div className="flex gap-1 px-3 py-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
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
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
            {(seasons.find(s => s.id === activeSeason) ?? seasons[0])?.episodes.map(ep => (
              <button
                key={ep.id}
                onClick={() => { setShowEpisodes(false); router.push(`/watch/${ep.id}`) }}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-white/[0.06] transition-colors flex items-start gap-3',
                  ep.id === currentEpisodeId
                    ? 'bg-[#E50914]/15 border-l-2 border-l-[#E50914]'
                    : 'hover:bg-white/5'
                )}
              >
                <span className={cn(
                  'text-2xl font-black shrink-0 leading-tight mt-0.5',
                  ep.id === currentEpisodeId ? 'text-[#E50914]' : 'text-white/30'
                )}>
                  {ep.number}
                </span>
                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-semibold leading-snug truncate',
                    ep.id === currentEpisodeId ? 'text-[#E50914]' : 'text-white'
                  )}>
                    {ep.title || `Episode ${ep.number}`}
                  </p>
                  {ep.runtimeMinutes && (
                    <p className="text-xs text-white/40 mt-0.5">{ep.runtimeMinutes}m</p>
                  )}
                </div>
                {ep.id === currentEpisodeId && (
                  <Play className="w-3.5 h-3.5 fill-[#E50914] text-[#E50914] shrink-0 mt-1" />
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
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onPlay={() => { setPlaying(true); recordPlay() }}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 opacity-0 transition group-hover:opacity-100" />

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 opacity-0 transition group-hover:opacity-100">
        
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70 tabular-nums w-10 shrink-0">{formatTime(progress)}</span>
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
          <span className="text-xs text-white/70 tabular-nums w-10 shrink-0 text-right">{formatTime(duration)}</span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Play/Pause */}
            <Button size="icon" variant="glass" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>

            {/* Replay */}
            <Button size="icon" variant="glass" aria-label="Replay" onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0 }}>
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Next Episode */}
            {nextItem && (
              <Button size="icon" variant="glass" aria-label={`Next: ${nextItem.title}`} onClick={goToNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
            )}

            {/* Volume */}
            <div className="relative flex items-center" ref={volumeSliderRef}>
              <Button size="icon" variant="glass" aria-label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute} onMouseEnter={() => setShowVolumeSlider(true)}>
                <VolumeIcon className="h-4 w-4" />
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

            {/* Title */}
            <span className="hidden text-sm font-semibold text-white md:inline ml-1 truncate max-w-xs">{title}</span>
            {nextItem && (
              <span className="hidden text-xs text-white/40 md:inline truncate max-w-[160px]">
                Next: {nextItem.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Speed */}
            <Button size="icon" variant="glass" onClick={changeSpeed} aria-label="Playback speed">
              <Settings className="h-4 w-4" />
            </Button>
            <span className="min-w-8 text-xs font-semibold text-white">{speed}x</span>

            {/* Subtitles */}
            <Button size="icon" variant="glass" aria-label="Subtitles">
              <Captions className="h-4 w-4" />
            </Button>

            {/* Episode List (series only) */}
            {seasons && seasons.length > 0 && (
              <Button
                size="icon"
                variant="glass"
                aria-label="Episode list"
                onClick={() => setShowEpisodes(v => !v)}
                className={showEpisodes ? 'text-[#E50914]' : ''}
              >
                <Layers className="h-4 w-4" />
              </Button>
            )}

            {/* PiP */}
            <Button size="icon" variant="glass" aria-label="Picture in picture" onClick={() => videoRef.current?.requestPictureInPicture?.()}>
              <PictureInPicture className="h-4 w-4" />
            </Button>

            {/* Cast */}
            <Button size="icon" variant="glass" aria-label="Cast">
              <MonitorUp className="h-4 w-4" />
            </Button>

            {/* Fullscreen */}
            <Button size="icon" variant="glass" aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
