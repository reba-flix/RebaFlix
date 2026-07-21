'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Link2, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  movieId: string
  defaultPartNumber?: number
}

type UploadTab = 'url' | 'file'
type PartState = 'idle' | 'uploading' | 'saving' | 'done' | 'error'

type PartDraft = {
  id: string
  partNumber: string
  title: string
  videoTab: UploadTab
  videoUrlInput: string
  downloadUrlInput: string
  videoFile: File | null
  uploadedVideoUrl: string
  progress: number | null
  state: PartState
  error: string | null
}

const MAX_PARTS = 10

function createDraft(partNumber: number): PartDraft {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    partNumber: String(partNumber),
    title: '',
    videoTab: 'url',
    videoUrlInput: '',
    downloadUrlInput: '',
    videoFile: null,
    uploadedVideoUrl: '',
    progress: null,
    state: 'idle',
    error: null,
  }
}

export function AddMoviePartForm({ movieId, defaultPartNumber = 1 }: Props) {
  const router = useRouter()
  const activeSavesRef = useRef(0)
  const [parts, setParts] = useState<PartDraft[]>([createDraft(defaultPartNumber)])

  const uploadingCount = useMemo(
    () => parts.filter((part) => part.state === 'uploading' || part.state === 'saving').length,
    [parts]
  )

  const updatePart = <K extends keyof PartDraft>(id: string, key: K, value: PartDraft[K]) => {
    setParts((current) =>
      current.map((part) => (part.id === id ? { ...part, [key]: value, state: part.state === 'done' ? 'idle' : part.state } : part))
    )
  }

  const patchPart = (id: string, patch: Partial<PartDraft>) => {
    setParts((current) => current.map((part) => (part.id === id ? { ...part, ...patch } : part)))
  }

  const addPart = () => {
    if (parts.length >= MAX_PARTS) return

    const highestPart = parts.reduce((max, part) => {
      const value = Number(part.partNumber)
      return Number.isFinite(value) ? Math.max(max, value) : max
    }, defaultPartNumber - 1)

    setParts((current) => [...current, createDraft(highestPart + 1)])
  }

  const removePart = (id: string) => {
    setParts((current) => (current.length === 1 ? current : current.filter((part) => part.id !== id)))
  }

  const uploadVideo = async (part: PartDraft) => {
    if (!part.videoFile) throw new Error('Choose a video file first.')

    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: part.videoFile.name,
        contentType: part.videoFile.type,
        folder: 'videos',
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to prepare video upload.')

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', data.uploadUrl)
      xhr.setRequestHeader('Content-Type', part.videoFile?.type || 'application/octet-stream')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          patchPart(part.id, { progress: Math.round((event.loaded / event.total) * 100) })
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          patchPart(part.id, { progress: 100, uploadedVideoUrl: data.url })
          resolve(data.url)
        } else {
          reject(new Error(`Upload failed (${xhr.status}).`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload.'))
      xhr.send(part.videoFile)
    })
  }

  const savePart = async (partId: string) => {
    const part = parts.find((item) => item.id === partId)
    if (!part) return

    activeSavesRef.current += 1
    patchPart(partId, { state: 'uploading', error: null, progress: part.videoTab === 'file' ? 0 : null })

    try {
      const videoUrl =
        part.videoTab === 'file'
          ? part.uploadedVideoUrl || await uploadVideo(part)
          : part.videoUrlInput.trim()

      patchPart(partId, { state: 'saving' })

      const res = await fetch(`/api/admin/movies/${movieId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partNumber: Number(part.partNumber),
          title: part.title.trim(),
          videoUrl,
          downloadUrl: part.downloadUrlInput.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save movie part.')

      patchPart(partId, { state: 'done', error: null })
    } catch (err: any) {
      patchPart(partId, {
        state: 'error',
        error: err?.message || 'Failed to save movie part.',
        progress: part.videoTab === 'file' ? part.progress : null,
      })
    } finally {
      activeSavesRef.current = Math.max(0, activeSavesRef.current - 1)
      if (activeSavesRef.current === 0) {
        router.refresh()
      }
    }
  }

  const saveAll = () => {
    parts
      .filter((part) => part.state !== 'uploading' && part.state !== 'saving')
      .forEach((part) => void savePart(part.id))
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Plus className="h-5 w-5 text-[#E50914]" />
            Add Parts
          </h2>
          <p className="mt-1 text-xs text-white/40">
            Queue up to {MAX_PARTS} parts. {uploadingCount > 0 ? `${uploadingCount} uploading or saving.` : 'Ready to upload.'}
          </p>
        </div>
        <Button type="button" size="icon-sm" variant="ghost" onClick={addPart} disabled={parts.length >= MAX_PARTS} aria-label="Add part">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {parts.map((part, index) => {
          const busy = part.state === 'uploading' || part.state === 'saving'
          const hasVideo = part.videoTab === 'file' ? Boolean(part.videoFile || part.uploadedVideoUrl) : Boolean(part.videoUrlInput.trim())
          const canSave = !busy && Boolean(part.title.trim()) && hasVideo

          return (
            <div key={part.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Part {index + 1}</h3>
                  {part.state === 'done' && <p className="mt-0.5 text-xs text-emerald-400">Saved successfully</p>}
                  {part.state === 'error' && <p className="mt-0.5 text-xs text-red-400">{part.error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-[#E50914]" />}
                  {part.state === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {part.state === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => removePart(part.id)} disabled={busy || parts.length === 1} aria-label="Remove part">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Part">
                  <input
                    type="number"
                    min="1"
                    value={part.partNumber}
                    onChange={(e) => updatePart(part.id, 'partNumber', e.target.value)}
                    disabled={busy}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                  />
                </Field>
                <Field label="Title">
                  <input
                    type="text"
                    value={part.title}
                    onChange={(e) => updatePart(part.id, 'title', e.target.value)}
                    disabled={busy}
                    placeholder="e.g. Part 2"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">Video Source</span>
                <div className="mb-3 flex overflow-hidden rounded-lg border border-white/10">
                  <SourceButton active={part.videoTab === 'url'} disabled={busy} onClick={() => updatePart(part.id, 'videoTab', 'url')}>
                    <Link2 className="h-3.5 w-3.5" />
                    URL
                  </SourceButton>
                  <SourceButton active={part.videoTab === 'file'} disabled={busy} onClick={() => updatePart(part.id, 'videoTab', 'file')}>
                    <UploadCloud className="h-3.5 w-3.5" />
                    File
                  </SourceButton>
                </div>

                {part.videoTab === 'url' ? (
                  <input
                    type="url"
                    value={part.videoUrlInput}
                    onChange={(e) => updatePart(part.id, 'videoUrlInput', e.target.value)}
                    disabled={busy}
                    placeholder="https://..."
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                  />
                ) : (
                  <div>
                    <label className="block cursor-pointer rounded-lg border border-dashed border-white/15 bg-white/5 px-4 py-5 text-center hover:border-white/30">
                      <UploadCloud className="mx-auto mb-2 h-6 w-6 text-white/30" />
                      <span className="block text-xs font-medium text-white/60">
                        {part.videoFile?.name || part.uploadedVideoUrl || 'Choose video file'}
                      </span>
                      <span className="mt-1 block text-[10px] text-white/30">MP4, WebM, MOV, MKV</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                        disabled={busy}
                        className="hidden"
                        onChange={(e) => {
                          updatePart(part.id, 'videoFile', e.target.files?.[0] || null)
                          patchPart(part.id, { uploadedVideoUrl: '', progress: null, error: null })
                        }}
                      />
                    </label>

                    {part.progress !== null && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
                          <span>Video upload</span>
                          <span>{part.progress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[#E50914] transition-all" style={{ width: `${part.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Field label="Download URL">
                  <input
                    type="url"
                    value={part.downloadUrlInput}
                    onChange={(e) => updatePart(part.id, 'downloadUrlInput', e.target.value)}
                    disabled={busy}
                    placeholder="Optional; defaults to video URL"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                  />
                </Field>
              </div>

              <Button type="button" onClick={() => void savePart(part.id)} disabled={!canSave} className="mt-4 w-full bg-[#E50914] text-white hover:bg-[#b80710]">
                {part.state === 'uploading' ? `Uploading ${part.progress ?? 0}%` : part.state === 'saving' ? 'Saving...' : 'Save Part'}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Button type="button" variant="outline" onClick={addPart} disabled={parts.length >= MAX_PARTS}>
          <Plus className="h-4 w-4" />
          Add another part
        </Button>
        <Button type="button" variant="secondary" onClick={saveAll}>
          <UploadCloud className="h-4 w-4" />
          Save all ready parts
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
