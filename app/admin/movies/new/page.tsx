'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Film, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_MOVIES, useMovieUploadStore } from '@/components/admin/movie-upload-store'
import type { MediaFolder, MovieDraft } from '@/components/admin/movie-upload-store'

type Genre = { id: string; name: string }

export default function NewMoviePage() {
  const router = useRouter()
  const [genres, setGenres] = useState<Genre[]>([])
  const isMounted = useRef(false)
  const {
    movies,
    loading,
    error,
    success,
    progress,
    addMovie,
    removeMovie,
    updateMovie,
    toggleGenre,
    clearMessages,
    startUploads,
  } = useMovieUploadStore()

  useEffect(() => {
    isMounted.current = true
    fetch('/api/admin/metadata')
      .then((res) => res.json())
      .then((data) => {
        if (data.genres) setGenres(data.genres)
      })
      .catch(console.error)

    return () => {
      isMounted.current = false
    }
  }, [])

  const completedCount = useMemo(
    () => Object.values(progress).filter((item) => item.state === 'done').length,
    [progress]
  )

  const handleChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    updateMovie(id, name as keyof MovieDraft, (type === 'checkbox' ? checked : value) as never)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    const completed = await startUploads()

    if (!completed || !isMounted.current) return

    setTimeout(() => {
      if (isMounted.current) {
        router.push('/admin/movies')
        router.refresh()
      }
    }, 1200)
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-[#E50914]">
              <Film className="h-7 w-7" />
              <span className="text-sm font-bold uppercase tracking-wide">Admin upload queue</span>
            </div>
            <h1 className="font-display text-3xl font-black text-white md:text-5xl">Add Movies</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Create one movie as before, or queue up to {MAX_MOVIES} movies and upload their videos together.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addMovie} disabled={loading || movies.length >= MAX_MOVIES}>
            <Plus className="h-4 w-4" />
            Add another movie
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-3 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
              <span>{movies.length} of {MAX_MOVIES} upload slots in use</span>
              <span>{completedCount} completed</span>
            </div>
            {loading && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#E50914] transition-all"
                  style={{ width: `${Math.round((completedCount / movies.length) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {movies.map((movie, index) => {
            const itemProgress = progress[movie.id]
            const locked = loading && itemProgress?.state !== 'error'

            return (
              <section key={movie.id} className="rounded-md border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Movie {index + 1}</h2>
                    <p className="text-sm text-white/40">{movie.title || 'New upload item'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {itemProgress?.state === 'uploading' && <StatusPill icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />} text="Uploading" />}
                    {itemProgress?.state === 'saving' && <StatusPill icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />} text="Saving" />}
                    {itemProgress?.state === 'done' && <StatusPill icon={<CheckCircle2 className="h-3.5 w-3.5" />} text="Done" tone="success" />}
                    {itemProgress?.state === 'error' && <StatusPill icon={<AlertCircle className="h-3.5 w-3.5" />} text="Failed" tone="danger" />}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeMovie(movie.id)}
                      disabled={loading || movies.length === 1}
                      aria-label="Remove movie"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Type">
                    <select
                      name="type"
                      value={movie.type}
                      onChange={(e) => handleChange(movie.id, e)}
                      disabled={locked}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <option value="movie">Movie</option>
                      <option value="series">Series</option>
                    </select>
                  </Field>
                  <Field label="Title *">
                    <Input required name="title" value={movie.title} onChange={(e) => handleChange(movie.id, e)} disabled={locked} />
                  </Field>
                  <Field label="Slug (optional)">
                    <Input name="slug" value={movie.slug} onChange={(e) => handleChange(movie.id, e)} disabled={locked} placeholder="auto-generated-if-empty" />
                  </Field>
                  <Field label="Tagline">
                    <Input name="tagline" value={movie.tagline} onChange={(e) => handleChange(movie.id, e)} disabled={locked} />
                  </Field>
                  <Field label="Translator">
                    <Input name="translator" value={movie.translator} onChange={(e) => handleChange(movie.id, e)} disabled={locked} placeholder="Translator name/details" />
                  </Field>
                  <Field label="Release Year">
                    <Input type="number" name="releaseYear" value={movie.releaseYear} onChange={(e) => handleChange(movie.id, e)} disabled={locked} placeholder="e.g. 2024" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Description *">
                      <textarea
                        required
                        name="description"
                        value={movie.description}
                        onChange={(e) => handleChange(movie.id, e)}
                        disabled={locked}
                        className="min-h-[96px] w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      />
                    </Field>
                  </div>
                  <Field label="Runtime (minutes)">
                    <Input type="number" name="runtimeMinutes" value={movie.runtimeMinutes} onChange={(e) => handleChange(movie.id, e)} disabled={locked} />
                  </Field>
                  <Field label="Content Rating">
                    <select
                      name="contentRating"
                      value={movie.contentRating}
                      onChange={(e) => handleChange(movie.id, e)}
                      disabled={locked}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <option value="">None</option>
                      <option value="G">G</option>
                      <option value="PG">PG</option>
                      <option value="PG_13">PG-13</option>
                      <option value="R">R</option>
                      <option value="NC_17">NC-17</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UploadField label="Poster Image" folder="posters" progress={itemProgress?.posters}>
                    <Input type="file" accept="image/*" disabled={locked} onChange={(e) => updateMovie(movie.id, 'posterFile', e.target.files?.[0] || null)} />
                  </UploadField>
                  <UploadField label="Backdrop Image" folder="backdrops" progress={itemProgress?.backdrops}>
                    <Input type="file" accept="image/*" disabled={locked} onChange={(e) => updateMovie(movie.id, 'backdropFile', e.target.files?.[0] || null)} />
                  </UploadField>
                  <div className="md:col-span-2">
                    <UploadField label="Video File" folder="videos" progress={itemProgress?.videos}>
                      <Input type="file" accept="video/*" disabled={locked} onChange={(e) => updateMovie(movie.id, 'videoFile', e.target.files?.[0] || null)} />
                      <p className="mt-1 text-xs text-white/40">Leave empty if you intend to stream externally or upload later.</p>
                    </UploadField>
                  </div>
                  <Field label="Direct Video Link (Optional)">
                    <Input name="externalVideoUrl" value={movie.externalVideoUrl} onChange={(e) => handleChange(movie.id, e)} disabled={locked} placeholder="https://example.com/video.mp4" />
                  </Field>
                  <Field label="Download Link (MediaFire etc.)">
                    <Input name="downloadUrl" value={movie.downloadUrl} onChange={(e) => handleChange(movie.id, e)} disabled={locked} placeholder="https://www.mediafire.com/file/..." />
                  </Field>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <label className="mb-2 block text-sm font-medium text-white/70">Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <label key={genre.id} className="flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 hover:bg-white/10">
                        <input
                          type="checkbox"
                          checked={movie.genreIds.includes(genre.id)}
                          onChange={() => toggleGenre(movie.id, genre.id)}
                          disabled={locked}
                          className="rounded border-white/20 bg-black text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-white/70">{genre.name}</span>
                      </label>
                    ))}
                    {genres.length === 0 && <span className="text-sm text-white/40">Loading genres...</span>}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <ToggleLabel label="Published" checked={movie.published} disabled={locked} onChange={(checked) => updateMovie(movie.id, 'published', checked)} />
                    <ToggleLabel label="Featured" checked={movie.featured} disabled={locked} onChange={(checked) => updateMovie(movie.id, 'featured', checked)} />
                    <ToggleLabel label="Old Movie" checked={movie.isOldContent} disabled={locked} onChange={(checked) => updateMovie(movie.id, 'isOldContent', checked)} />
                  </div>
                </div>

                {itemProgress?.error && (
                  <div className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {itemProgress.error}
                  </div>
                )}
              </section>
            )
          })}

          {error && <Notice tone="danger" text={error} />}
          {success && <Notice tone="success" text={success} />}

          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {movies.length} item{movies.length === 1 ? '' : 's'}...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Create {movies.length} item{movies.length === 1 ? '' : 's'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/70">{label}</span>
      {children}
    </label>
  )
}

function UploadField({
  label,
  progress,
  children,
}: {
  label: string
  folder: MediaFolder
  progress?: number
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-white/70">{label}</span>
      {children}
      {progress !== undefined && (
        <div className="mt-2 text-sm text-primary-400">
          Uploading: {progress}%
          <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
            <div className="h-1.5 rounded-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleLabel({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-black text-primary-500 focus:ring-primary-500"
      />
      {label}
    </label>
  )
}

function StatusPill({
  icon,
  text,
  tone = 'neutral',
}: {
  icon: React.ReactNode
  text: string
  tone?: 'neutral' | 'success' | 'danger'
}) {
  const colors = {
    neutral: 'border-white/10 bg-white/10 text-white/70',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    danger: 'border-red-500/30 bg-red-500/10 text-red-300',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colors[tone]}`}>
      {icon}
      {text}
    </span>
  )
}

function Notice({ text, tone }: { text: string; tone: 'success' | 'danger' }) {
  const isSuccess = tone === 'success'
  return (
    <div className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${isSuccess ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
      {isSuccess ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
      {text}
    </div>
  )
}
