import Image from 'next/image'

import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  showName?: boolean
  priority?: boolean
}

export function BrandLogo({ className, showName = false, priority = false }: BrandLogoProps) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="relative block aspect-square h-full">
        <Image
          src="/logo-reba2.png"
          alt="RebaFlix"
          fill
          priority={priority}
          sizes="(max-width: 768px) 48px, 64px"
          className="object-contain"
        />
      </span>
      {showName ? (
        <span
          className="text-2xl font-black uppercase tracking-wide md:text-4xl"
          style={{ fontFamily: 'var(--font-archivo-black), sans-serif', letterSpacing: '0.04em' }}
        >
          <span className="text-[#E50914]">REBA</span>
          <span className="text-white">FLIX</span>
        </span>
      ) : null}
    </span>
  )
}
