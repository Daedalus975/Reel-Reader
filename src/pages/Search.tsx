import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaCard, Button } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import type { Media, MediaType } from '../types'
import { getOpenLibraryCoverUrl } from '../services/books'
import { type JAVResult } from '../services/javmeta'
import { searchByType } from '../services/metadata'
import { useProfileStore } from '@store/profileStore'

const MEDIA_TYPES: { label: string; type: MediaType | 'all'; isAdult?: boolean }[] = [
  { label: 'All', type: 'all' },
  { label: 'Movies', type: 'movie' },
  { label: 'TV Shows', type: 'tv' },
  { label: 'Books', type: 'book' },
  { label: 'Music', type: 'music' },
  { label: 'JAV', type: 'jav', isAdult: true },
  { label: 'Doujinshi', type: 'doujinshi', isAdult: true },
]

export const Search: React.FC = () => {
  const { media, filteredMedia, setFilters, applyFilters, addMedia } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const currentProfileId = useProfileStore((s) => s.currentProfileId)
  const profiles = useProfileStore((s) => s.profiles)
  const currentProfile = profiles.find((p) => p.id === currentProfileId)
  const [searchMode, setSearchMode] = useState<'library' | 'online'>('library')
  
  // Online search state
  const [onlineResults, setOnlineResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addedItemNotification, setAddedItemNotification] = useState<{ title: string; path: string } | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'rating' | 'title' | 'dateAdded' | 'popularity'>('relevance')
  const [yearFilter, setYearFilter] = useState<{ min?: number; max?: number }>({})
  const [ratingFilter, setRatingFilter] = useState<number | undefined>()
  const [librarySortBy, setLibrarySortBy] = useState<'dateAdded' | 'year' | 'rating' | 'title'>('dateAdded')
  const navigate = useNavigate()

  const genres = useMemo(() => {
    const set = new Set<string>()
    media.forEach((m) => m.genres.forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [media])

  useEffect(() => {
    setCurrentPage('/search')
  }, [setCurrentPage])

  useEffect(() => {
    if (searchMode === 'library') {
      setFilters({
        searchQuery: query.trim() ? query : undefined,
        type: selectedType === 'all' ? undefined : (selectedType as MediaType),
        genre: selectedGenre || undefined,
        isFavorite: favoritesOnly ? true : undefined,
        isAdult: currentProfile?.adultContentEnabled ? true : false,
      })
      applyFilters()
    }
  }, [query, selectedType, selectedGenre, favoritesOnly, currentProfile, setFilters, applyFilters, searchMode])

  const handleOnlineSearch = async () => {
    if (!query.trim()) return
    
    const searchType = selectedType === 'all' ? (currentProfile?.adultContentEnabled ? 'jav' : 'movie') : selectedType
    const isAdultType = ['jav', 'doujinshi'].includes(searchType)
    // Prevent searching across profile boundaries
    if (isAdultType && !currentProfile?.adultContentEnabled) return
    if (!isAdultType && currentProfile?.adultContentEnabled) return
    
    setIsSearching(true)
    setOnlineResults([])
    
    try {
      const results = await searchByType(searchType as any, query)
      setOnlineResults(results as any[])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFromOnline = async (result: any) => {
    const type = selectedType === 'all' ? 'movie' : (selectedType as MediaType)
    
    let newMedia: Media
    
    switch (type) {
      case 'movie':
      case 'tv': {
        newMedia = {
          id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: result.Title || result.title || 'Unknown',
          type,
          year: result.Year ? parseInt(result.Year) : undefined,
          genres: result.Genre ? result.Genre.split(',').map((g: string) => g.trim()) : [],
          rating: result.imdbRating ? parseFloat(result.imdbRating) : undefined,
          language: 'English',
          poster: result.Poster !== 'N/A' ? result.Poster : undefined,
          description: result.Plot !== 'N/A' ? result.Plot : undefined,
          isAdult: false,
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
          poster: result.cover_i ? getOpenLibraryCoverUrl(result.cover_i) : undefined,
          description: undefined,
          isAdult: false,
          tags: result.author_name || [],
          dateAdded: new Date(),
          isFavorite: false,
        }
        break
      }
      case 'music': {
        let trailerUrl: string | undefined
        try {
          const { searchYouTubeVideo } = await import('../services/youtube')
          const ytQuery = [result.artistName, result.trackName || result.collectionName, 'official music video']
            .filter(Boolean)
            .join(' ')
          const yt = await searchYouTubeVideo(ytQuery)
          if (yt) trailerUrl = yt
        } catch {}
        newMedia = {
          id: `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: result.trackName || result.collectionName || 'Unknown',
          type: 'music',
          year: result.releaseDate ? new Date(result.releaseDate).getFullYear() : undefined,
          genres: result.primaryGenreName ? [result.primaryGenreName] : [],
          language: 'English',
          poster: result.artworkUrl100?.replace('100x100', '600x600'),
          description: result.artistName || undefined,
          trailerUrl,
          previewUrl: result.previewUrl,
          isAdult: false,
          tags: [result.artistName].filter(Boolean),
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
          genres: result.genre || [],
          language: 'Japanese',
          poster: result.image,
          description: undefined,
          isAdult: true,
          tags: result.circle ? [result.circle] : [],
          dateAdded: new Date(),
          isFavorite: false,
        }
        break
      }
      default:
        return
    }
    
    addMedia(newMedia)
    
    // Determine the path based on media type
    let path = '/'
    switch (newMedia.type) {
      case 'movie': path = '/movies'; break
      case 'tv': path = '/tv'; break
      case 'book': path = '/books'; break
      case 'music': path = '/music'; break
      case 'podcast': path = '/podcasts'; break
      case 'jav':
      case 'doujinshi': path = '/adult'; break
    }
    
    setAddedItemNotification({ title: newMedia.title, path })
    setTimeout(() => setAddedItemNotification(null), 5000)
  }

  // Apply sorting and filtering to online results
  const sortedAndFilteredResults = useMemo(() => {
    if (searchMode !== 'online') return []
    
    let filtered = [...onlineResults]
    
    // Apply year filter
    if (yearFilter.min || yearFilter.max) {
      filtered = filtered.filter((r) => {
        const year = r.Year ? parseInt(r.Year) : r.first_publish_year || (r.releaseDate ? new Date(r.releaseDate).getFullYear() : undefined)
        if (!year) return true
        if (yearFilter.min && year < yearFilter.min) return false
        if (yearFilter.max && year > yearFilter.max) return false
        return true
      })
    }
    
    // Apply rating filter (for movies/TV)
    if (ratingFilter && (selectedType === 'movie' || selectedType === 'tv' || selectedType === 'all')) {
      filtered = filtered.filter((r) => {
        const rating = r.imdbRating ? parseFloat(r.imdbRating) : r.vote_average
        return !rating || rating >= ratingFilter
      })
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'year': {
          const yearA = a.Year ? parseInt(a.Year) : a.first_publish_year || (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0)
          const yearB = b.Year ? parseInt(b.Year) : b.first_publish_year || (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0)
          return yearB - yearA
        }
        case 'rating': {
          const ratingA = a.imdbRating ? parseFloat(a.imdbRating) : a.vote_average || 0
          const ratingB = b.imdbRating ? parseFloat(b.imdbRating) : b.vote_average || 0
          return ratingB - ratingA
        }
        case 'title': {
          const titleA = (a.Title || a.title || a.trackName || a.collectionName || '').toLowerCase()
          const titleB = (b.Title || b.title || b.trackName || b.collectionName || '').toLowerCase()
          return titleA.localeCompare(titleB)
        }
        case 'popularity': {
          const popA = a.playcount || a.listeners || a.vote_average || 0
          const popB = b.playcount || b.listeners || b.vote_average || 0
          return popB - popA
        }
        default:
          return 0
      }
    })
    
    return filtered
  }, [onlineResults, sortBy, yearFilter, ratingFilter, searchMode, selectedType])

  // Apply sorting to library results
  const sortedLibraryResults = useMemo(() => {
    if (searchMode !== 'library') return []
    
    let sorted = [...filteredMedia]
    
    // Apply year filter
    if (yearFilter.min || yearFilter.max) {
      sorted = sorted.filter((m) => {
        if (!m.year) return true
        if (yearFilter.min && m.year < yearFilter.min) return false
        if (yearFilter.max && m.year > yearFilter.max) return false
        return true
      })
    }
    
    // Apply rating filter
    if (ratingFilter) {
      sorted = sorted.filter((m) => {
        return !m.rating || m.rating >= ratingFilter
      })
    }
    
    sorted.sort((a, b) => {
      switch (librarySortBy) {
        case 'year':
          return (b.year || 0) - (a.year || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'title':
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        case 'dateAdded':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      }
    })
    
    return sorted
  }, [filteredMedia, librarySortBy, yearFilter, ratingFilter, searchMode])

  const results = searchMode === 'library' ? sortedLibraryResults : []
  const availableTypes = currentProfile?.adultContentEnabled
    ? MEDIA_TYPES.filter(t => t.isAdult)
    : MEDIA_TYPES.filter(t => !t.isAdult)

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-light">Search</h1>
          <p className="text-gray-400 text-sm">
            {searchMode === 'library' ? 'Search your library' : 'Search online databases'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchMode('library')}
            className={`px-4 py-2 text-sm font-medium rounded-none transition ${
              searchMode === 'library' ? 'bg-primary text-white' : 'bg-surface text-light hover:bg-dark'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setSearchMode('online')}
            className={`px-4 py-2 text-sm font-medium rounded-none transition ${
              searchMode === 'online' ? 'bg-primary text-white' : 'bg-surface text-light hover:bg-dark'
            }`}
          >
            Online
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchMode === 'online' && handleOnlineSearch()}
          placeholder={searchMode === 'library' ? 'Search your library...' : 'Search online...'}
          className="flex-1 bg-surface text-light px-4 py-2 text-sm rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {searchMode === 'online' && (
          <Button 
            variant="primary" 
            size="md" 
            onClick={handleOnlineSearch}
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {availableTypes.map((type) => (
          <button
            key={type.label}
            onClick={() => setSelectedType(type.type)}
            className={`px-4 py-2 text-sm font-medium rounded-none transition ${
              selectedType === type.type ? 'bg-primary text-white' : 'bg-surface text-light hover:bg-dark'
            }${type.isAdult ? ' border border-red-500/30' : ''}`}
          >
            {type.label}
            {type.isAdult && <span className="ml-1 text-xs">18+</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        {searchMode === 'library' ? (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Sort by</label>
              <select
                value={librarySortBy}
                onChange={(e) => setLibrarySortBy(e.target.value as any)}
                className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark"
              >
                <option value="dateAdded">Date Added</option>
                <option value="year">Year</option>
                <option value="rating">Rating</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300" htmlFor="search-genre">Genre</label>
              <select
                id="search-genre"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark"
              >
                <option value="">Any</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {(selectedType === 'movie' || selectedType === 'tv' || selectedType === 'all') && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Year</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={yearFilter.min || ''}
                    onChange={(e) => setYearFilter({ ...yearFilter, min: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark w-20"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={yearFilter.max || ''}
                    onChange={(e) => setYearFilter({ ...yearFilter, max: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark w-20"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Min Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="0-10"
                    value={ratingFilter || ''}
                    onChange={(e) => setRatingFilter(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark w-20"
                  />
                </div>
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
              />
              Favorites Only
            </label>
          </>
        ) : (
          <>
            {/* Online search respects profile: adult profile -> adult types only, general profile -> general types only */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark"
              >
                <option value="relevance">Relevance</option>
                <option value="popularity">Popularity</option>
                <option value="year">Year</option>
                <option value="rating">Rating</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
            
            {(!currentProfile?.adultContentEnabled) && (selectedType === 'movie' || selectedType === 'tv' || selectedType === 'all') && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Year</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={yearFilter.min || ''}
                    onChange={(e) => setYearFilter({ ...yearFilter, min: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark w-20"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={yearFilter.max || ''}
                    onChange={(e) => setYearFilter({ ...yearFilter, max: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark w-20"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Min Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="0-10"
                    value={ratingFilter || ''}
                    onChange={(e) => setRatingFilter(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="bg-dark text-light px-3 py-2 text-sm rounded-none border border-dark w-20"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {searchMode === 'library' ? (
        <>
          <p className="text-gray-400 text-sm mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''}
            {results.length !== filteredMedia.length && ` (filtered from ${filteredMedia.length})`}
          </p>

          <div className={(() => {
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
                return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
            }
          })()}>
            {results.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>

          {results.length === 0 && query && (
            <div className="text-center py-12">
              <p className="text-gray-400">No results found</p>
            </div>
          )}
        </>
      ) : (
        <>
          {sortedAndFilteredResults.length > 0 && (
            <p className="text-gray-400 text-sm mb-4">
              {sortedAndFilteredResults.length} result{sortedAndFilteredResults.length !== 1 ? 's' : ''}
              {sortedAndFilteredResults.length !== onlineResults.length && ` (filtered from ${onlineResults.length})`}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAndFilteredResults.map((result, index) => {
              const type = selectedType === 'all' ? 'movie' : selectedType
              let title = ''
              let poster = ''
              let subtitle = ''

              switch (type) {
                case 'movie':
                case 'tv':
                  title = result.Title || 'Unknown'
                  poster = result.Poster !== 'N/A' ? result.Poster : ''
                  subtitle = `${result.Year || 'N/A'} • ${result.Type || ''}`
                  break
                case 'book':
                  title = result.title || 'Unknown'
                  poster = result.cover_i ? (getOpenLibraryCoverUrl(result.cover_i) || '') : (result.cover_url || '')
                  subtitle = result.author_name?.join(', ') || 'Unknown Author'
                  break
                case 'music':
                  title = result.trackName || result.collectionName || 'Unknown'
                  poster = result.artworkUrl100 || ''
                  subtitle = result.artistName || 'Unknown Artist'
                  break
                case 'jav': {
                  const r = result as JAVResult
                  title = r.title || 'Unknown'
                  poster = r.poster || ''
                  subtitle = r.actors?.join(', ') || ''
                  break
                }
                case 'doujinshi':
                  title = result.title || 'Unknown'
                  poster = result.image || ''
                  subtitle = result.circle || ''
                  break
              }

              return (
                <div key={index} className="bg-surface rounded-lg p-4 border border-dark">
                  {poster && (
                    <img 
                      src={poster} 
                      alt={title} 
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="text-light font-semibold text-sm mb-1 line-clamp-2">{title}</h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-1">{subtitle}</p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => { void handleAddFromOnline(result) }}
                  >
                    Add to Library
                  </Button>
                </div>
              )
            })}
          </div>

          {sortedAndFilteredResults.length === 0 && !isSearching && query && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {onlineResults.length > 0 ? 'No results match your filters. Try adjusting your criteria.' : 'No results found. Try searching with different keywords.'}
              </p>
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          )}
        </>
      )}

      {/* Success Notification */}
      {addedItemNotification && (
        <div className="fixed bottom-6 right-6 bg-green-900/90 border border-green-700 text-light px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
          <p className="font-semibold mb-2">✓ Added to Library</p>
          <p className="text-sm text-gray-300 mb-3">"{addedItemNotification.title}"</p>
          <button
            onClick={() => navigate(addedItemNotification.path)}
            className="text-sm text-green-400 hover:text-green-300 underline"
          >
            View in {addedItemNotification.path.replace('/', '').charAt(0).toUpperCase() + addedItemNotification.path.slice(2)}
          </button>
        </div>
      )}
    </main>
  )
}
