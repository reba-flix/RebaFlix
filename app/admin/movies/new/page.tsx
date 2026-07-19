'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, UploadCloud, X } from 'lucide-react'

export default function NewMoviePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Metadata options
  const [genres, setGenres] = useState<{id: string, name: string}[]>([])
  const [languages, setLanguages] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    // Fetch genres and languages for the form (we'll implement this endpoint next if needed, or fetch from a general meta endpoint)
    // For now, let's just create a quick metadata fetcher
    fetch('/api/admin/metadata')
      .then(res => res.json())
      .then(data => {
        if (data.genres) setGenres(data.genres)
        if (data.languages) setLanguages(data.languages)
      })
      .catch(console.error)
  }, [])

  const [formData, setFormData] = useState({
    type: 'movie',
    title: '',
    slug: '',
    tagline: '',
    description: '',
    translator: '',
    externalVideoUrl: '',
    downloadUrl: '',
    runtimeMinutes: '',
    releaseDate: '',
    contentRating: '',
    featured: false,
    published: false,
    genreIds: [] as string[],
  })

  // File uploads state
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [backdropFile, setBackdropFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  
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
        ? prev.genreIds.filter(id => id !== genreId)
        : [...prev.genreIds, genreId]
      return { ...prev, genreIds: ids }
    })
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    // 1. Get presigned URL
    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        folder,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `Failed to get upload URL for ${folder}`)
    }

    const { uploadUrl, url } = await res.json()

    // 2. Upload file directly to R2
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(prev => ({ ...prev, [folder]: percent }))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(prev => ({ ...prev, [folder]: 100 }))
          resolve(url)
        } else {
          reject(new Error(`Failed to upload ${folder} to R2 (Status: ${xhr.status})`))
        }
      }

      xhr.onerror = () => reject(new Error(`Network error while uploading ${folder}`))
      xhr.send(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let posterUrl = ''
      let backdropUrl = ''
      let videoUrl = ''

      if (posterFile) posterUrl = await uploadFile(posterFile, 'posters')
      if (backdropFile) backdropUrl = await uploadFile(backdropFile, 'backdrops')
      if (videoFile) videoUrl = await uploadFile(videoFile, 'videos')

      const res = await fetch('/api/admin/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          posterUrl: posterUrl || undefined,
          backdropUrl: backdropUrl || undefined,
          videoUrl: videoUrl || undefined,
          externalVideoUrl: formData.externalVideoUrl || undefined,
          downloadUrl: formData.downloadUrl || undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create movie')
      }

      router.push('/admin/movies')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-28 md:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl font-black md:text-5xl mb-8">Add New Movie</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-xl font-bold">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Type *</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Title *</label>
                <Input required name="title" value={formData.title} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Slug (optional)</label>
                <Input name="slug" value={formData.slug} onChange={handleChange} placeholder="auto-generated-if-empty" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Tagline</label>
                <Input name="tagline" value={formData.tagline} onChange={handleChange} />
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Runtime (minutes)</label>
                <Input type="number" name="runtimeMinutes" value={formData.runtimeMinutes} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Release Date</label>
                <Input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange} />
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
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG_13">PG-13</option>
                  <option value="R">R</option>
                  <option value="NC_17">NC-17</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-xl font-bold">Media Uploads</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Poster Image</label>
                <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} />
                {uploadProgress.posters !== undefined && (
                  <div className="mt-2 text-sm text-primary-400">
                    Uploading: {uploadProgress.posters}%
                    <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                      <div className="bg-primary-500 h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.posters}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Backdrop Image</label>
                <Input type="file" accept="image/*" onChange={(e) => setBackdropFile(e.target.files?.[0] || null)} />
                {uploadProgress.backdrops !== undefined && (
                  <div className="mt-2 text-sm text-primary-400">
                    Uploading: {uploadProgress.backdrops}%
                    <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                      <div className="bg-primary-500 h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.backdrops}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/70 mb-1">Video File</label>
                <Input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-white/40 mt-1">Leave empty if you intend to stream externally or upload later.</p>
                {uploadProgress.videos !== undefined && (
                  <div className="mt-2 text-sm text-primary-400">
                    Uploading video: {uploadProgress.videos}%
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                      <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.videos}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/70 mb-1">Direct Video Link (Optional)</label>
                <Input name="externalVideoUrl" value={formData.externalVideoUrl} onChange={handleChange} placeholder="https://example.com/video.mp4" />
                <p className="text-xs text-white/40 mt-1">If you provide this, you don't need to upload a video file above.</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/70 mb-1">Download Link (MediaFire etc.)</label>
                <Input name="downloadUrl" value={formData.downloadUrl} onChange={handleChange} placeholder="https://www.mediafire.com/file/..." />
                <p className="text-xs text-white/40 mt-1">This will show a download button to users.</p>
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
                <><UploadCloud className="mr-2 h-4 w-4" /> Create Movie</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
