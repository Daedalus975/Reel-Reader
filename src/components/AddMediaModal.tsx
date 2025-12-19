import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Link as LinkIcon, Plus } from 'lucide-react'
import { Button } from './Button'
import type { MediaType } from '../types'
import { useLibraryStore } from '@store/index'
import { useCustomFieldsStore } from '../store/customFieldsStore'
import { searchOMDb, getPosterUrl as getOmdbPosterUrl, parseRating, parseGenres, parseYear, getOMDbDetails, type OMDbResult } from '../services/omdb'
import { searchBooks, getOpenLibraryCoverUrl, getBookByISBN, extractISBN, type OpenLibraryDoc } from '../services/books'
import { searchMusic, getArtworkUrlLarge, type ITunesResult } from '../services/music'
import { searchJAV, type FanzaItem } from '../services/fanza'
import { searchDoujinshi, type DlsiteWork } from '../services/dlsite'
import { importDoujinFromUrl } from '../services/doujin'

type SearchResultCard = {
  id: string
  title: string
  subtitle?: string
  poster?: string
  description?: string
  source: 'omdb' | 'books' | 'music' | 'fanza' | 'dlsite'
  payload: OMDbResult | OpenLibraryDoc | ITunesResult | FanzaItem | DlsiteWork
}

type AddMode = 'search' | 'url' | 'code' | 'manual'

interface AddMediaModalProps {
  isOpen: boolean
  onClose: () => void
  mediaType: MediaType
}

