import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MediaCard, Button, AddMediaModal } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import { Grid, List, Settings as SettingsIcon } from 'lucide-react'
import type { Media, MediaType } from '../types'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface MediaTypePageProps {
  type: MediaType
  title: string
  pagePath: string
  onItemClick?: (media: Media, list: Media[]) => void
}

export const MediaTypePage: React.FC<MediaTypePageProps> = ({ type, title, pagePath, onItemClick }) => {
  const { media, setFilters, applyFilters } = useLibraryStore()
  const { setCurrentPage, mediaViewMode = 'grid', mediaCardSize = 'md', setMediaViewMode, setMediaCardSize } = useUIStore()
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortBy, setSortBy] = useState<'title' | 'rating' | 'myRating' | 'dateAdded' | 'releaseDate' | 'custom'>('dateAdded')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [draggedItem, setDraggedItem] = useState<Media | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Filter media by type and exclude adult content
  const typeMedia = useMemo(() => {
    return media.filter((m) => m.type === type && !m.isAdult)
  }, [media, type])

  const genres = useMemo(() => {
    const set = new Set<string>()
    typeMedia.forEach((m) => m.genres.forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [typeMedia])

  const tags = useMemo(() => {
    const set = new Set<string>()
    typeMedia.forEach((m) => m.tags?.forEach((t) => set.add(t)))
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
    if (selectedTag) {
      filtered = filtered.filter((m) => m.tags?.includes(selectedTag))
    }
    if (favoritesOnly) {
      filtered = filtered.filter((m) => m.isFavorite)
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0)
          break
        case 'myRating':
          comparison = (b.myRating || 0) - (a.myRating || 0)
          break
        case 'dateAdded':
          comparison = new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          break
        case 'releaseDate':
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
          comparison = dateB - dateA
          break
        case 'custom':
          // Use custom order from localStorage
          try {
            const orderKey = `custom-order-${type}`
            const savedOrder = localStorage.getItem(orderKey)
            if (savedOrder) {
              const orderIds = JSON.parse(savedOrder) as string[]
              const indexA = orderIds.indexOf(a.id)
              const indexB = orderIds.indexOf(b.id)
              comparison = (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB)
            } else {
              comparison = 0
            }
          } catch {
            comparison = 0
          }
          break
      }
      
      return sortDirection === 'asc' ? -comparison : comparison
    })
    
    return filtered
  }, [typeMedia, selectedGenre, selectedTag, favoritesOnly, sortBy, sortDirection])

  return (
    <main className="pt-24 pb-20 px-6 md:px-10 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-light mb-2">{title}</h1>
          <p className="text-gray-400 text-sm">{displayMedia.length} items</p>
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
          to={`/library-settings/${type}`}
          className="inline-flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
        >
          <SettingsIcon size={16} />
          <span>Library Settings</span>
          <span className="text-xs">→</span>
        </Link>
      </div>

      {/* Filter Controls */}
      <div className="bg-surface/50 rounded-lg p-6 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300" htmlFor="sort-select">
              Sort By
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="dateAdded">Date Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="releaseDate">Release Date</option>
              <option value="rating">Rating</option>
              <option value="myRating">My Rating</option>
              <option value="custom">Custom Order (Drag & Drop)</option>
            </select>
            {sortBy === 'custom' && (
              <span className="text-xs text-primary">💡 Drag cards to reorder</span>
            )}
          </div>
          
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-dark text-light text-sm rounded-none border border-surface hover:border-primary transition"
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
          
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
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300" htmlFor="tag-select">
              Tag
            </label>
            <select
              id="tag-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
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

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-300">View</span>
            <button
              onClick={() => setMediaViewMode('grid')}
              className={`p-2 rounded-none border ${mediaViewMode === 'grid' ? 'border-primary text-primary' : 'border-dark text-gray-300 hover:border-primary/60'}`}
              aria-label="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setMediaViewMode('list')}
              className={`p-2 rounded-none border ${mediaViewMode === 'list' ? 'border-primary text-primary' : 'border-dark text-gray-300 hover:border-primary/60'}`}
              aria-label="List view"
            >
              <List size={16} />
            </button>

            <label className="text-sm text-gray-300 ml-3" htmlFor="card-size-select">
              Size
            </label>
            <select
              id="card-size-select"
              value={mediaCardSize}
              onChange={(e) => setMediaCardSize(e.target.value as 'xs' | 'sm' | 'md' | 'lg')}
              className="bg-dark text-light px-2 py-1 text-sm rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="xs">XS</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={
          mediaViewMode === 'grid'
            ? (
                mediaCardSize === 'xs'
                  ? 'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2'
                  : mediaCardSize === 'sm'
                  ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
                  : mediaCardSize === 'md'
                  ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2'
                  : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
              )
            : 'flex flex-col gap-3'
        }
      >
        {displayMedia.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className={mediaViewMode === 'list' ? 'w-full' : ''}
          >
            <MediaCard
              media={item}
              size={mediaCardSize}
              viewMode={mediaViewMode}
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

      <AddMediaModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mediaType={type}
      />
    </main>
  )
}
