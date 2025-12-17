import React, { useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Film, Music, BookOpen, Clapperboard, Radio, Home, Settings, Users, Search, Upload, User, ShieldAlert } from 'lucide-react'
import { useUIStore } from '@store/index'
import { useProfileStore } from '@store/profileStore'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  isAdult?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: <Home size={20} />, path: '/' },
  { label: 'Search', icon: <Search size={20} />, path: '/search' },
  { label: 'Import', icon: <Upload size={20} />, path: '/import' },
]

const MEDIA_NAV: NavItem[] = [
  { label: 'Movies', icon: <Film size={20} />, path: '/movies' },
  { label: 'TV Shows', icon: <Clapperboard size={20} />, path: '/tv' },
  { label: 'Music', icon: <Music size={20} />, path: '/music' },
  { label: 'Books', icon: <BookOpen size={20} />, path: '/books' },
  { label: 'Podcasts', icon: <Radio size={20} />, path: '/podcasts' },
]

const ADULT_NAV_SPLIT: NavItem[] = [
  { label: 'Adult Movies', icon: <ShieldAlert size={20} />, path: '/adult/movies', isAdult: true },
  { label: 'Adult Books', icon: <ShieldAlert size={20} />, path: '/adult/books', isAdult: true },
]

const BOTTOM_NAV: NavItem[] = [
  { label: 'Profiles', icon: <User size={20} />, path: '/profile' },
  { label: 'Account', icon: <Users size={20} />, path: '/account' },
  { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
]

export const SidebarMenu: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, sidebarEdgeOpenEnabled } = useUIStore()
  const location = useLocation()
  const currentProfileId = useProfileStore((s) => s.currentProfileId)
  const profiles = useProfileStore((s) => s.profiles)
  const currentProfile = profiles.find((p) => p.id === currentProfileId)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const edgeOpenTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isActive = (path: string) => location.pathname === path

  // Auto-minimize on mouse leave (with delay to prevent accidental closes)
  useEffect(() => {
    const handleMouseLeave = () => {
      if (sidebarOpen) {
        hoverTimeoutRef.current = setTimeout(() => {
          setSidebarOpen(false)
        }, 300)
      }
    }

    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
    }

    const sidebar = sidebarRef.current
    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter)
      sidebar.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', handleMouseEnter)
        sidebar.removeEventListener('mouseleave', handleMouseLeave)
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (edgeOpenTimeoutRef.current) {
        clearTimeout(edgeOpenTimeoutRef.current)
      }
    }
  }, [sidebarOpen, setSidebarOpen])

  const handleEdgeEnter = () => {
    if (!sidebarEdgeOpenEnabled || sidebarOpen) return
    setSidebarOpen(true)
  }

  const handleEdgeLeave = () => {
    if (edgeOpenTimeoutRef.current) {
      clearTimeout(edgeOpenTimeoutRef.current)
      edgeOpenTimeoutRef.current = null
    }
  }

  return (
    <>
      {/* Edge hover trigger for auto-open (desktop only) */}
      <div
        className="fixed left-0 top-16 bottom-0 w-8 z-30 hidden md:block hover:bg-primary/10 transition-colors"
        onMouseEnter={handleEdgeEnter}
        onMouseLeave={handleEdgeLeave}
        title="Hover to open menu"
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 md:hidden z-30"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-16 bottom-0 w-72 bg-surface border-r border-dark overflow-y-auto z-40"
      >
        <nav className="h-full flex flex-col p-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-none transition ${
                  isActive(item.path)
                    ? 'bg-primary text-light'
                    : 'text-gray-300 hover:bg-dark hover:text-light'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-dark my-4" />

          {/* Media Library Section */}
          <div className="space-y-2">
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Library</span>
            </div>
            {(currentProfile && currentProfile.adultContentEnabled ? ADULT_NAV_SPLIT : MEDIA_NAV).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-none transition ${
                  isActive(item.path)
                    ? 'bg-primary text-light'
                    : 'text-gray-300 hover:bg-dark hover:text-light'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Show adult banner section only for general profiles? Removed; adult library replaces media nav when adult profile is active */}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Divider */}
          <div className="h-px bg-dark my-4" />

          {/* Bottom Navigation */}
          <div className="space-y-2">
            {BOTTOM_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-none transition ${
                  isActive(item.path)
                    ? 'bg-primary text-light'
                    : 'text-gray-300 hover:bg-dark hover:text-light'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </motion.aside>
    </>
  )
}
