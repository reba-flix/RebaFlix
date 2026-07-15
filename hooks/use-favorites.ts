'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setFavorites([])
      return
    }

    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          setFavorites(data.map((f: { movieId: string }) => f.movieId))
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }

    fetchFavorites()
  }, [user])

  const toggleFavorite = async (movieId: string) => {
    if (!user) return

    const isFavorited = favorites.includes(movieId)
    setLoading(true)

    try {
      if (isFavorited) {
        await fetch(`/api/favorites/${movieId}`, { method: 'DELETE' })
        setFavorites(prev => prev.filter(id => id !== movieId))
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId }),
        })
        setFavorites(prev => [...prev, movieId])
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFavorited = (movieId: string) => favorites.includes(movieId)

  return { favorites, isFavorited, toggleFavorite, loading }
}
