import { MediaCard } from './MediaCard'
import { extractTranslator } from '@/lib/translator'

type ContentGridProps = {
  items: any[]
}

export function ContentGrid({ items }: ContentGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
      {items.map((item) => {
        const type = item.type ?? (item.seasons ? 'series' : ('videoUrl' in item ? 'movie' : 'series'))
        const latestEpisodeNumber = type === 'series' && item.seasons
          ? item.seasons.reduce((max: number, season: any) => {
              const seasonMax = season.episodes?.reduce((episodeMax: number, episode: any) => {
                return Math.max(episodeMax, Number(episode.number) || 0)
              }, 0) ?? 0
              return Math.max(max, seasonMax)
            }, 0)
          : undefined
        const partCount = type === 'movie'
          ? item.partCount ?? ((item.parts?.length ?? 0) + (item.videoUrl ? 1 : 0))
          : undefined

        return (
          <MediaCard
            key={item.id}
            id={item.id}
            slug={item.slug}
            title={item.title}
            image={item.posterUrl}
            type={type}
            rating={item.averageRating}
            translator={item.translator ?? extractTranslator(item.description)}
            latestEpisodeNumber={latestEpisodeNumber}
            partCount={partCount}
            releaseYear={item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined}
          />
        )
      })}
    </div>
  )
}
