'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WatchLaterButton({ movieId }: { movieId: string }) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (!saved) {
        const res = await fetch('/api/watch-later', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId }),
        })
        if (res.ok) setSaved(true)
        else if (res.status === 401) window.location.href = '/login'
      } else {
        setSaved(false)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      variant="secondary"
      onClick={handleClick}
      disabled={loading}
      className={saved ? 'bg-white/20 text-white' : ''}
    >
      <Bookmark className={`h-5 w-5 mr-2 ${saved ? 'fill-current' : ''}`} />
      {saved ? 'Saved for Later' : 'Watch Later'}
    </Button>
  )
}
