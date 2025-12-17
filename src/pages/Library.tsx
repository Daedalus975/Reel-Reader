import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MediaCard } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import type { MediaType } from '../types'

const MEDIA_TYPES: { label: string; type: MediaType | 'all' }[] = [
  { label: 'All', type: 'all' },
  { label: 'Movies', type: 'movie' },
  { label: 'TV Shows', type: 'tv' },
  { label: 'Books', type: 'book' },
  { label: 'Music', type: 'music' },
  { label: 'Podcasts', type: 'podcast' },
]

export const Library: React.FC = () => {
  const { media, filteredMedia, applyFilters, setFilters } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  // Filter out adult content - always exclude it from general library
  const nonAdultMedia = useMemo(() => {
    return media.filter((m) => !m.isAdult)
  }, [media])

  const genres = useMemo(() => {
    const set = new Set<string>()
    nonAdultMedia.forEach((m) => m.genres.forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [nonAdultMedia])

  useEffect(() => {
    setCurrentPage('/library')
  }, [setCurrentPage])

  useEffect(() => {
    setFilters({
      type: selectedType === 'all' ? undefined : (selectedType as MediaType),
      genre: selectedGenre || undefined,
      isFavorite: favoritesOnly ? true : undefined,
      isAdult: false, // Always exclude adult content
    })
    applyFilters()
  }, [selectedType, selectedGenre, favoritesOnly, setFilters, applyFilters])

  const displayMedia = filteredMedia.filter((m) => !m.isAdult)

  return (
    <main className="pt-24 pb-20 px-6 md:px-10 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-light mb-2">My Library</h1>
          <p className="text-gray-400 text-sm">{displayMedia.length} items</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-surface/50 rounded-lg p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-6">
          {MEDIA_TYPES.map((type) => (
            <button
              key={type.label}
              onClick={() => setSelectedType(type.type)}
              className={`px-4 py-2 text-sm font-medium rounded-none transition ${
                selectedType === type.type
                  ? 'bg-primary text-white'
                  : 'bg-dark text-light hover:bg-dark/80 border border-surface'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300" htmlFor="genre-select">
              Genre
            </label>
            <select
              id="genre-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Any</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            Favorites only
          </label>
        </div>
      </div>

      {/* Media Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={(() => {
          const size = useUIStore.getState().mediaCardSize || 'md'
          switch (size) {
            case 'xs':
              return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
            case 'sm':
              return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
            case 'md':
              return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
            case 'lg':
            default:
              return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          }
        })()}
      >
        {displayMedia.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
          >
            <MediaCard media={item} />
          </motion.div>
        ))}
      </motion.div>

      {displayMedia.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No media found matching your filters</p>
        </div>
      )}
    </main>
  )
}

