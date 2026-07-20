'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Link2, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  seriesId: string
  defaultSeasonNumber?: number
  defaultEpisodeNumber?: number
}

type UploadTab = 'url' | 'file'
type EpisodeState = 'idle' | 'uploading' | 'saving' | 'done' | 'error'

type EpisodeDraft = {
  id: string
  seasonNumber: string
  episodeNumber: string
  title: string
  videoTab: UploadTab
  videoUrlInput: string
  videoFile: File | null
  uploadedVideoUrl: string
  progress: number | null
  state: EpisodeState
  error: string | null
}

const MAX_EPISODES = 10

function createDraft(seasonNumber: number, episodeNumber: number): EpisodeDraft {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    seasonNumber: String(seasonNumber),
    episodeNumber: String(episodeNumber),
    title: '',
    videoTab: 'url',
    videoUrlInput: '',
    videoFile: null,
    uploadedVideoUrl: '',
    progress: null,
    state: 'idle',
    error: null,
  }
}

export function AddEpisodeForm({ seriesId, defaultSeasonNumber = 1, defaultEpisodeNumber = 1 }: Props) {
  const router = useRouter()
  const activeSavesRef = useRef(0)
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([
    createDraft(defaultSeasonNumber, defaultEpisodeNumber),
  ])

  const uploadingCount = useMemo(
    () => episodes.filter((episode) => episode.state === 'uploading' || episode.state === 'saving').length,
    [episodes]
  )

  const updateEpisode = <K extends keyof EpisodeDraft>(id: string, key: K, value: EpisodeDraft[K]) => {
    setEpisodes((current) =>
      current.map((episode) =>
        episode.id === id ? { ...episode, [key]: value, state: episode.state === 'done' ? 'idle' : episode.state } : episode
      )
    )
  }

  const patchEpisode = (id: string, patch: Partial<EpisodeDraft>) => {
    setEpisodes((current) => current.map((episode) => (episode.id === id ? { ...episode, ...patch } : episode)))
  }

  const addEpisode = () => {
    if (episodes.length >= MAX_EPISODES) return

    const highestEpisode = episodes.reduce((max, episode) => {
      const value = Number(episode.episodeNumber)
      return Number.isFinite(value) ? Math.max(max, value) : max
    }, defaultEpisodeNumber - 1)

    setEpisodes((current) => [...current, createDraft(defaultSeasonNumber, highestEpisode + 1)])
  }

  const removeEpisode = (id: string) => {
    setEpisodes((current) => (current.length === 1 ? current : current.filter((episode) => episode.id !== id)))
  }

  const uploadVideo = async (episode: EpisodeDraft) => {
    if (!episode.videoFile) throw new Error('Choose a video file first.')

    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: episode.videoFile.name,
        contentType: episode.videoFile.type,
        folder: 'videos',
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to prepare video upload.')

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', data.uploadUrl)
      xhr.setRequestHeader('Content-Type', episode.videoFile?.type || 'application/octet-stream')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          patchEpisode(episode.id, { progress: Math.round((event.loaded / event.total) * 100) })
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          patchEpisode(episode.id, { progress: 100, uploadedVideoUrl: data.url })
          resolve(data.url)
        } else {
          reject(new Error(`Upload failed (${xhr.status}).`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload.'))
      xhr.send(episode.videoFile)
    })
  }

  const saveEpisode = async (episodeId: string) => {
    const episode = episodes.find((item) => item.id === episodeId)
    if (!episode) return

    activeSavesRef.current += 1
    patchEpisode(episodeId, { state: 'uploading', error: null, progress: episode.videoTab === 'file' ? 0 : null })

    try {
      const videoUrl =
        episode.videoTab === 'file'
          ? episode.uploadedVideoUrl || await uploadVideo(episode)
          : episode.videoUrlInput.trim()

      patchEpisode(episodeId, { state: 'saving' })

      const res = await fetch(`/api/admin/series/${seriesId}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonNumber: Number(episode.seasonNumber),
          episodeNumber: Number(episode.episodeNumber),
          title: episode.title.trim(),
          videoUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save episode.')

      patchEpisode(episodeId, { state: 'done', error: null })
    } catch (err: any) {
      patchEpisode(episodeId, {
        state: 'error',
        error: err?.message || 'Failed to save episode.',
        progress: episode.videoTab === 'file' ? episode.progress : null,
      })
    } finally {
      activeSavesRef.current = Math.max(0, activeSavesRef.current - 1)
      if (activeSavesRef.current === 0) {
        router.refresh()
      }
    }
  }

  const saveAll = () => {
    episodes
      .filter((episode) => episode.state !== 'uploading' && episode.state !== 'saving')
      .forEach((episode) => void saveEpisode(episode.id))
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Plus className="h-5 w-5 text-[#E50914]" />
            Add Episodes
          </h2>
          <p className="mt-1 text-xs text-white/40">
            Queue up to {MAX_EPISODES} episodes. {uploadingCount > 0 ? `${uploadingCount} uploading or saving.` : 'Ready to upload.'}
          </p>
        </div>
        <Button type="button" size="icon-sm" variant="ghost" onClick={addEpisode} disabled={episodes.length >= MAX_EPISODES} aria-label="Add episode">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {episodes.map((episode, index) => {
          const busy = episode.state === 'uploading' || episode.state === 'saving'
          const hasVideo = episode.videoTab === 'file' ? Boolean(episode.videoFile || episode.uploadedVideoUrl) : Boolean(episode.videoUrlInput.trim())
          const canSave = !busy && Boolean(episode.title.trim()) && hasVideo

          return (
            <div key={episode.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Episode {index + 1}</h3>
                  {episode.state === 'done' && <p className="mt-0.5 text-xs text-emerald-400">Saved successfully</p>}
                  {episode.state === 'error' && <p className="mt-0.5 text-xs text-red-400">{episode.error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-[#E50914]" />}
                  {episode.state === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {episode.state === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeEpisode(episode.id)}
                    disabled={busy || episodes.length === 1}
                    aria-label="Remove episode"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Season">
                  <input
                    type="number"
                    min="1"
                    value={episode.seasonNumber}
                    onChange={(e) => updateEpisode(episode.id, 'seasonNumber', e.target.value)}
                    disabled={busy}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                  />
                </Field>
                <Field label="Episode">
                  <input
                    type="number"
                    min="1"
                    value={episode.episodeNumber}
                    onChange={(e) => updateEpisode(episode.id, 'episodeNumber', e.target.value)}
                    disabled={busy}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Title">
                    <input
                      type="text"
                      value={episode.title}
                      onChange={(e) => updateEpisode(episode.id, 'title', e.target.value)}
                      disabled={busy}
                      placeholder="e.g. The Beginning"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">Video Source</span>
                <div className="mb-3 flex overflow-hidden rounded-lg border border-white/10">
                  <SourceButton active={episode.videoTab === 'url'} disabled={busy} onClick={() => updateEpisode(episode.id, 'videoTab', 'url')}>
                    <Link2 className="h-3.5 w-3.5" />
                    URL
                  </SourceButton>
                  <SourceButton active={episode.videoTab === 'file'} disabled={busy} onClick={() => updateEpisode(episode.id, 'videoTab', 'file')}>
                    <UploadCloud className="h-3.5 w-3.5" />
                    File
                  </SourceButton>
                </div>

                {episode.videoTab === 'url' ? (
                  <input
                    type="url"
                    value={episode.videoUrlInput}
                    onChange={(e) => updateEpisode(episode.id, 'videoUrlInput', e.target.value)}
                    disabled={busy}
                    placeholder="https://..."
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                  />
                ) : (
                  <div>
                    <label className="block cursor-pointer rounded-lg border border-dashed border-white/15 bg-white/5 px-4 py-5 text-center hover:border-white/30">
                      <UploadCloud className="mx-auto mb-2 h-6 w-6 text-white/30" />
                      <span className="block text-xs font-medium text-white/60">
                        {episode.videoFile?.name || episode.uploadedVideoUrl || 'Choose video file'}
                      </span>
                      <span className="mt-1 block text-[10px] text-white/30">MP4, WebM, MOV, MKV</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                        disabled={busy}
                        className="hidden"
                        onChange={(e) => {
                          updateEpisode(episode.id, 'videoFile', e.target.files?.[0] || null)
                          patchEpisode(episode.id, { uploadedVideoUrl: '', progress: null, error: null })
                        }}
                      />
                    </label>

                    {episode.progress !== null && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
                          <span>Video upload</span>
                          <span>{episode.progress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[#E50914] transition-all" style={{ width: `${episode.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={() => void saveEpisode(episode.id)}
                disabled={!canSave}
                className="mt-4 w-full bg-[#E50914] text-white hover:bg-[#b80710]"
              >
                {episode.state === 'uploading' ? `Uploading ${episode.progress ?? 0}%` : episode.state === 'saving' ? 'Saving...' : 'Save Episode'}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Button type="button" variant="outline" onClick={addEpisode} disabled={episodes.length >= MAX_EPISODES}>
          <Plus className="h-4 w-4" />
          Add another episode
        </Button>
        <Button type="button" variant="secondary" onClick={saveAll}>
          <UploadCloud className="h-4 w-4" />
          Save all ready episodes
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">{label}</span>
      {children}
    </label>
  )
}

function SourceButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        active ? 'bg-[#E50914] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}
