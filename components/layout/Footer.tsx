'use client'

import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Facebook, Instagram, Youtube } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/watch')) return null

  return (
    <footer className="relative bg-[#0a0a0a] text-white/70 pt-20 pb-10 px-4 md:px-8 lg:px-12 border-t border-white/10 mt-auto overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E50914]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-12 lg:gap-8 mb-16">
          {/* Brand & Social */}
          <div className="lg:col-span-4">
            <BrandLogo className="h-10 mb-6" showName />
            <p className="text-sm text-white/60 mb-8 leading-relaxed pr-4">
              RebaFlix is your premium destination for original movies, TV series, documentaries, and exclusive content. Experience entertainment like never before.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/share/14mv2jbufH3/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E50914] hover:text-white transition-all duration-300 group" aria-label="Facebook">
                <Facebook className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </a>
              <a href="https://www.instagram.com/rebaflix?igsh=MWk3ZGFuZzQ1bWk1aw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E50914] hover:text-white transition-all duration-300 group" aria-label="Instagram">
                <Instagram className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </a>
              <a href="https://www.youtube.com/@Rebaflix" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E50914] hover:text-white transition-all duration-300 group" aria-label="Youtube">
                <Youtube className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8 lg:col-start-5">
            <div>
              <h3 className="text-white font-medium mb-6 uppercase tracking-wider text-xs">Explore</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all">Home</Link></li>
                <li><Link href="/browse?type=movie" className="text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all">Movies</Link></li>
                <li><Link href="/browse?type=series" className="text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all">TV Series</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-6 uppercase tracking-wider text-xs">Account</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/profile" className="text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all">My Profile</Link></li>
                <li><Link href="/settings" className="text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all">Settings</Link></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} RebaFlix. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/40">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
