'use client'

import { useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addEpisodeToSeries } from './actions'

type Props = {
  seriesId: string
  defaultSeasonNumber?: number
  defaultEpisodeNumber?: number
}

export function AddEpisodeForm({ seriesId, defaultSeasonNumber = 1, defaultEpisodeNumber }: Props) {
  const [state, formAction, isPending] = useActionState(addEpisodeToSeries, null)

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 sticky top-24">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-[#E50914]" />
        Add / Update Episode
      </h2>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          ⚠️ {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="seriesId" value={seriesId} />

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Season Number
          </label>
          <input
            type="number"
            name="seasonNumber"
            required
            min="1"
            defaultValue={defaultSeasonNumber}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Episode Number
          </label>
          <input
            type="number"
            name="episodeNumber"
            required
            min="1"
            defaultValue={defaultEpisodeNumber}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Episode Title
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. The Beginning"
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Video URL
          </label>
          <input
            type="url"
            name="videoUrl"
            required
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#E50914] hover:bg-[#b80710] text-white mt-2 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Add / Update Episode'}
        </Button>
        <p className="text-xs text-white/30 text-center">
          If the episode number already exists, it will be updated.
        </p>
      </form>
    </div>
  )
}
