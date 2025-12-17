import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Settings, User, ArrowLeft } from 'lucide-react'
import { useUIStore } from '@store/index'

export const HeaderBar: React.FC = () => {
  const { toggleSidebar, currentPage } = useUIStore()
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 left-0 right-0 bg-dark border-b border-surface h-16 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side - Logo and Menu Toggle */}
        <div className="flex items-center gap-2 md:gap-4">
          {currentPage !== '/' && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-surface rounded-none transition"
              aria-label="Go back"
            >
              <ArrowLeft size={22} className="text-light" />
            </button>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-surface rounded-none transition"
          >
            <Menu size={24} className="text-light" />
          </button>
          <Link to="/" className="text-highlight font-bold text-lg tracking-wider">
            REEL READER
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-xs mx-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search media..."
              className="w-full bg-surface text-light px-4 py-2 rounded-none text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Right Side - Icons */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-surface rounded-none transition md:hidden">
            <Search size={20} className="text-light" />
          </button>
          <button className="p-2 hover:bg-surface rounded-none transition relative">
            <Bell size={20} className="text-light" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-highlight rounded-full" />
          </button>
          <Link
            to="/settings"
            className="p-2 hover:bg-surface rounded-none transition"
          >
            <Settings size={20} className="text-light" />
          </Link>
          <Link
            to="/account"
            className="p-2 hover:bg-surface rounded-none transition"
          >
            <User size={20} className="text-light" />
          </Link>
        </div>
      </div>
    </header>
  )
}
