'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Episode = {
  id: string
  seasonNumber: number
  number: number
  title: string
  videoUrl: string
  published: boolean
}

type Props = {
  episode: Episode
}

export function EpisodeActions({ episode }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    seasonNumber: String(episode.seasonNumber),
    episodeNumber: String(episode.number),
    title: episode.title,
    videoUrl: episode.videoUrl,
    published: episode.published,
  })

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/episodes/${episode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonNumber: Number(formData.seasonNumber),
          episodeNumber: Number(formData.episodeNumber),
          title: formData.title,
          videoUrl: formData.videoUrl,
          published: formData.published,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update episode.')

      setEditing(false)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to update episode.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/episodes/${episode.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete episode.')

      setConfirmingDelete(false)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete episode.')
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Season">
            <input
              type="number"
              min="1"
              value={formData.seasonNumber}
              onChange={(e) => setFormData((current) => ({ ...current, seasonNumber: e.target.value }))}
              disabled={loading}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]"
            />
          </Field>
          <Field label="Episode">
            <input
              type="number"
              min="1"
              value={formData.episodeNumber}
              onChange={(e) => setFormData((current) => ({ ...current, episodeNumber: e.target.value }))}
              disabled={loading}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Title">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
                disabled={loading}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Video URL">
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData((current) => ({ ...current, videoUrl: e.target.value }))}
                disabled={loading}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData((current) => ({ ...current, published: e.target.checked }))}
              disabled={loading}
              className="h-4 w-4 rounded border-white/20 bg-black text-primary-500 focus:ring-primary-500"
            />
            Published
          </label>
        </div>

        {error && <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={loading}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)} title="Edit episode">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
        onClick={() => setConfirmingDelete(true)}
        title="Delete episode"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Episode</h3>
            <p className="mt-2 text-sm text-white/60">
              Delete "{episode.title}" from this series? This cannot be undone.
            </p>
            {error && <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfirmingDelete(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
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
