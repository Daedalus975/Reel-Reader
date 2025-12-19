import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MediaCard, Button, AddMediaModal } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import { Plus, Settings as SettingsIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export const AdultMovies: React.FC = () => {
  const { media } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    setCurrentPage('/adult/movies')
  }, [setCurrentPage])

  const javMedia = useMemo(() => media.filter((m) => m.type === 'jav' && m.isAdult), [media])

  const genres = useMemo(() => {
    const set = new Set<string>()
    javMedia.forEach((m) => m.genres.forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [javMedia])

  const displayMedia = useMemo(() => {
    let filtered = [...javMedia]
    if (selectedGenre) filtered = filtered.filter((m) => m.genres.includes(selectedGenre))
    if (favoritesOnly) filtered = filtered.filter((m) => m.isFavorite)
    return filtered
  }, [javMedia, selectedGenre, favoritesOnly])

  return (
    <main className="pt-24 pb-20 px-6 md:px-10 lg:px-16">
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔞</span>
          <div>
            <p className="text-red-400 font-semibold">Adult Movies (18+)</p>
            <p className="text-gray-400 text-sm">Mature content intended for adult audiences only.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-light mb-2">Adult Movies</h1>
          <p className="text-gray-400 text-sm">{javMedia.length} movies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} className="inline mr-2" />
            Add Manually
          </Button>
        </div>
      </div>

      {/* Library Settings Link */}
      <div className="mb-6">
        <Link
          to="/library-settings/jav"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
        >
          <SettingsIcon size={16} />
          <span>Library Settings</span>
          <span className="text-xs">→</span>
        </Link>
      </div>

      <div className="bg-surface/50 rounded-lg p-6 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300" htmlFor="genre-select">Genre</label>
            <select
              id="genre-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} className="w-4 h-4 cursor-pointer" />
            Favorites only
          </label>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={(() => {
        const size = useUIStore.getState().mediaCardSize || 'md'
        switch (size) {
          case 'xs':
            return 'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2'
          case 'sm':
            return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
          case 'md':
            return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2'
          case 'lg':
          default:
            return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
        }
      })()}>
        {displayMedia.map((item, idx) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
            <MediaCard media={item} />
          </motion.div>
        ))}
      </motion.div>

      {displayMedia.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No adult movies found</p>
        </div>
      )}

      <AddMediaModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} mediaType={'jav'} />
    </main>
  )
}
