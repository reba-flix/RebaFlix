'use client'

import { useState } from 'react'
import { Heart, Bookmark } from 'lucide-react'
import { ContentGrid } from '@/components/content/ContentGrid'

type Props = {
  favorites: any[]
  watchLater: any[]
  initialTab: string
}

export function MyListTabs({ favorites, watchLater, initialTab }: Props) {
  const [tab, setTab] = useState(initialTab)

  const isLater = tab === 'later'
  const items = isLater ? watchLater : favorites

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-8 border-b border-white/10">
        <button
          onClick={() => setTab('list')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
            !isLater
              ? 'text-white border-[#E50914]'
              : 'text-white/50 border-transparent hover:text-white/80'
          }`}
        >
          <Heart className="w-4 h-4" />
          My List
          {favorites.length > 0 && (
            <span className="ml-1 text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
              {favorites.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('later')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
            isLater
              ? 'text-white border-[#E50914]'
              : 'text-white/50 border-transparent hover:text-white/80'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Watch Later
          {watchLater.length > 0 && (
            <span className="ml-1 text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
              {watchLater.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {items.length > 0 ? (
        <ContentGrid items={items} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-white/40">
          {isLater ? (
            <>
              <Bookmark className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">Nothing saved for later</p>
              <p className="text-sm">
                Browse content and click{' '}
                <span className="text-white/60 font-medium">Watch Later</span> to save it here.
              </p>
            </>
          ) : (
            <>
              <Heart className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">Your list is empty</p>
              <p className="text-sm">
                Add movies and shows to your list to watch them later.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
