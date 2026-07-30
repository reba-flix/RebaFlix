'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Pencil, Play, Save, Trash2, X } from 'lucide-react'
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

export function EpisodeRow({ episode }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    seasonNumber: String(episode.seasonNumber),
    episodeNumber: String(episode.number),
    title: episode.title,
    videoUrl: episode.videoUrl || '',
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
      <div className="p-6 bg-[#0a0a0a] border-y border-white/10 shadow-inner">
        <h4 className="text-lg font-semibold text-white mb-6">Edit Episode {episode.number}</h4>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Season">
            <input
              type="number"
              min="1"
              value={formData.seasonNumber}
              onChange={(e) => setFormData((current) => ({ ...current, seasonNumber: e.target.value }))}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all shadow-inner"
            />
          </Field>
          <Field label="Episode">
            <input
              type="number"
              min="1"
              value={formData.episodeNumber}
              onChange={(e) => setFormData((current) => ({ ...current, episodeNumber: e.target.value }))}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all shadow-inner"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Title">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all shadow-inner"
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
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all shadow-inner"
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm text-white/80 sm:col-span-2 mt-2 cursor-pointer hover:text-white transition-colors">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData((current) => ({ ...current, published: e.target.checked }))}
                disabled={loading}
                className="peer sr-only"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
            </div>
            Published to users
          </label>
        </div>

        {error && <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={loading} className="hover:bg-white/5">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading} className="bg-[#E50914] hover:bg-[#b80710] text-white shadow-lg shadow-[#E50914]/20 border border-[#E50914]/50">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded">
              EP {episode.number}
            </span>
            <span className="font-medium text-white/90">
              {episode.title}
            </span>
            {episode.published ? (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Published</span>
            ) : (
              <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Draft</span>
            )}
          </div>
          <div className="text-xs text-white/40 truncate max-w-sm">
            {episode.videoUrl}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {episode.videoUrl && (
            <Button variant="outline" size="sm" asChild className="bg-transparent border-white/20 text-white hover:bg-white/10">
              <Link href={`/watch/${episode.id}`} target="_blank">
                <Play className="w-3.5 h-3.5 mr-1" /> Test
              </Link>
            </Button>
          )}
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
        </div>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Episode</h3>
            <p className="text-sm text-white/60 mb-6">
              Delete "{episode.title}" from this series? This cannot be undone.
            </p>
            {error && <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfirmingDelete(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">{label}</span>
      {children}
    </label>
  )
}
