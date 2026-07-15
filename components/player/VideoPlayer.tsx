'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import {
  Captions,
  Maximize,
  Minimize,
  MonitorUp,
  Pause,
  PictureInPicture,
  Play,
  RotateCcw,
  Settings,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type VideoPlayerProps = {
  src: string
  poster?: string | null
  title: string
  subtitles?: Array<{ src: string; label: string; srcLang: string; default?: boolean }>
  onProgress?: (positionSeconds: number, durationSeconds: number) => void
  /** ID of the content being watched */
  contentId?: string
  /** Type of content: 'movie' | 'series' | 'episode' — determines which play API is called */
  contentType?: 'movie' | 'series' | 'episode'
}

export function VideoPlayer({ src, poster, title, subtitles = [], onProgress, contentId, contentType = 'movie' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setError(null) // Reset error on source change

    const isHls = src.includes('.m3u8')
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          console.warn("HLS fatal error:", data)
          setError("Failed to stream HLS video. The source might be offline or broken.")
        }
      })
      return () => hls.destroy()
    }

    video.src = src
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault()
        void togglePlay()
      }
      if (event.key === 'ArrowRight') video.currentTime += 10
      if (event.key === 'ArrowLeft') video.currentTime -= 10
      if (event.key.toLowerCase() === 'f') void video.requestFullscreen()
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
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
        console.warn("Playback failed:", err)
        setError("Failed to start playback. The link might be broken or the format is unsupported by your browser.")
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

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-md bg-black">
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center z-30 pointer-events-auto">
          <p className="text-[#E50914] font-bold text-lg mb-2">Playback Error</p>
          <p className="text-white/70 text-sm max-w-md mb-4">{error}</p>
          <Button onClick={() => { setError(null); void togglePlay(); }} className="bg-[#E50914] hover:bg-[#b80710] text-white">
            Try Again
          </Button>
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        className="h-full w-full bg-black object-contain"
        playsInline
        controls={false}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          onProgress?.(Math.floor(video.currentTime), Math.floor(video.duration || 0))
        }}
        onPlay={() => { setPlaying(true); recordPlay() }}
        onPause={() => setPlaying(false)}
        onError={(e) => {
          console.warn("Video element error event:", e)
          setError("Failed to load video. The format may be unsupported by your browser or the link is broken.")
        }}
      >
        {subtitles.map((subtitle) => (
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 opacity-0 transition group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 opacity-0 transition group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="glass" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          </Button>
          <Button size="icon" variant="glass" aria-label="Replay" onClick={() => (videoRef.current!.currentTime = 0)}>
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="glass" aria-label="Volume">
            <Volume2 className="h-5 w-5" />
          </Button>
          <span className="hidden text-sm font-semibold text-white md:inline">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="glass" onClick={changeSpeed} aria-label="Playback speed">
            <Settings className="h-5 w-5" />
          </Button>
          <span className="min-w-9 text-sm font-semibold text-white">{speed}x</span>
          <Button size="icon" variant="glass" aria-label="Subtitles">
            <Captions className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="glass"
            aria-label="Picture in picture"
            onClick={() => videoRef.current?.requestPictureInPicture?.()}
          >
            <PictureInPicture className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="glass" aria-label="Cast">
            <MonitorUp className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="glass"
            aria-label="Fullscreen"
            onClick={() => videoRef.current?.requestFullscreen()}
          >
            <Maximize className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="glass" aria-label="Mini player">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
