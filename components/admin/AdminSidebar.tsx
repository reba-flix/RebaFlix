'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Film, Users, Settings, Activity, Radio, CreditCard, Inbox, Menu, X, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Movies', href: '/admin/movies', icon: Film },
  { name: 'Series', href: '/admin/series', icon: Film },
  { name: 'Channels', href: '/admin/channels', icon: Radio },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Revenue', href: '/admin/revenue', icon: CreditCard },
  { name: 'Support Inbox', href: '/admin/inbox', icon: Inbox },
  { name: 'System Logs', href: '/admin/logs', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 w-full">
      {sidebarLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
              isActive 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.98]"
            )}
          >
            <link.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-[#E50914]" : "text-white/40 group-hover:text-white")} />
            {link.name}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile Toggle Button (Visible only on mobile) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 bg-[#E50914] text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col px-6 fixed bottom-0 top-20 md:top-24 overflow-y-auto border-r border-white/10 bg-black/40 backdrop-blur-md z-10">
        <div className="py-6 w-full">
          <h2 className="text-xs font-bold text-[#E50914] uppercase tracking-wider mb-4 px-2">Admin Panel</h2>
          <NavLinks />
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#111] z-50 p-6 md:hidden overflow-y-auto border-r border-white/10 shadow-2xl"
            >
              <h2 className="text-xs font-bold text-[#E50914] uppercase tracking-wider mb-6 mt-4">Admin Panel</h2>
              <NavLinks />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
