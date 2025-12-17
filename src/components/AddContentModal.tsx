import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Plus } from 'lucide-react'
import { useLibraryStore } from '@store/index'
import type { Media, MediaType } from '../types'
import { searchOMDb, getOMDbDetails } from '../services/omdb'
import { getOpenLibraryCoverUrl, searchBooks } from '../services/books'
import { searchMusic } from '../services/music'
import { type JAVResult } from '../services/javmeta'
import { searchByType } from '../services/metadata'
import { Button } from './Button'
import { searchYouTubeVideo } from '../services/youtube'

interface AddContentModalProps {
  isOpen: boolean
  onClose: () => void
  mediaType: MediaType
  isAdult?: boolean
}

type AddMode = 'search' | 'manual'

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  mediaType,
  isAdult = false,
}) => {
  const { addMedia } = useLibraryStore()
  const [mode, setMode] = useState<AddMode>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    title: '',
    year: '',
    genres: '',
    description: '',
    poster: '',
    language: 'English',
    rating: '',
  })

  // Autofill debounce for manual metadata
  const manualDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode('search')
      setSearchQuery('')
      setSearchResults([])
      setManualForm({
        title: '',
        year: '',
        genres: '',
        description: '',
        poster: '',
        language: 'English',
        rating: '',
      })
    }
  }, [isOpen])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    // Prevent overlapping searches
    if (isSearching) return

    setIsSearching(true)
    try {
      const results = await searchByType(mediaType, searchQuery)
      setSearchResults(results as any[])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFromSearch = async (result: any) => {
    let newMedia: Media

    // For movies/TV, fetch full details to include plot/rating and trailer
    let enriched = result
    let trailerUrl: string | undefined
    if (mediaType === 'movie' || mediaType === 'tv') {
      const imdbID = result.imdbID || result.imdbId
      if (imdbID) {
        const details = await getOMDbDetails(imdbID)
        if (details) enriched = details
      }
      // Fetch YouTube trailer from TMDB if we have a TMDB ID
      let tmdbId = result.id || (result.imdbID?.startsWith('tmdb_') ? parseInt(result.imdbID.split('_')[2]) : null)
      if (tmdbId) {
        const { getMovieTrailer, getShowTrailer } = await import('../services/tmdb')
        trailerUrl = mediaType === 'movie' 
          ? await getMovieTrailer(tmdbId) || undefined
          : await getShowTrailer(tmdbId) || undefined
      } else {
        // Fallback: search TMDB by title (and match by year if possible)
        try {
          const { searchTMDB, isMovie, isShow, getMovieTrailer, getShowTrailer } = await import('../services/tmdb')
          const title = enriched.Title || result.Title || ''
          const tmdbType = mediaType === 'movie' ? 'movie' : 'tv'
          const matches = await searchTMDB(title, tmdbType as any)
          const year = (enriched.Year || '').toString().slice(0, 4)
          const best = (matches || []).find((m: any) => {
            const y = (isMovie(m) ? m.release_date : (isShow(m) ? m.first_air_date : '')) || ''
            return year ? y.startsWith(year) : true
          }) || (matches || [])[0]
          if (best?.id) {
            trailerUrl = mediaType === 'movie'
              ? await getMovieTrailer(best.id) || undefined
              : await getShowTrailer(best.id) || undefined
          }
        } catch (e) {
          console.warn('TMDB fallback for trailer failed', e)
        }
      }
    }

    switch (mediaType) {
      case 'movie':
      case 'tv': {
        newMedia = {
          id: `${mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: enriched.Title || result.Title || 'Unknown',
          type: mediaType,
          year: enriched.Year ? parseInt(enriched.Year) : undefined,
          genres: enriched.Genre?.split(', ') || [],
          language: 'English',
          rating: enriched.imdbRating ? parseFloat(enriched.imdbRating) : undefined,
          poster: enriched.Poster !== 'N/A' ? enriched.Poster : result.Poster,
          description: enriched.Plot && enriched.Plot !== 'N/A' ? enriched.Plot : undefined,
          trailerUrl,
          isAdult,
          tags: [],
          dateAdded: new Date(),
          isFavorite: false,
        }
        break
      }
      case 'book': {
        newMedia = {
          id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: result.title || 'Unknown',
          type: 'book',
          year: result.first_publish_year,
          genres: result.subject?.slice(0, 3) || [],
          language: 'English',
          poster: result.cover_i ? getOpenLibraryCoverUrl(result.cover_i) : (result.cover_url || undefined),
          description: undefined,
          isAdult,
          tags: result.author_name || [],
          dateAdded: new Date(),
          isFavorite: false,
        }
        break
      }
      case 'music': {
        // Fallback to iTunes search if preview/artwork missing
        let enriched = result
        if (!result.previewUrl || !result.artworkUrl100) {
          try {
            const { searchMusic } = await import('../services/music')
            const q = [result.artistName, result.trackName || result.collectionName].filter(Boolean).join(' ')
            const itRes = await searchMusic(q || result.trackName || result.collectionName || '')
            if (itRes && itRes[0]) {
              enriched = { ...enriched, ...itRes[0] }
            }
          } catch {}
        }

        let trailerUrl: string | undefined
        try {
          const ytQuery = [enriched.artistName, enriched.trackName || enriched.collectionName, 'official music video']
            .filter(Boolean)
            .join(' ')
          const yt = await searchYouTubeVideo(ytQuery)
          if (yt) trailerUrl = yt
        } catch {}

        newMedia = {
          id: `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: enriched.trackName || enriched.collectionName || 'Unknown',
          type: 'music',
          year: enriched.releaseDate ? new Date(enriched.releaseDate).getFullYear() : undefined,
          genres: enriched.primaryGenreName ? [enriched.primaryGenreName] : [],
          language: 'English',
          poster: enriched.artworkUrl100 ? enriched.artworkUrl100.replace('100x100', '600x600') : undefined,
          description: enriched.artistName || undefined,
          previewUrl: enriched.previewUrl,
          trailerUrl,
          isAdult: false,
          tags: enriched.artistName ? [enriched.artistName] : [],
          dateAdded: new Date(),
          isFavorite: false,
        }
        break
      }
      case 'jav': {
        const r = result as JAVResult
        newMedia = {
          id: r.id || `jav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: r.title || 'Unknown',
          type: 'jav',
          year: r.date ? new Date(r.date).getFullYear() : undefined,
          genres: r.genres || [],
          language: 'Japanese',
          poster: r.poster,
          description: r.description,
          isAdult: true,
          tags: r.actors || [],
          dateAdded: new Date(),
          isFavorite: false,
        }
        break
      }
      case 'doujinshi': {
        newMedia = {
          id: `doujinshi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: result.title || 'Unknown',
          type: 'doujinshi',
          year: result.reg_date ? new Date(result.reg_date).getFullYear() : undefined,
          genres: result.genre || [],
          language: 'Japanese',
          poster: result.work_image,
          description: undefined,
          isAdult: true,
          tags: result.maker_name ? [result.maker_name] : [],
          dateAdded: new Date(),
          isFavorite: false,
        }
        break
      }
      default:
        return
    }

    addMedia(newMedia)
    onClose()
  }

  // As-you-type search suggestions (debounced)
  useEffect(() => {
    if (mode !== 'search') return
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (searchQuery.trim().length < 3) {
      setSearchResults([])
      return
    }
    searchDebounceRef.current = setTimeout(() => {
      handleSearch()
    }, 300)
  }, [searchQuery, mode])

  // Fetch metadata to autofill manual form when title typed
  useEffect(() => {
    if (mode !== 'manual') return
    const title = manualForm.title.trim()
    if (manualDebounceRef.current) clearTimeout(manualDebounceRef.current)
    if (title.length < 3) return
    manualDebounceRef.current = setTimeout(async () => {
      try {
        let result: any | undefined
        if (mediaType === 'movie' || mediaType === 'tv') {
          const omdbType = mediaType === 'tv' ? 'series' : 'movie'
          const res = await searchOMDb(title, omdbType)
          const first = res?.[0]
          if (first?.imdbID) {
            result = await getOMDbDetails(first.imdbID)
          } else {
            result = first
          }
        } else if (mediaType === 'book') {
          const res = await searchBooks(title)
          result = res?.[0]
        } else if (mediaType === 'music') {
          const res = await searchMusic(title)
          result = res?.[0]
        }

        if (!result) return

        setManualForm((prev) => ({
          ...prev,
          year:
            prev.year ||
            (mediaType === 'book'
              ? result.first_publish_year?.toString() ?? ''
              : mediaType === 'music'
              ? (result.releaseDate ? new Date(result.releaseDate).getFullYear().toString() : '')
              : result.Year || ''),
          genres:
            prev.genres ||
            (mediaType === 'movie' || mediaType === 'tv'
              ? (result.Genre ? result.Genre.split(',').map((g: string) => g.trim()).join(', ') : '')
              : mediaType === 'book'
              ? result.subject?.slice(0, 3).join(', ') || ''
              : mediaType === 'music'
              ? result.primaryGenreName || ''
              : ''),
          description:
            prev.description ||
            (mediaType === 'movie' || mediaType === 'tv'
              ? result.Plot && result.Plot !== 'N/A' ? result.Plot : ''
              : mediaType === 'book'
              ? ''
              : ''),
          poster:
            prev.poster ||
            (mediaType === 'movie' || mediaType === 'tv'
              ? (result.Poster !== 'N/A' ? result.Poster : '')
              : mediaType === 'book'
              ? result.cover_i ? getOpenLibraryCoverUrl(result.cover_i) || '' : ''
              : mediaType === 'music'
              ? (result.artworkUrl100 ? result.artworkUrl100.replace('100x100', '600x600') : '')
              : ''),
          rating:
            prev.rating ||
            (mediaType === 'movie' || mediaType === 'tv'
              ? (result.imdbRating ? result.imdbRating.toString() : '')
              : ''),
          language: prev.language || 'English',
        }))
      } catch (err) {
        console.error('Auto metadata fetch failed', err)
      }
    }, 400)
  }, [manualForm.title, mediaType, mode])

  const handleManualAdd = () => {
    if (!manualForm.title.trim()) return

    const newMedia: Media = {
      id: `${mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: manualForm.title,
      type: mediaType,
      year: manualForm.year ? parseInt(manualForm.year) : undefined,
      genres: manualForm.genres ? manualForm.genres.split(',').map((g) => g.trim()) : [],
      language: manualForm.language,
      rating: manualForm.rating ? parseFloat(manualForm.rating) : undefined,
      poster: manualForm.poster || undefined,
      description: manualForm.description || undefined,
      isAdult,
      tags: [],
      dateAdded: new Date(),
      isFavorite: false,
    }

    addMedia(newMedia)
    onClose()
  }

  const getMediaTypeLabel = () => {
    const labels: Partial<Record<MediaType, string>> = {
      movie: 'Movie',
      tv: 'TV Show',
      book: 'Book',
      music: 'Music',
      podcast: 'Podcast',
      jav: 'Adult Movie',
      doujinshi: 'Adult Book',
    }
    return labels[mediaType] || 'Content'
  }

  const getSearchResultDisplay = (result: any) => {
    let title = ''
    let subtitle = ''
    let poster = ''

    switch (mediaType) {
      case 'movie':
      case 'tv':
        title = result.Title || 'Unknown'
        subtitle = `${result.Year || 'N/A'} • ${result.Type || ''}`
        poster = result.Poster !== 'N/A' ? result.Poster : ''
        break
      case 'book':
        title = result.title || 'Unknown'
        subtitle = result.author_name?.join(', ') || 'Unknown Author'
        poster = result.cover_i ? (getOpenLibraryCoverUrl(result.cover_i) || '') : (result.cover_url || '')
        break
      case 'music':
        title = result.trackName || result.collectionName || 'Unknown'
        subtitle = result.artistName || 'Unknown Artist'
        poster = result.artworkUrl100 || ''
        break
      case 'jav': {
        const r = result as JAVResult
        title = r.title || 'Unknown'
        subtitle = r.actors?.join(', ') || 'Unknown'
        poster = r.poster || ''
        break
      }
      case 'doujinshi':
        title = result.title || 'Unknown'
        subtitle = result.maker_name || 'Unknown Circle'
        poster = result.work_image || ''
        break
    }

    return { title, subtitle, poster }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-surface border border-dark rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark">
            <h2 className="text-2xl font-bold text-light">Add {getMediaTypeLabel()}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-light transition p-2 hover:bg-dark rounded"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 px-6 pt-6">
            <button
              onClick={() => setMode('search')}
              className={`px-6 py-2 text-sm font-semibold transition ${
                mode === 'search'
                  ? 'bg-primary text-white'
                  : 'bg-dark text-gray-400 hover:text-light'
              }`}
            >
              <Search size={16} className="inline mr-2" />
              Search Online
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-6 py-2 text-sm font-semibold transition ${
                mode === 'manual'
                  ? 'bg-primary text-white'
                  : 'bg-dark text-gray-400 hover:text-light'
              }`}
            >
              <Plus size={16} className="inline mr-2" />
              Manual Entry
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'search' ? (
              <div className="space-y-6">
                {/* Search Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={`Search for ${getMediaTypeLabel().toLowerCase()}...`}
                    className="flex-1 bg-dark text-light px-4 py-3 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">{searchResults.length} results found</p>
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                      {searchResults.map((result, idx) => {
                        const { title, subtitle, poster } = getSearchResultDisplay(result)
                        return (
                          <div
                            key={idx}
                            className="flex gap-4 bg-dark p-4 border border-surface hover:border-primary transition group"
                          >
                            {poster && (
                              <img
                                src={poster}
                                alt={title}
                                className="w-16 h-24 object-cover bg-surface"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-light font-semibold truncate">{title}</h3>
                              <p className="text-sm text-gray-400 truncate">{subtitle}</p>
                            </div>
                            <Button onClick={() => handleAddFromSearch(result)} size="sm">
                              Add
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-12 text-gray-400">
                    <p>No results found. Try a different search or use manual entry.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.title}
                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                    <input
                      type="number"
                      value={manualForm.year}
                      onChange={(e) => setManualForm({ ...manualForm, year: e.target.value })}
                      className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={manualForm.rating}
                      onChange={(e) => setManualForm({ ...manualForm, rating: e.target.value })}
                      className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="7.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genres (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={manualForm.genres}
                    onChange={(e) => setManualForm({ ...manualForm, genres: e.target.value })}
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Action, Drama, Thriller"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <input
                    type="text"
                    value={manualForm.language}
                    onChange={(e) => setManualForm({ ...manualForm, language: e.target.value })}
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poster
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="url"
                      value={manualForm.poster}
                      onChange={(e) => setManualForm({ ...manualForm, poster: e.target.value })}
                      className="flex-1 bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://..."
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="text-sm text-gray-300"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          setManualForm((prev) => ({ ...prev, poster: reader.result as string }))
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </div>
                  {manualForm.poster && (
                    <div className="mt-2">
                      <img src={manualForm.poster} alt="Poster preview" className="w-24 h-36 object-cover bg-surface" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={manualForm.description}
                    onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary h-24"
                    placeholder="Enter description"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button onClick={onClose} variant="secondary">
                    Cancel
                  </Button>
                  <Button onClick={handleManualAdd} disabled={!manualForm.title.trim()}>
                    Add to Library
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
