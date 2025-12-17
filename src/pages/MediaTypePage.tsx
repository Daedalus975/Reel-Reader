import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MediaCard, Button, AddContentModal } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import type { Media, MediaType } from '../types'
import { Plus } from 'lucide-react'

interface MediaTypePageProps {
  type: MediaType
  title: string
  pagePath: string
  onItemClick?: (media: Media, list: Media[]) => void
}

export const MediaTypePage: React.FC<MediaTypePageProps> = ({ type, title, pagePath, onItemClick }) => {
  const { media, setFilters, applyFilters } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Filter media by type and exclude adult content
  const typeMedia = useMemo(() => {
    return media.filter((m) => m.type === type && !m.isAdult)
  }, [media, type])

  const genres = useMemo(() => {
    const set = new Set<string>()
    typeMedia.forEach((m) => m.genres.forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [typeMedia])

  useEffect(() => {
    setCurrentPage(pagePath)
  }, [setCurrentPage, pagePath])

  useEffect(() => {
    setFilters({
      type,
      genre: selectedGenre || undefined,
      isFavorite: favoritesOnly ? true : undefined,
      isAdult: false, // Always exclude adult content
    })
    applyFilters()
  }, [type, selectedGenre, favoritesOnly, setFilters, applyFilters])

  const displayMedia = useMemo(() => {
    let filtered = [...typeMedia]
    if (selectedGenre) {
      filtered = filtered.filter((m) => m.genres.includes(selectedGenre))
    }
    if (favoritesOnly) {
      filtered = filtered.filter((m) => m.isFavorite)
    }
    return filtered
  }, [typeMedia, selectedGenre, favoritesOnly])

  return (
    <main className="pt-24 pb-20 px-6 md:px-10 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-light mb-2">{title}</h1>
          <p className="text-gray-400 text-sm">{displayMedia.length} items</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={18} className="inline mr-2" />
          Add {title}
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="bg-surface/50 rounded-lg p-6 mb-8">
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
              <option value="">All Genres</option>
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
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      >
        {displayMedia.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
          >
            <MediaCard
              media={item}
              onClick={onItemClick ? () => onItemClick(item, displayMedia) : undefined}
            />
          </motion.div>
        ))}
      </motion.div>

      {displayMedia.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No {title.toLowerCase()} found</p>
        </div>
      )}

      <AddContentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mediaType={type}
        isAdult={false}
      />
    </main>
  )
}
