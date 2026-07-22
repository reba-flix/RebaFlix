'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, ChevronDown, Menu, X, User, Heart,
  Clock, LogOut, Settings, Shield, Bookmark, PlayCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse' },
  { href: '/browse?type=series', label: 'TV Series' },
  { href: '/browse?type=movie', label: 'Movies' },
  { href: '/my-list', label: 'My List' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [recentReleases, setRecentReleases] = useState<{
    id: string
    slug: string
    title: string
    posterUrl: string | null
    type: 'movie' | 'series'
    createdAt: string
    updatedAt: string
    latestEpisodeNumber?: number
    partCount?: number
  }[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const { user, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Change navbar background on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    // Fetch recent releases for notifications
    const fetchRecentReleases = async () => {
      try {
        const res = await fetch('/api/recent-releases')
        if (res.ok) {
          const data = await res.json()
          if (data.releases) setRecentReleases(data.releases)
        }
      } catch (err) {
        console.error('Error fetching recent releases', err)
      }
    }
    fetchRecentReleases()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus()
    }
  }, [showSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    setShowUserMenu(false)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  if (pathname?.startsWith('/watch')) return null

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled
            ? 'bg-[#141414]/95 backdrop-blur-md shadow-lg shadow-black/50'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        )}
      >
        <div className="flex items-center justify-between px-4 md:px-8 lg:px-12 h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex flex-shrink-0 items-center" aria-label="RebaFlix home">
              <BrandLogo className="h-12 md:h-14" showName priority />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    pathname === link.href
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {/* Continue Watching — only for signed-in users */}
              {user && (
                <Link
                  href="/continue-watching"
                  prefetch={true}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md transition-all duration-300 text-[#E50914]',
                    pathname === '/continue-watching'
                      ? 'bg-[#E50914]/15'
                      : 'hover:bg-[#E50914]/10'
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#E50914] rounded-full blur-[6px] opacity-80 animate-pulse" />
                    <PlayCircle className="w-4 h-4 text-[#E50914] relative z-10 fill-[#E50914]/20" />
                  </div>
                  Continue Watching
                </Link>
              )}
            </div>

            {/* Mobile Browse Menu */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
              >
                Browse <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.form
                  key="search-form"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '220px', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSearch}
                  className="flex items-center bg-black/80 border border-white/30 rounded-md overflow-hidden"
                >
                  <Search className="w-4 h-4 text-white/60 ml-3 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles..."
                    className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/40 outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowSearch(false); setSearchQuery('') }}
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.button
                  key="search-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-white/80 hover:text-white transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    if (showUserMenu) setShowUserMenu(false)
                  }}
                  className="relative p-2 text-white/80 hover:text-white transition-colors hidden md:block"
                >
                  <Bell className="w-5 h-5" />
                  {recentReleases.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#E50914] rounded-full" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                        <p className="text-sm font-semibold text-white">Notifications</p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {recentReleases.length > 0 ? (
                          recentReleases.map(item => (
                            <Link 
                              key={item.id} 
                              href={item.type === 'movie' ? `/movie/${item.slug}` : `/series/${item.slug}`}
                              onClick={() => setShowNotifications(false)}
                              className="flex gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors items-start"
                            >
                              {item.posterUrl ? (
                                <img src={item.posterUrl} alt={item.title} className="w-14 h-20 object-cover rounded shadow-sm" />
                              ) : (
                                <div className="w-14 h-20 bg-white/10 rounded flex items-center justify-center shrink-0">
                                  <Heart className="w-5 h-5 text-white/40" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-xs font-semibold text-[#E50914] uppercase tracking-wider">
                                    New {item.type}
                                  </p>
                                  <p className="text-[10px] text-white/40 shrink-0">
                                    {formatTimeAgo(item.updatedAt || item.createdAt)}
                                  </p>
                                </div>
                                <p className="text-sm font-medium text-white line-clamp-2 leading-tight">
                                  {item.title}
                                </p>
                                <p className="text-xs text-white/50 mt-1.5">
                                  {item.type === 'movie' && item.partCount && item.partCount > 1
                                    ? `${item.partCount} parts now available.`
                                    : item.type === 'series' && item.latestEpisodeNumber
                                      ? `Episode ${item.latestEpisodeNumber} now available.`
                                      : 'Now available to watch.'}
                                </p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="p-6 text-center">
                            <Bell className="w-8 h-8 text-white/20 mx-auto mb-3" />
                            <p className="text-sm text-white/60">New movies and series will show up here</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User Menu / Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 group"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#E50914] to-[#9f0710] flex items-center justify-center text-white font-bold text-sm">
                    {user.email?.[0].toUpperCase() ?? 'U'}
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-white/60 transition-transform duration-200 hidden md:block',
                    showUserMenu && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        <p className="text-xs text-white/50 mt-0.5">Free Plan</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        {[
                          { href: '/profile', icon: User, label: 'My Profile' },
                          { href: '/my-list', icon: Heart, label: 'My List' },
                          { href: '/continue-watching', icon: Clock, label: 'Continue Watching' },
                          { href: '/my-list?tab=later', icon: Bookmark, label: 'Watch Later' },
                          { href: '/settings', icon: Settings, label: 'Settings' },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </Link>
                        ))}

                        {/* Admin Link */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#E50914] hover:bg-white/5 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-white/10 py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs px-2.5 py-1.5 h-8 sm:text-sm sm:px-3 sm:h-9">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-xs px-2.5 py-1.5 h-8 sm:text-sm sm:px-3 sm:h-9">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#1a1a1a] z-50 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <Link href="/" onClick={() => setShowMobileMenu(false)} aria-label="RebaFlix home">
                  <BrandLogo className="h-12" showName />
                </Link>
                <button onClick={() => setShowMobileMenu(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      'flex items-center px-5 py-3 text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'text-white bg-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {/* Continue Watching in mobile drawer */}
                {user && (
                  <Link
                    href="/continue-watching"
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors text-[#E50914]',
                      pathname === '/continue-watching'
                        ? 'bg-[#E50914]/15'
                        : 'hover:bg-[#E50914]/10'
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#E50914] rounded-full blur-[6px] opacity-80 animate-pulse" />
                      <PlayCircle className="w-4 h-4 text-[#E50914] relative z-10 fill-[#E50914]/20" />
                    </div>
                    Continue Watching
                  </Link>
                )}
              </div>
              {!user && (
                <div className="p-5 border-t border-white/10 flex flex-col gap-2">
                  <Link href="/register" onClick={() => setShowMobileMenu(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                  <Link href="/login" onClick={() => setShowMobileMenu(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Click outside to close menus */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </>
  )
}
