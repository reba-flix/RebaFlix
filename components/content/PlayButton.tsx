'use client'

import { Play } from 'lucide-react'
import { useState } from 'react'

type PlayButtonProps = {
  /** The external video URL to open after recording the view */
  href: string
  /** The content ID to record the view against */
  contentId: string
  /** The type of content determines which API endpoint is called */
  contentType: 'movie' | 'episode'
  /** Optional extra CSS classes */
  className?: string
  /** Button label */
  label?: string
}

/**
 * A "Play" button for external video URLs.
 * When clicked it first POSTs to the play API to count the view,
 * then opens the external URL in a new tab.
 */
export function PlayButton({
  href,
  contentId,
  contentType,
  className,
  label = 'Play',
}: PlayButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)

    const endpoint =
      contentType === 'episode'
        ? `/api/episodes/${contentId}/play`
        : `/api/movies/${contentId}/play`

    try {
      await fetch(endpoint, { method: 'POST' })
    } catch {
      // Silently ignore — still open the video even if tracking fails
    } finally {
      setLoading(false)
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
      type="button"
    >
      <Play className="w-5 h-5 fill-current" />
      {loading ? 'Loading…' : label}
    </button>
  )
}