export const AddMediaModal: React.FC<AddMediaModalProps> = ({ isOpen, onClose, mediaType }) => {
  const { addMedia } = useLibraryStore()
  const { getFieldsForMediaType, getCategoriesForMediaType } = useCustomFieldsStore()
  const [mode, setMode] = useState<AddMode>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [url, setUrl] = useState('')
  const [javCode, setJavCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultCard[]>([])
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Get custom fields for current media type
  const customFields = useMemo(() => getFieldsForMediaType(mediaType), [mediaType, getFieldsForMediaType])
  const tagCategories = useMemo(() => getCategoriesForMediaType(mediaType), [mediaType, getCategoriesForMediaType])

  // Manual entry fields
  const [manualForm, setManualForm] = useState({
    title: '',
    year: '',
    genres: '',
    description: '',
    poster: '',
    language: 'English',
    rating: '',
  })
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode('search')
      setSearchQuery('')
      setUrl('')
      setJavCode('')
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
      setCustomFieldValues({})
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    }
  }, [isOpen])

  // Auto-search as user types with debounce
  useEffect(() => {
    if (mode === 'search' && searchQuery.trim().length >= 3) {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
      const timer = setTimeout(() => {
        handleSearch()
      }, 600)
      setSearchDebounceTimer(timer)
    } else if (searchQuery.trim().length < 3) {
      setSearchResults([])
    }
    return () => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, mode])

  const getMediaTypeLabel = () => {
    switch (mediaType) {
      case 'movie': return 'Movie'
      case 'tv': return 'TV Show'
      case 'book': return 'Book'
      case 'music': return 'Music'
      case 'podcast': return 'Podcast'
      case 'jav': return 'JAV'
      case 'doujinshi': return 'Doujinshi'
      default: return 'Media'
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setSearchResults([])
    
    try {
      let cards: SearchResultCard[] = []
      
      if (mediaType === 'movie' || mediaType === 'tv') {
        const omdbType = mediaType === 'tv' ? 'series' : 'movie'
        const results = await searchOMDb(searchQuery.trim(), omdbType)
        cards = results.map((r) => ({
          id: r.imdbID,
          title: r.Title,
          subtitle: `${r.Year} • ${r.Type.toUpperCase()}`,
          poster: getOmdbPosterUrl(r.Poster),
          description: r.Plot,
          source: 'omdb' as const,
          payload: r,
        }))
      } else if (mediaType === 'book') {
        const results = await searchBooks(searchQuery.trim())
        cards = results.map((d) => ({
          id: d.key,
          title: d.title,
          subtitle: `${d.first_publish_year ?? ''} • ${d.author_name?.[0] ?? ''}`.trim(),
          poster: getOpenLibraryCoverUrl(d.cover_i),
          description: d.subject?.slice(0, 5).join(', '),
          source: 'books' as const,
          payload: d,
        }))
      } else if (mediaType === 'music') {
        const results = await searchMusic(searchQuery.trim(), 'album')
        cards = results.map((m) => ({
          id: String(m.collectionId ?? m.trackId ?? Math.random()),
          title: m.collectionName || m.trackName || 'Unknown',
          subtitle: m.artistName,
          poster: getArtworkUrlLarge(m.artworkUrl100),
          description: m.primaryGenreName,
          source: 'music' as const,
          payload: m,
        }))
      } else if (mediaType === 'jav') {
        const results = await searchJAV(searchQuery.trim())
        cards = results.map((j) => ({
          id: j.content_id,
          title: j.title,
          subtitle: `${j.iteminfo?.maker?.[0]?.name ?? ''}`.trim(),
          poster: j.imageURL?.large,
          description: j.iteminfo?.actress?.map((a) => a.name).join(', '),
          source: 'fanza' as const,
          payload: j,
        }))
      } else if (mediaType === 'doujinshi') {
        const results = await searchDoujinshi(searchQuery.trim())
        cards = results.map((w) => ({
          id: w.workno,
          title: w.title,
          subtitle: w.maker_name,
          poster: w.work_image,
          description: w.genre?.join(', '),
          source: 'dlsite' as const,
          payload: w,
        }))
      }
      
      setSearchResults(cards)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFromSearch = (result: SearchResultCard) => {
    const now = new Date()
    
    if (result.source === 'omdb') {
      const data = result.payload as OMDbResult
      addMedia({
        id: `${now.getTime()}-${Math.random()}`,
        title: data.Title,
        type: data.Type === 'series' ? 'tv' : 'movie',
        year: parseYear(data.Year),
        genres: parseGenres(data.Genre),
        language: 'EN',
        rating: parseRating(data.imdbRating),
        poster: getOmdbPosterUrl(data.Poster),
        backdrop: undefined,
        description: data.Plot,
        isAdult: false,
        tags: [],
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
    } else if (result.source === 'books') {
      const data = result.payload as OpenLibraryDoc
      addMedia({
        id: `${now.getTime()}-${Math.random()}`,
        title: data.title,
        type: 'book',
        year: data.first_publish_year,
        genres: data.subject?.slice(0, 3) ?? [],
        language: 'EN',
        poster: getOpenLibraryCoverUrl(data.cover_i),
        authors: data.author_name?.[0] ? [data.author_name[0]] : [],
        description: data.subject?.join(', '),
        isAdult: false,
        tags: [],
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
    } else if (result.source === 'music') {
      const data = result.payload as ITunesResult
      addMedia({
        id: `${now.getTime()}-${Math.random()}`,
        title: data.collectionName || data.trackName || 'Unknown',
        type: 'music',
        year: data.releaseDate ? new Date(data.releaseDate).getFullYear() : undefined,
        genres: data.primaryGenreName ? [data.primaryGenreName] : [],
        language: 'EN',
        poster: getArtworkUrlLarge(data.artworkUrl100),
        artist: data.artistName,
        album: data.collectionName,
        isAdult: false,
        tags: [],
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
    } else if (result.source === 'fanza') {
      const jav = result.payload as FanzaItem
      addMedia({
        id: `${now.getTime()}-${Math.random()}`,
        title: jav.title,
        type: 'jav',
        genres: jav.iteminfo?.genre?.map((g) => g.name) || [],
        language: 'JA',
        poster: jav.imageURL?.large,
        description: jav.iteminfo?.actress?.map((a) => a.name).join(', '),
        isAdult: true,
        tags: jav.iteminfo?.actress?.map((a) => a.name) || [],
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
    } else if (result.source === 'dlsite') {
      const work = result.payload as DlsiteWork
      addMedia({
        id: `${now.getTime()}-${Math.random()}`,
        title: work.title,
        type: 'doujinshi',
        genres: work.genre || [],
        language: 'JA',
        poster: work.work_image,
        description: work.genre?.join(', '),
        isAdult: true,
        tags: [],
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
    }
    
    onClose()
  }

  const handleAddFromUrl = async () => {
    if (!url.trim()) return
    
    const trimmedUrl = url.trim()
    
    // Handle Books - ISBN or URL
    if (mediaType === 'book') {
      const isbn = extractISBN(trimmedUrl)
      
      if (isbn) {
        try {
          const book = await getBookByISBN(isbn)
          if (book) {
            const now = new Date()
            addMedia({
              id: `${now.getTime()}-${Math.random()}`,
              title: book.title,
              type: 'book',
              year: book.first_publish_year,
              genres: book.subject?.slice(0, 3) ?? [],
              language: 'EN',
              poster: getOpenLibraryCoverUrl(book.cover_i),
              authors: book.author_name?.[0] ? [book.author_name[0]] : [],
              description: book.subject?.join(', '),
              isbn: isbn,
              isAdult: false,
              tags: [],
              watched: false,
              isFavorite: false,
              dateAdded: now,
            })
            onClose()
            return
          }
        } catch (error) {
          console.error('Failed to fetch book by ISBN:', error)
          alert('Failed to import book. Please check the ISBN or try searching instead.')
          return
        }
      }
    }
    
    // Handle Movies/TV - IMDb URL or ID
    if (mediaType === 'movie' || mediaType === 'tv') {
      let imdbId = trimmedUrl
      
      // Extract IMDb ID from URL if needed
      const imdbUrlMatch = trimmedUrl.match(/imdb\.com\/title\/(tt\d+)/)
      if (imdbUrlMatch) {
        imdbId = imdbUrlMatch[1]
      }
      
      // Validate IMDb ID format
      if (imdbId.match(/^tt\d+$/)) {
        try {
          const details = await getOMDbDetails(imdbId)
          if (details) {
            const now = new Date()
            addMedia({
              id: `${now.getTime()}-${Math.random()}`,
              title: details.Title,
              type: details.Type === 'series' ? 'tv' : 'movie',
              year: parseYear(details.Year),
              genres: parseGenres(details.Genre),
              language: 'EN',
              rating: parseRating(details.imdbRating),
              poster: getOmdbPosterUrl(details.Poster),
              description: details.Plot,
              isAdult: false,
              tags: [],
              watched: false,
              isFavorite: false,
              dateAdded: now,
            })
            onClose()
            return
          }
        } catch (error) {
          console.error('Failed to fetch from IMDb:', error)
          alert('Failed to import from IMDb. Please check the ID or try searching instead.')
          return
        }
      }
    }
    
    // Try to import from nhentai/hitomi
    if (mediaType === 'doujinshi' && (trimmedUrl.includes('nhentai.net') || trimmedUrl.includes('hitomi.la'))) {
      try {
        console.log('Importing doujinshi from URL:', trimmedUrl)
        const imported = await importDoujinFromUrl(trimmedUrl)
        console.log('Import result:', imported)
        
        if (imported) {
          const now = new Date()
          addMedia({
            id: `${now.getTime()}-${Math.random()}`,
            title: imported.title,
            originalTitle: imported.titleJapanese,
            type: 'doujinshi',
            year: imported.year,
            genres: imported.tags || [],
            language: imported.languages?.[0]?.toUpperCase() || 'JA',
            poster: imported.cover,
            description: imported.description,
            isAdult: true,
            tags: imported.tags || [],
            watched: false,
            isFavorite: false,
            dateAdded: now,
            // Doujinshi-specific fields
            galleryId: imported.id,
            authors: imported.artists || [],
            parodies: imported.parodies || [],
            characters: imported.characters || [],
            groups: imported.groups || [],
            doujinLanguages: imported.languages || [],
            doujinCategories: imported.categories || [],
            pageCount: imported.pages,
            favoriteCount: imported.favorites,
            uploadedAt: imported.uploadDate,
          })
          onClose()
          return
        } else {
          console.error('Import returned null')
          alert('Failed to import from this URL. This may be due to:\n\n1. CORS restrictions - nhentai.net blocks browser requests\n2. Invalid URL format\n3. Gallery not found\n\nTip: Configure VITE_CORS_PROXY in your .env file to enable imports.\nExample proxy: https://corsproxy.io/?')
          return
        }
      } catch (error) {
        console.error('Failed to import doujinshi:', error)
        alert('Failed to import from this URL. Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
        return
      }
    }
    
    // Generic error message based on media type
    const errorMessage = 
      mediaType === 'movie' || mediaType === 'tv' 
        ? 'Could not import. Supported formats:\n- IMDb URL: imdb.com/title/tt1234567\n- IMDb ID: tt1234567'
        : mediaType === 'book'
        ? 'Could not import. Supported formats:\n- ISBN-10: 0123456789\n- ISBN-13: 978-0123456789\n- ISBN with dashes: 978-0-12-345678-9'
        : mediaType === 'doujinshi'
        ? 'Could not import. Supported formats:\n- nhentai.net/g/123456\n- hitomi.la/galleries/123456.html\n\nNote: Requires CORS proxy configured in .env'
        : 'Import from URL not yet supported for this media type. Please use Search or Manual Entry.'
    
    alert(errorMessage)
  }

  const handleManualAdd = () => {
    if (!manualForm.title.trim()) return
    
    // Validate required custom fields
    const missingRequired = customFields.filter(
      (field) => field.required && !customFieldValues[field.id]
    )
    if (missingRequired.length > 0) {
      alert(`Please fill in required fields: ${missingRequired.map((f) => f.label).join(', ')}`)
      return
    }
    
    const now = new Date()
    const year = manualForm.year ? parseInt(manualForm.year) : undefined
    const genres = manualForm.genres.split(',').map((g) => g.trim()).filter(Boolean)
    
    addMedia({
      id: `${now.getTime()}-${Math.random()}`,
      title: manualForm.title.trim(),
      type: mediaType,
      year,
      genres,
      language: manualForm.language || 'EN',
      poster: manualForm.poster || undefined,
      description: manualForm.description || undefined,
      rating: manualForm.rating ? parseFloat(manualForm.rating) : undefined,
      isAdult: mediaType === 'jav' || mediaType === 'doujinshi',
      tags: [],
      watched: false,
      isFavorite: false,
      dateAdded: now,
      customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
    })
    
    onClose()
  }

  const handleAddFromCode = async () => {
    if (!javCode.trim()) return
    
    const trimmedCode = javCode.trim().toUpperCase()
    
    // Parse JAV code format
    const javCodePattern = /([A-Z]{2,5})[\s-]?(\d{3,4})/i
    const javMatch = trimmedCode.match(javCodePattern)
    
    if (!javMatch) {
      alert('Invalid JAV code format. Expected format: ABC-123 or ABC123')
      return
    }
    
    const formattedCode = `${javMatch[1]}-${javMatch[2]}`
    
    try {
      const results = await searchJAV(formattedCode)
      if (results.length > 0) {
        const jav = results[0]
        const now = new Date()
        addMedia({
          id: `${now.getTime()}-${Math.random()}`,
          title: jav.title,
          type: 'jav',
          genres: jav.iteminfo?.genre?.map((g) => g.name) || [],
          language: 'JA',
          poster: jav.imageURL?.large,
          description: `${formattedCode} • ${jav.iteminfo?.actress?.map((a) => a.name).join(', ')}`,
          isAdult: true,
          tags: jav.iteminfo?.actress?.map((a) => a.name) || [],
          watched: false,
          isFavorite: false,
          dateAdded: now,
        })
        onClose()
      } else {
        alert(`No results found for JAV code: ${formattedCode}\n\nNote: May require CORS proxy for API access. Configure VITE_CORS_PROXY in .env file.`)
      }
    } catch (error) {
      console.error('Failed to fetch JAV:', error)
      alert('Failed to fetch JAV data. Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
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
              onClick={() => setMode('url')}
              className={`px-6 py-2 text-sm font-semibold transition ${
                mode === 'url'
                  ? 'bg-primary text-white'
                  : 'bg-dark text-gray-400 hover:text-light'
              }`}
            >
              <LinkIcon size={16} className="inline mr-2" />
              Import from URL
            </button>
            {mediaType === 'jav' && (
              <button
                onClick={() => setMode('code')}
                className={`px-6 py-2 text-sm font-semibold transition ${
                  mode === 'code'
                    ? 'bg-primary text-white'
                    : 'bg-dark text-gray-400 hover:text-light'
                }`}
              >
                <LinkIcon size={16} className="inline mr-2" />
                Import from Code
              </button>
            )}
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
                      {searchResults.map((result, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 bg-dark p-4 border border-surface hover:border-primary transition group"
                        >
                          {result.poster && (
                            <img
                              src={result.poster}
                              alt={result.title}
                              className="w-16 h-24 object-cover bg-surface"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-light font-semibold truncate">{result.title}</h3>
                            {result.subtitle && <p className="text-sm text-gray-400 truncate">{result.subtitle}</p>}
                            {result.description && <p className="text-xs text-gray-500 mt-1 truncate">{result.description}</p>}
                          </div>
                          <Button onClick={() => handleAddFromSearch(result)} size="sm">
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-12 text-gray-400">
                    <p>No results found. Try a different search or use manual entry.</p>
                  </div>
                )}
              </div>
            ) : mode === 'url' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {mediaType === 'doujinshi' 
                      ? 'Doujinshi URL' 
                      : mediaType === 'movie' || mediaType === 'tv'
                      ? 'IMDb URL or ID'
                      : 'URL or ID'}
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={
                      mediaType === 'doujinshi'
                        ? 'Enter nhentai.net/g/... or hitomi.la/... URL'
                        : mediaType === 'movie' || mediaType === 'tv'
                        ? 'Enter IMDb URL or ID (e.g., tt1234567)'
                        : mediaType === 'book'
                        ? 'Enter ISBN or book URL'
                        : 'Enter URL or identifier'
                    }
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {mediaType === 'doujinshi'
                      ? 'Supports nhentai and hitomi galleries'
                      : mediaType === 'movie' || mediaType === 'tv'
                      ? 'Supports IMDb URLs (imdb.com/title/...) or IDs (tt1234567)'
                      : mediaType === 'book'
                      ? 'Supports ISBNs and book URLs'
                      : 'Enter any relevant URL or identifier'}
                  </p>
                </div>
                <Button onClick={handleAddFromUrl} disabled={!url.trim()}>
                  Import
                </Button>
              </div>
            ) : mode === 'code' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    JAV Code
                  </label>
                  <input
                    type="text"
                    value={javCode}
                    onChange={(e) => setJavCode(e.target.value)}
                    placeholder="Enter JAV code (e.g., IPX-001, SSIS-123)"
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Supports FANZA/DMM codes like IPX-001, SSIS-123, etc.
                  </p>
                </div>
                <Button onClick={handleAddFromCode} disabled={!javCode.trim()}>
                  Import from Code
                </Button>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <input
                      type="text"
                      value={manualForm.language}
                      onChange={(e) => setManualForm({ ...manualForm, language: e.target.value })}
                      className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="English"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Genres (comma-separated)</label>
                  <input
                    type="text"
                    value={manualForm.genres}
                    onChange={(e) => setManualForm({ ...manualForm, genres: e.target.value })}
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Action, Thriller, Drama"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={manualForm.description}
                    onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Poster URL (optional)</label>
                  <input
                    type="url"
                    value={manualForm.poster}
                    onChange={(e) => setManualForm({ ...manualForm, poster: e.target.value })}
                    className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://..."
                  />
                </div>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div className="border-t border-surface pt-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                      Custom Fields
                    </h3>
                    {customFields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                            }
                            className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        )}
                        {field.type === 'number' && (
                          <input
                            type="number"
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                            }
                            className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0"
                          />
                        )}
                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                            }
                            className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        )}
                        {field.type === 'url' && (
                          <input
                            type="url"
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                            }
                            className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="https://..."
                          />
                        )}
                        {field.type === 'select' && (
                          <select
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                            }
                            className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select {field.label.toLowerCase()}...</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        {field.type === 'multiselect' && (
                          <select
                            multiple
                            value={Array.isArray(customFieldValues[field.id]) ? customFieldValues[field.id] : []}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                              setCustomFieldValues({ ...customFieldValues, [field.id]: selected })
                            }}
                            className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary h-32"
                          >
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        {field.type === 'boolean' && (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={customFieldValues[field.id] || false}
                              onChange={(e) =>
                                setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.checked })
                              }
                              className="rounded"
                            />
                            <span className="text-sm text-gray-300">Yes</span>
                          </label>
                        )}
                        {field.type === 'rating' && (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                            }
                            className="w-full bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0.0 - 10.0"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={handleManualAdd} disabled={!manualForm.title.trim()}>
                  Add to Library
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
