'use client'

import { useActionState, useState, useRef } from 'react'
import { Plus, Link2, UploadCloud, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addEpisodeToSeries } from './actions'
import { cn } from '@/lib/utils'

type Props = {
  seriesId: string
  defaultSeasonNumber?: number
  defaultEpisodeNumber?: number
}

type UploadTab = 'url' | 'file'

export function AddEpisodeForm({ seriesId, defaultSeasonNumber = 1, defaultEpisodeNumber }: Props) {
  const [state, formAction, isPending] = useActionState(addEpisodeToSeries, null)

  // Video source toggle
  const [videoTab, setVideoTab] = useState<UploadTab>('url')
  const [videoUrlInput, setVideoUrlInput] = useState('')
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('')

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadDone, setUploadDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadDone(false)
    setUploadProgress(0)
    setUploadedVideoUrl('')

    try {
      // 1. Get presigned URL
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'videos',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to get upload URL')
      }

      const { uploadUrl, url } = await res.json()

      // 2. Upload file to R2 via XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100)
            setUploadedVideoUrl(url)
            setUploadDone(true)
            resolve()
          } else {
            reject(new Error(`Upload failed (Status: ${xhr.status})`))
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
      setUploadProgress(null)
    }
  }

  // Determine which videoUrl value to pass to the hidden input
  const resolvedVideoUrl = videoTab === 'file' ? uploadedVideoUrl : videoUrlInput

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 sticky top-24">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-[#E50914]" />
        Add / Update Episode
      </h2>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          ⚠️ {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="seriesId" value={seriesId} />
        {/* Pass the resolved video URL as the form field */}
        <input type="hidden" name="videoUrl" value={resolvedVideoUrl} />

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Season Number
          </label>
          <input
            type="number"
            name="seasonNumber"
            required
            min="1"
            defaultValue={defaultSeasonNumber}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Episode Number
          </label>
          <input
            type="number"
            name="episodeNumber"
            required
            min="1"
            defaultValue={defaultEpisodeNumber}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Episode Title
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. The Beginning"
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          />
        </div>

        {/* Video Source Toggle */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Video Source
          </label>

          {/* Tab buttons */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden mb-3">
            <button
              type="button"
              onClick={() => setVideoTab('url')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                videoTab === 'url'
                  ? 'bg-[#E50914] text-white'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              )}
            >
              <Link2 className="w-3.5 h-3.5" />
              Enter URL
            </button>
            <button
              type="button"
              onClick={() => setVideoTab('file')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                videoTab === 'file'
                  ? 'bg-[#E50914] text-white'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              )}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload File
            </button>
          </div>

          {/* URL input */}
          {videoTab === 'url' && (
            <input
              type="url"
              placeholder="https://..."
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
            />
          )}

          {/* File upload input */}
          {videoTab === 'file' && (
            <div>
              <label
                htmlFor="episode-video-file"
                className={cn(
                  'flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors',
                  uploadDone
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                )}
              >
                {uploadDone ? (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium mt-1">Uploaded!</span>
                    <span className="text-[10px] text-white/40 break-all max-w-full line-clamp-2">{uploadedVideoUrl}</span>
                    <span className="text-[10px] text-white/40 mt-1">Click to replace</span>
                  </div>
                ) : uploadProgress !== null ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Loader2 className="w-6 h-6 text-[#E50914] animate-spin" />
                    <span className="text-xs text-white/60">Uploading... {uploadProgress}%</span>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-[#E50914] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <UploadCloud className="w-7 h-7 text-white/30" />
                    <span className="text-xs text-white/50 mt-1">Click to browse video file</span>
                    <span className="text-[10px] text-white/30">MP4, WebM, MKV supported</span>
                  </div>
                )}
                <input
                  id="episode-video-file"
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadProgress !== null && !uploadDone}
                />
              </label>

              {uploadError && (
                <p className="text-xs text-red-400 mt-2">⚠️ {uploadError}</p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending || (videoTab === 'file' && !uploadDone && uploadedVideoUrl === '') || (videoTab === 'url' && !videoUrlInput)}
          className="w-full bg-[#E50914] hover:bg-[#b80710] text-white mt-2 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Add / Update Episode'}
        </Button>
        <p className="text-xs text-white/30 text-center">
          If the episode number already exists, it will be updated.
        </p>
      </form>
    </div>
  )
}
