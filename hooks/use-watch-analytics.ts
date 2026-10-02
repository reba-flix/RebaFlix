'use client'
import { RefObject, useEffect } from 'react'
import { analyticsAllowed } from '@/lib/analytics/client'
import { HEARTBEAT_MS, mergeRanges, playbackDelta, Range } from '@/lib/analytics/metrics'

export function useWatchAnalytics(ref: RefObject<HTMLVideoElement | null>, contentId: string | undefined, type: 'movie' | 'episode' | 'part', src: string) {
  useEffect(() => {
    const video = ref.current
    if (!video || !contentId) return
    let id = crypto.randomUUID()
    let sequence = 0
    let ready = false
    let starting = false
    let disposed = false
    let seconds = 0
    let ranges: Range[] = []
    let previous = video.currentTime
    let sampledAt = performance.now()
    let progressing = false
    let sending = false
    let finished = false
    let pending: { id: string; contentId: string; type: typeof type; sequence: number; seconds: number; duration: number; ranges: Range[]; finished: boolean } | null = null
    const resetSample = () => { previous = video.currentTime; sampledAt = performance.now() }
    const start = async () => {
      if (ready || starting || !Number.isFinite(video.duration) || video.duration <= 0) return
      starting = true
      const startingId = id
      try {
        if (!analyticsAllowed() || disposed || id !== startingId) return
        const response = await fetch('/api/analytics/watch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, contentId, type, sequence: 0, seconds: 0, duration: video.duration, ranges: [] }) })
        if (id === startingId && !disposed && analyticsAllowed()) {
          ready = response.ok && response.status !== 204
          resetSample()
        }
      } catch { /* retry on the next heartbeat */ }
      finally { if (id === startingId) starting = false }
    }
    const sample = () => {
      const now = performance.now()
      if (ready && analyticsAllowed()) {
        const delta = playbackDelta(previous, video.currentTime, (now - sampledAt) / 1000, video.playbackRate, progressing && !video.seeking && video.readyState >= 2)
        if (delta > 0) { seconds += delta; ranges = mergeRanges([...ranges, [previous, video.currentTime]], video.duration) }
      }
      previous = video.currentTime; sampledAt = now
    }
    const flush = (leaving = false, finishedPlayback = false) => {
      sample()
      if (!ready || !analyticsAllowed() || sending && !leaving) return
      if (!pending && (seconds > 0 || finishedPlayback)) {
        pending = { id, contentId, type, sequence: ++sequence, seconds: Math.min(45, seconds), duration: video.duration, ranges: ranges.slice(0, 100), finished: finishedPlayback }
        seconds = 0; ranges = []
      }
      if (!pending) return
      const batch = pending
      const payload = JSON.stringify(batch)
      if (leaving) { navigator.sendBeacon('/api/analytics/watch', new Blob([payload], { type: 'application/json' })); return }
      sending = true
      fetch('/api/analytics/watch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
        .then(response => {
          if (response.ok && pending === batch) pending = null
          if (id === batch.id && (response.status === 204 || response.status === 409)) { ready = false; id = crypto.randomUUID(); sequence = 0; pending = null }
        }).catch(() => {}).finally(() => { sending = false })
    }
    const playing = () => { progressing = true; resetSample(); void start() }
    const pause = () => { flush(); progressing = false; resetSample() }
    const seeking = () => { progressing = false; resetSample() }
    const seeked = () => { progressing = !video.paused; resetSample() }
    const ended = () => { flush(false, true); progressing = false; finished = true }
    const play = () => {
      if (finished) { flush(true); id = crypto.randomUUID(); sequence = 0; ready = false; seconds = 0; ranges = []; pending = null; finished = false }
      void start()
    }
    const leaving = () => flush(true)
    const visibility = () => { if (document.visibilityState === 'hidden') flush(true) }
    const consent = () => {
      ready = false; starting = false; seconds = 0; ranges = []; pending = null
      id = crypto.randomUUID(); sequence = 0
      if (analyticsAllowed() && !video.paused) void start()
    }
    const events = { play, playing, pause, waiting: pause, stalled: pause, seeking, seeked, ended, timeupdate: sample }
    for (const [event, handler] of Object.entries(events)) video.addEventListener(event, handler)
    window.addEventListener('pagehide', leaving)
    window.addEventListener('reba-analytics-consent', consent)
    document.addEventListener('visibilitychange', visibility)
    const interval = setInterval(() => { if (!video.paused) void start(); flush() }, HEARTBEAT_MS)
    return () => {
      flush(true); disposed = true; clearInterval(interval)
      for (const [event, handler] of Object.entries(events)) video.removeEventListener(event, handler)
      window.removeEventListener('pagehide', leaving)
      window.removeEventListener('reba-analytics-consent', consent)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [ref, contentId, type, src])
}
