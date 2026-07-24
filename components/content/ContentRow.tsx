'use client'

import { useRef, useState } from 'react'
import { MediaCard } from '@/components/content/MediaCard'
import { demoPosters } from '@/lib/catalog'
import { extractTranslator } from '@/lib/translator'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type RowItem = {
  id?: string
  slug?: string
  title?: string
  name?: string
  posterUrl?: string | null
  logoUrl?: string | null
  averageRating?: number | null
  description?: string | null
  translator?: string | null
  itemType?: 'movie' | 'series' | 'live'
  genres?: Array<{ genre: { name: string } }>
  seasons?: Array<{ _count?: { episodes?: number }; episodes?: Array<{ number?: number | null }> }>
  parts?: Array<unknown>
  _count?: { seasons?: number }
  episodeCount?: number
  latestEpisodeNumber?: number
  partCount?: number
  videoUrl?: string | null
  releaseDate?: string | Date | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

type ContentRowProps = {
  title: string
  items: RowItem[]
  type?: 'movie' | 'series' | 'live'
}

export function ContentRow({ title, items, type = 'movie' }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  if (!items.length) return null

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth + 100 : scrollLeft + clientWidth - 100
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  return (
    <section
      className="space-y-4 px-4 md:px-8 lg:px-12 relative group/row"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 className="font-display text-xl font-bold text-white md:text-2xl">{title}</h2>

      <div className="relative">
        <div ref={rowRef} className="scrollbar-hide flex gap-3 overflow-x-auto pb-5 pt-1">
          {items.map((item, index) => {
            const cardType = item.itemType ?? type

            // Extract genre names
            const genreNames = item.genres?.map(g => g.genre.name) ?? []

            // Calculate the latest episode number for series
            let latestEpisodeNumber: number | undefined = undefined
            if (cardType === 'series') {
              if (item.latestEpisodeNumber !== undefined) {
                latestEpisodeNumber = item.latestEpisodeNumber
              } else if (item.seasons) {
                latestEpisodeNumber = item.seasons.reduce((max, season) => {
                  const seasonMax = season.episodes?.reduce((episodeMax, episode) => {
                    return Math.max(episodeMax, Number(episode.number) || 0)
                  }, 0) ?? season._count?.episodes ?? 0
                  return Math.max(max, seasonMax)
                }, 0)
              }
            }
            const partCount = cardType === 'movie'
              ? item.partCount ?? ((item.parts?.length ?? 0) + (item.videoUrl ? 1 : 0))
              : undefined

            return (
              <MediaCard
                key={item.id ?? item.slug ?? `${title}-${index}`}
                id={item.id}
                slug={item.slug}
                title={item.title ?? item.name ?? 'Untitled'}
                image={item.posterUrl ?? item.logoUrl ?? demoPosters[index % demoPosters.length]}
                type={cardType}
                rating={item.averageRating}
                translator={item.translator ?? extractTranslator(item.description)}
                genres={genreNames}
                latestEpisodeNumber={latestEpisodeNumber}
                partCount={partCount}
                releaseYear={item.releaseDate ? new Date(item.releaseDate).getFullYear() : (item.createdAt ? new Date(item.createdAt).getFullYear() : undefined)}
              />
            )
          })}
        </div>

        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          className={`absolute left-0 top-0 bottom-5 z-20 flex w-12 items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 hover:bg-black/70 ${isHovered ? 'md:opacity-100' : ''}`}
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          className={`absolute right-0 top-0 bottom-5 z-20 flex w-12 items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 hover:bg-black/70 ${isHovered ? 'md:opacity-100' : ''}`}
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      </div>
    </section>
  )
}
