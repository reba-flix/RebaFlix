'use client'

import { create } from 'zustand'

export const MAX_MOVIES = 10

export type Genre = { id: string; name: string }
export type MediaFolder = 'posters' | 'backdrops' | 'videos'
export type UploadState = 'idle' | 'uploading' | 'saving' | 'done' | 'error'

export type MovieDraft = {
  id: string
  type: 'movie' | 'series'
  title: string
  slug: string
  tagline: string
  description: string
  translator: string
  externalVideoUrl: string
  downloadUrl: string
  runtimeMinutes: string
  releaseYear: string
  contentRating: string
  featured: boolean
  published: boolean
  isOldContent: boolean
  genreIds: string[]
  posterFile: File | null
  backdropFile: File | null
  videoFile: File | null
}

export type MovieProgress = {
  state: UploadState
  posters?: number
  backdrops?: number
  videos?: number
  error?: string
}

type UploadStore = {
  movies: MovieDraft[]
  loading: boolean
  error: string | null
  success: string | null
  progress: Record<string, MovieProgress>
  addMovie: () => void
  removeMovie: (id: string) => void
  updateMovie: <K extends keyof MovieDraft>(id: string, key: K, value: MovieDraft[K]) => void
  toggleGenre: (movieId: string, genreId: string) => void
  clearMessages: () => void
  startUploads: () => Promise<boolean>
}

const createDraft = (): MovieDraft => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  type: 'movie',
  title: '',
  slug: '',
  tagline: '',
  description: '',
  translator: '',
  externalVideoUrl: '',
  downloadUrl: '',
  runtimeMinutes: '',
  releaseYear: '',
  contentRating: '',
  featured: false,
  published: false,
  isOldContent: false,
  genreIds: [],
  posterFile: null,
  backdropFile: null,
  videoFile: null,
})

const setMovieProgress = (
  set: (partial: Partial<UploadStore> | ((state: UploadStore) => Partial<UploadStore>)) => void,
  movieId: string,
  patch: Partial<MovieProgress>
) => {
  set((state) => ({
    progress: {
      ...state.progress,
      [movieId]: { ...(state.progress[movieId] ?? { state: 'idle' as UploadState }), ...patch },
    },
  }))
}

const uploadFile = async (
  set: (partial: Partial<UploadStore> | ((state: UploadStore) => Partial<UploadStore>)) => void,
  movieId: string,
  file: File,
  folder: MediaFolder
): Promise<string> => {
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Failed to prepare ${folder} upload`)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', data.uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setMovieProgress(set, movieId, { [folder]: Math.round((event.loaded / event.total) * 100) })
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setMovieProgress(set, movieId, { [folder]: 100 })
        resolve(data.url)
      } else {
        reject(new Error(`Failed to upload ${file.name} (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error(`Network error while uploading ${file.name}`))
    xhr.send(file)
  })
}

const createMovie = async (
  set: (partial: Partial<UploadStore> | ((state: UploadStore) => Partial<UploadStore>)) => void,
  movie: MovieDraft
) => {
  setMovieProgress(set, movie.id, { state: 'uploading', error: undefined })

  const [posterUrl, backdropUrl, videoUrl] = await Promise.all([
    movie.posterFile ? uploadFile(set, movie.id, movie.posterFile, 'posters') : Promise.resolve(''),
    movie.backdropFile ? uploadFile(set, movie.id, movie.backdropFile, 'backdrops') : Promise.resolve(''),
    movie.videoFile ? uploadFile(set, movie.id, movie.videoFile, 'videos') : Promise.resolve(''),
  ])

  setMovieProgress(set, movie.id, { state: 'saving' })

  const finalDescription = movie.translator.trim()
    ? `${movie.description.trim()}\n\nTranslator: ${movie.translator.trim()}`
    : movie.description.trim()

  const res = await fetch('/api/admin/movies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: movie.type,
      title: movie.title.trim(),
      slug: movie.slug.trim() || undefined,
      tagline: movie.tagline.trim() || undefined,
      description: finalDescription,
      releaseDate: movie.releaseYear ? `${movie.releaseYear}-01-01T00:00:00Z` : undefined,
      posterUrl: posterUrl || undefined,
      backdropUrl: backdropUrl || undefined,
      videoUrl: videoUrl || undefined,
      externalVideoUrl: movie.externalVideoUrl.trim() || undefined,
      downloadUrl: movie.downloadUrl.trim() || undefined,
      runtimeMinutes: movie.runtimeMinutes || undefined,
      contentRating: movie.contentRating || undefined,
      featured: movie.featured,
      published: movie.published,
      isOldContent: movie.isOldContent,
      genreIds: movie.genreIds,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Failed to create ${movie.title}`)
  setMovieProgress(set, movie.id, { state: 'done' })
}

export const useMovieUploadStore = create<UploadStore>((set, get) => ({
  movies: [createDraft()],
  loading: false,
  error: null,
  success: null,
  progress: {},
  addMovie: () => {
    if (get().movies.length >= MAX_MOVIES || get().loading) return
    set((state) => ({ movies: [...state.movies, createDraft()] }))
  },
  removeMovie: (id) => {
    if (get().loading) return
    set((state) => {
      const nextProgress = { ...state.progress }
      delete nextProgress[id]
      return {
        movies: state.movies.length === 1 ? state.movies : state.movies.filter((movie) => movie.id !== id),
        progress: nextProgress,
      }
    })
  },
  updateMovie: (id, key, value) => {
    if (get().loading && get().progress[id]?.state !== 'error') return
    set((state) => ({
      movies: state.movies.map((movie) => (movie.id === id ? { ...movie, [key]: value } : movie)),
    }))
  },
  toggleGenre: (movieId, genreId) => {
    if (get().loading && get().progress[movieId]?.state !== 'error') return
    set((state) => ({
      movies: state.movies.map((movie) => {
        if (movie.id !== movieId) return movie
        const genreIds = movie.genreIds.includes(genreId)
          ? movie.genreIds.filter((id) => id !== genreId)
          : [...movie.genreIds, genreId]
        return { ...movie, genreIds }
      }),
    }))
  },
  clearMessages: () => set({ error: null, success: null }),
  startUploads: async () => {
    const { movies, loading } = get()
    if (loading) return false

    set({ loading: true, error: null, success: null })

    const invalid = movies.find((movie) => !movie.title.trim() || !movie.description.trim())
    if (invalid) {
      set({ error: 'Every movie needs a title and description before uploading.', loading: false })
      return false
    }

    const pendingMovies = movies.filter((movie) => get().progress[movie.id]?.state !== 'done')

    try {
      const results = await Promise.allSettled(pendingMovies.map((movie) => createMovie(set, movie)))
      const failed = results.filter((result) => result.status === 'rejected')

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          setMovieProgress(set, pendingMovies[index].id, {
            state: 'error',
            error: result.reason instanceof Error ? result.reason.message : 'Upload failed',
          })
        }
      })

      if (failed.length > 0) {
        set({
          error: `${failed.length} item${failed.length === 1 ? '' : 's'} failed. Fix the failed rows and submit again.`,
          loading: false,
        })
        return false
      }

      set({
        success: `Created ${pendingMovies.length} item${pendingMovies.length === 1 ? '' : 's'} successfully.`,
        loading: false,
      })
      return true
    } catch (err: any) {
      set({ error: err.message || 'Upload failed', loading: false })
      return false
    }
  },
}))
