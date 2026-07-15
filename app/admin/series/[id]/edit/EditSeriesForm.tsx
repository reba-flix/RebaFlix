'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save } from 'lucide-react'

export default function EditSeriesForm({ series }: { series: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [genres, setGenres] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    fetch('/api/admin/metadata')
      .then(res => res.json())
      .then(data => {
        if (data.genres) setGenres(data.genres)
      })
      .catch(console.error)
  }, [])

  const extractTranslator = (desc: string) => {
    const match = desc.match(/Translator:\s*(.+)$/i)
    return match ? match[1] : ''
  }
  
  const stripTranslator = (desc: string) => {
    return desc.replace(/\n\nTranslator:\s*(.+)$/i, '')
  }

  const [formData, setFormData] = useState({
    type: 'series',
    title: series.title || '',
    slug: series.slug || '',
    tagline: series.tagline || '',
    description: stripTranslator(series.description || ''),
    translator: extractTranslator(series.description || ''),
    downloadUrl: series.downloadUrl || '',
    contentRating: series.contentRating || '',
    featured: series.featured || false,
    published: series.published || false,
    genreIds: series.genres?.map((g: any) => g.genreId) || [] as string[],
  })

  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [backdropFile, setBackdropFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleGenreToggle = (genreId: string) => {
    setFormData(prev => {
      const ids = prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id: string) => id !== genreId)
        : [...prev.genreIds, genreId]
      return { ...prev, genreIds: ids }
    })
  }

  const uploadFile = (file: File, folder: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', folder)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/uploads')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(prev => ({ ...prev, [folder]: percent }))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText)
            setUploadProgress(prev => ({ ...prev, [folder]: 100 }))
            resolve(json.url)
          } catch (e) {
            reject(new Error('Invalid JSON response'))
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.error || `Failed to upload ${folder}`))
          } catch (e) {
            reject(new Error(`Failed to upload ${folder}`))
          }
        }
      }

      xhr.onerror = () => reject(new Error(`Network error while uploading ${folder}`))
      xhr.send(data)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let posterUrl = series.posterUrl
      let backdropUrl = series.backdropUrl

      if (posterFile) posterUrl = await uploadFile(posterFile, 'posters')
      if (backdropFile) backdropUrl = await uploadFile(backdropFile, 'backdrops')

      const res = await fetch(`/api/admin/movies/${series.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          posterUrl: posterUrl || undefined,
          backdropUrl: backdropUrl || undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update series')
      }

      router.push('/admin/series')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-28 md:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl font-black md:text-5xl mb-8">Edit TV Series</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-xl font-bold">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Title *</label>
                <Input required name="title" value={formData.title} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Slug (optional)</label>
                <Input name="slug" value={formData.slug} onChange={handleChange} placeholder="auto-generated-if-empty" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Tagline</label>
                <Input name="tagline" value={formData.tagline} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Content Rating</label>
                <select 
                  name="contentRating" 
                  value={formData.contentRating} 
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="">None</option>
                  <option value="TV_Y">TV-Y</option>
                  <option value="TV_G">TV-G</option>
                  <option value="TV_PG">TV-PG</option>
                  <option value="TV_14">TV-14</option>
                  <option value="TV_MA">TV-MA</option>
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG_13">PG-13</option>
                  <option value="R">R</option>
                  <option value="NC_17">NC-17</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Translator</label>
              <Input name="translator" value={formData.translator} onChange={handleChange} placeholder="Translator name/details" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Description *</label>
              <textarea 
                required 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                className="w-full min-h-[100px] rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-xl font-bold">Media Uploads</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Poster Image (Leave empty to keep existing)</label>
                <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} />
                {uploadProgress.posters !== undefined && (
                  <div className="mt-2 text-sm text-primary-400">
                    Uploading: {uploadProgress.posters}%
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Backdrop Image (Leave empty to keep existing)</label>
                <Input type="file" accept="image/*" onChange={(e) => setBackdropFile(e.target.files?.[0] || null)} />
                {uploadProgress.backdrops !== undefined && (
                  <div className="mt-2 text-sm text-primary-400">
                    Uploading: {uploadProgress.backdrops}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-xl font-bold">Taxonomy & Visibility</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Genres</label>
              <div className="flex flex-wrap gap-2">
                {genres.map(g => (
                  <label key={g.id} className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10">
                    <input 
                      type="checkbox" 
                      checked={formData.genreIds.includes(g.id)} 
                      onChange={() => handleGenreToggle(g.id)} 
                      className="rounded bg-black border-white/20 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm">{g.name}</span>
                  </label>
                ))}
                {genres.length === 0 && <span className="text-sm text-white/40">Loading genres...</span>}
              </div>
            </div>

            <div className="flex space-x-6 pt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="published" 
                  checked={formData.published} 
                  onChange={handleChange} 
                  className="rounded bg-black border-white/20 text-primary-500 focus:ring-primary-500 h-5 w-5"
                />
                <span>Published (Visible to users)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="featured" 
                  checked={formData.featured} 
                  onChange={handleChange} 
                  className="rounded bg-black border-white/20 text-primary-500 focus:ring-primary-500 h-5 w-5"
                />
                <span>Featured (Show on homepage banner)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
