import { MediaCard } from './MediaCard'
import { extractTranslator } from '@/lib/translator'

type ContentGridProps = {
  items: any[]
}

export function ContentGrid({ items }: ContentGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
      {items.map((item) => (
        <MediaCard 
          key={item.id} 
          id={item.id}
          slug={item.slug}
          title={item.title}
          image={item.posterUrl}
          type={item.type ?? (item.seasons ? 'series' : ('videoUrl' in item ? 'movie' : 'series'))}
          rating={item.averageRating}
          translator={item.translator ?? extractTranslator(item.description)}
        />
      ))}
    </div>
  )
}
