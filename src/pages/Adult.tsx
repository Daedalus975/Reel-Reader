import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MediaCard, Button, AddContentModal } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import { Plus } from 'lucide-react'

type AdultSection = 'movies' | 'books'

export const Adult: React.FC = () => {
  const { media } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const [selectedSection, setSelectedSection] = useState<AdultSection>('movies')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    setCurrentPage('/adult')
  }, [setCurrentPage])

  // Get JAV (adult movies)
  const javMedia = useMemo(() => {
    return media.filter((m) => m.type === 'jav' && m.isAdult)
  }, [media])

  // Get Doujinshi (adult books)
  const doujinshiMedia = useMemo(() => {
    return media.filter((m) => m.type === 'doujinshi' && m.isAdult)
  }, [media])

  // Current section media
  const currentMedia = useMemo(() => {
    return selectedSection === 'movies' ? javMedia : doujinshiMedia
  }, [selectedSection, javMedia, doujinshiMedia])

  // Get genres for current section
  const genres = useMemo(() => {
    const set = new Set<string>()
    currentMedia.forEach((m) => m.genres.forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [currentMedia])

  // Apply filters
  const displayMedia = useMemo(() => {
    let filtered = [...currentMedia]
    if (selectedGenre) {
      filtered = filtered.filter((m) => m.genres.includes(selectedGenre))
    }
    if (favoritesOnly) {
      filtered = filtered.filter((m) => m.isFavorite)
    }
    return filtered
  }, [currentMedia, selectedGenre, favoritesOnly])

  // Reset genre filter when switching sections
  useEffect(() => {
    setSelectedGenre('')
  }, [selectedSection])

  return (
    <main className="pt-24 pb-20 px-6 md:px-10 lg:px-16">
      {/* Age Warning Banner */}
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔞</span>
          <div>
            <p className="text-red-400 font-semibold">Adult Content (18+)</p>
            <p className="text-gray-400 text-sm">This section contains mature content intended for adult audiences only.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-light mb-2">Adult Content</h1>
          <p className="text-gray-400 text-sm">
            {selectedSection === 'movies' ? `${javMedia.length} movies` : `${doujinshiMedia.length} books`}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={18} className="inline mr-2" />
          Add {selectedSection === 'movies' ? 'Adult Movie' : 'Adult Book'}
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setSelectedSection('movies')}
          className={`px-6 py-3 text-sm font-semibold transition ${
            selectedSection === 'movies'
              ? 'bg-primary text-white'
              : 'bg-surface text-gray-400 hover:bg-dark hover:text-light'
          }`}
        >
          Adult Movies ({javMedia.length})
        </button>
        <button
          onClick={() => setSelectedSection('books')}
          className={`px-6 py-3 text-sm font-semibold transition ${
            selectedSection === 'books'
              ? 'bg-primary text-white'
              : 'bg-surface text-gray-400 hover:bg-dark hover:text-light'
          }`}
        >
          Adult Books ({doujinshiMedia.length})
        </button>
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
            <MediaCard media={item} />
          </motion.div>
        ))}
      </motion.div>

      {displayMedia.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            No {selectedSection === 'movies' ? 'adult movies' : 'adult books'} found
          </p>
        </div>
      )}

      <AddContentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mediaType={selectedSection === 'movies' ? 'jav' : 'doujinshi'}
        isAdult={true}
      />
    </main>
  )
}
