'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Info, Play, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { extractTranslator, stripTranslator } from '@/lib/translator'
import { AnimatePresence, motion } from 'framer-motion'

export type HeroMovie = {
  id: string
  slug?: string
  title?: string
  name?: string
  tagline?: string | null
  description?: string | null
  backdropUrl?: string | null
  posterUrl?: string | null
  averageRating?: number | null
  itemType?: 'movie' | 'series' | 'live'
}

type HeroBannerProps = {
  movies: HeroMovie[]
}

export function HeroBanner({ movies }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Default demo if no movies are provided
  const validMovies = movies?.length > 0 ? movies : [
    {
      id: 'demo',
      slug: 'kigali-nights',
      title: 'Kigali Nights',
      tagline: 'A RebaFlix Original',
      description: 'Original films, series, live channels, documentaries, trailers, and exclusive premieres built for a global audience.',
      backdropUrl: '/hero-backdrop.png',
      averageRating: 4.8,
      itemType: 'movie' as const
    }
  ]

  useEffect(() => {
    if (validMovies.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validMovies.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [validMovies.length])

  const hero = validMovies[currentIndex]
  const title = hero.title ?? hero.name ?? 'Untitled'
  const description = hero.description ?? ''
  const translator = extractTranslator(description)
  const cleanDescription = stripTranslator(description)
  const image = hero.backdropUrl ?? hero.posterUrl ?? '/hero-backdrop.png'
  const isSeries = hero.itemType === 'series'
  
  const watchUrl = isSeries ? `/series/${hero.slug ?? hero.id}` : `/watch/${hero.id}`
  const infoUrl = isSeries ? `/series/${hero.slug ?? hero.id}` : `/movie/${hero.slug ?? hero.id}`

  return (
    <section className="relative min-h-[78vh] overflow-hidden bg-[#141414]">
      <AnimatePresence initial={false}>
        <motion.div
          key={hero.id}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={image}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,#141414_0%,rgba(20,20,20,0.82)_35%,rgba(20,20,20,0.18)_100%)] z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#141414] to-transparent z-10 pointer-events-none" />
      <div className="relative z-20 flex min-h-[78vh] max-w-3xl flex-col justify-end px-4 pb-16 pt-24 md:pb-24 md:pt-32 md:px-8 lg:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${hero.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="new">ORIGINAL</Badge>
              <Badge variant="4k">4K</Badge>
              {hero.averageRating ? (
                <span className="text-sm font-semibold text-white/80">Rated {hero.averageRating.toFixed(1)}</span>
              ) : null}
            </div>
            
            <h1 className="font-display text-4xl font-black leading-none text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {title}
            </h1>
            
            {hero.tagline ? <p className="mt-4 text-lg font-semibold text-white/85">{hero.tagline}</p> : null}
            
            {translator ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90">
                <Languages className="h-4 w-4 text-primary-400" />
                <span className="text-primary-100">{translator}</span>
              </p>
            ) : null}

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75 md:text-lg line-clamp-3">{cleanDescription}</p>
            
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="white">
                <Link href={watchUrl}>
                  <Play className="h-5 w-5 fill-current" />
                  Play
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={infoUrl}>
                  <Info className="h-5 w-5" />
                  More Info
                </Link>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slider Indicators */}
      {validMovies.length > 1 && (
        <div className="absolute bottom-8 left-4 md:left-8 lg:left-12 z-30 flex gap-2">
          {validMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
