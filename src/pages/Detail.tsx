import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, TagChip } from '@components/index'
import { DoujinDetailLayout } from '../components/DoujinDetailLayout'
import { ComicReader } from '../components/ComicReader'
import { useLibraryStore, useUIStore, useCustomFieldsStore } from '@store/index'
import { useCollectionsStore } from '../store/collectionsStore'
import { searchOMDb, getOMDbDetails, getPosterUrl as getOmdbPosterUrl } from '../services/omdb'
import { extractMediaMetadata } from '../services/metadataExtractor'

export const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { media, toggleFavorite, markAsWatched, updateMedia, removeMedia } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const { fieldDefinitions, addFieldDefinition, getFieldsForMediaType } = useCustomFieldsStore()
  const { collections, addItemToCollection } = useCollectionsStore()
  const navigate = useNavigate()

  useEffect(() => {
    setCurrentPage(`/detail/${id ?? ''}`)
  }, [id, setCurrentPage])

  const item = useMemo(() => media.find((m) => m.id === id), [media, id])

  // Edit mode state
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  
  // Add to collection modal
  const [showAddToCollection, setShowAddToCollection] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  
  // Watch for URL param changes
  useEffect(() => {
    if (searchParams.get('addToCollection') === 'true') {
      setShowAddToCollection(true)
    }
  }, [searchParams])
  const [editForm, setEditForm] = useState({
    title: '',
    year: '',
    description: '',
    director: '',
    actors: '',
    genres: '',
    language: '',
    rating: '',
    myRating: '',
    poster: '',
    filePath: '',
    trailerUrl: '',
    previewUrl: '',
  })
  const [isExtractingMeta, setIsExtractingMeta] = useState(false)
  const [metaSummary, setMetaSummary] = useState('')
  
  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'url'>('text')
  
  // Comic reader state
  const [comicReaderOpen, setComicReaderOpen] = useState(false)
  
  const customFields = useMemo(() => {
    return item ? getFieldsForMediaType(item.type) : []
  }, [item, getFieldsForMediaType, fieldDefinitions])

  // IMDb-style details fetched from OMDb
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [details, setDetails] = useState<{
    Title?: string
    Year?: string
    Type?: 'movie' | 'series' | 'episode'
    Poster?: string
    Plot?: string
    imdbRating?: string
    Runtime?: string
    Director?: string
    Genre?: string
    Actors?: string
  } | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      if (!item || (item.type !== 'movie' && item.type !== 'tv')) return
      setIsLoadingDetails(true)
      try {
        // Prefer exact match by title, fallback to first search result
        const omdbType = item.type === 'tv' ? 'series' : 'movie'
        const results = await searchOMDb(item.title, omdbType)
        const first = results?.[0]
        let full = null
        if (first?.imdbID) {
          full = await getOMDbDetails(first.imdbID)
        }
        setDetails(full || first || null)
      } finally {
        setIsLoadingDetails(false)
      }
    }
    fetchDetails()
  }, [item])

  // Initialize edit form when item changes or edit mode is enabled
  useEffect(() => {
    if (item && isEditing) {
      setEditForm({
        title: details?.Title || item.title,
        year: (details?.Year && details.Year !== 'N/A') ? details.Year : (item.year?.toString() || ''),
        description: (details?.Plot && details.Plot !== 'N/A') ? details.Plot : (item.description || ''),
        director: (details?.Director && details.Director !== 'N/A') ? details.Director : '',
        actors: (details?.Actors && details.Actors !== 'N/A') ? details.Actors : item.tags.join(', '),
        genres: (details?.Genre || item.genres.join(', ')),
        language: item.language,
        rating: (details?.imdbRating && details.imdbRating !== 'N/A') ? details.imdbRating : (item.rating?.toString() || ''),
        myRating: item.myRating?.toString() || '',
        poster: item.poster || getOmdbPosterUrl(details?.Poster) || '',
        filePath: item.filePath || '',
        trailerUrl: item.trailerUrl || '',
        previewUrl: item.previewUrl || '',
      })
      setCustomFieldValues(item.customFields || {})
    }
  }, [item, isEditing, details])

  const handleSaveEdit = () => {
    if (!item || !id) return
    
    const updates: Partial<typeof item> = {
      title: editForm.title.trim(),
      year: editForm.year ? parseInt(editForm.year) : undefined,
      description: editForm.description.trim(),
      genres: editForm.genres.split(',').map(g => g.trim()).filter(Boolean),
      language: editForm.language.trim(),
      rating: editForm.rating ? parseFloat(editForm.rating) : undefined,
      myRating: editForm.myRating ? parseFloat(editForm.myRating) : undefined,
      poster: editForm.poster.trim() || undefined,
      tags: editForm.actors.split(',').map(a => a.trim()).filter(Boolean),
      customFields: customFieldValues,
      filePath: editForm.filePath.trim() || undefined,
      trailerUrl: editForm.trailerUrl.trim() || undefined,
      previewUrl: editForm.previewUrl.trim() || undefined,
    }

    updateMedia(id, updates)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setShowAddFieldDialog(false)
  }

  const handleAddCustomField = () => {
    if (!item || !newFieldLabel.trim()) return
    
    addFieldDefinition({
      label: newFieldLabel.trim(),
      type: newFieldType,
      mediaTypes: [item.type],
    })
    
    setNewFieldLabel('')
    setNewFieldType('text')
    setShowAddFieldDialog(false)
  }

  if (!item) {
    return (
      <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
        <div className="bg-surface p-6 rounded-none">
          <h1 className="text-2xl font-bold text-light mb-2">Not found</h1>
          <p className="text-gray-400 mb-4">The requested media could not be located.</p>
          <Link to="/library" className="text-primary font-semibold">Back to Library</Link>
        </div>
      </main>
    )
  }

  const runtimeText = (() => {
    const rt = details?.Runtime && details.Runtime !== 'N/A' ? details.Runtime : undefined
    if (!rt) return undefined
    const mins = parseInt(rt)
    if (isNaN(mins)) return rt
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
  })()

  const poster = item.poster || getOmdbPosterUrl(details?.Poster)
  const rating10 = details?.imdbRating && details.imdbRating !== 'N/A' ? parseFloat(details.imdbRating) : item.rating
  const genres = (details?.Genre ? details.Genre.split(',').map(g => g.trim()) : item.genres)

  const typeLabel = (() => {
    switch (item.type) {
      case 'tv': return 'TV Series'
      case 'movie': return 'Movie'
      case 'book': return 'Book'
      case 'music': return 'Music'
      case 'podcast': return 'Podcast'
      case 'jav': return 'Adult Movie'
      case 'doujinshi': return 'Doujinshi'
      default: return item.type
    }
  })()

  const isVideo = item.type === 'movie' || item.type === 'tv' || item.type === 'jav'
  const peopleLabel = item.type === 'book' ? 'Authors' : item.type === 'music' ? 'Artists' : item.type === 'doujinshi' ? 'Circle' : 'Stars'
  const statusLabel = item.type === 'book' ? 'Status' : 'Status'
  const statusValue = item.type === 'book' ? (item.watched ? 'Finished' : 'Not read') : (item.watched ? '✓ Watched' : 'Not watched')

  // Use custom doujinshi layout
  if (item.type === 'doujinshi') {
    return (
      <main className="pt-20 pb-24 px-0">
        <div className="bg-dark min-h-screen">
          <DoujinDetailLayout
            media={item}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 pb-24 px-0">
      {/* Hero Section with Backdrop */}
      <div className="relative bg-gradient-to-b from-dark via-surface to-dark">
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8 max-w-7xl mx-auto">
            {/* Poster */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-surface rounded-lg overflow-hidden shadow-2xl border-2 border-dark/50">
                {poster ? (
                  <img src={poster} alt={item.title} className="w-full object-cover aspect-[2/3]" />
                ) : (
                  <div className="aspect-[2/3] bg-dark flex items-center justify-center text-gray-500">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {/* Title & Meta */}
              <div>
                {!isEditing ? (
                  <>
                    <h1 className="text-4xl md:text-5xl font-bold text-light mb-2">{details?.Title || item.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span className="font-medium text-light">{(details?.Year && details.Year !== 'N/A') ? details.Year : (item.year ?? 'N/A')}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 border border-gray-600 text-gray-300 text-xs font-medium">{typeLabel}</span>
                      {runtimeText && (
                        <>
                          <span>•</span>
                          <span>{runtimeText}</span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-dark border border-gray-600 rounded px-4 py-2 text-2xl font-bold text-light focus:outline-none focus:border-primary"
                      placeholder="Title"
                    />
                    <input
                      type="text"
                      value={editForm.year}
                      onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                      className="w-32 bg-dark border border-gray-600 rounded px-3 py-1 text-sm text-light focus:outline-none focus:border-primary"
                      placeholder="Year"
                    />
                  </div>
                )}
              </div>

              {/* Rating & Actions */}
              <div className="flex flex-wrap items-start gap-4">
                {/* External Rating (movies/TV only) */}
                {isVideo && rating10 && (
                <div className="bg-dark/80 backdrop-blur-sm p-4 rounded-lg border border-yellow-500/30 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.788 1.401 8.168L12 18.896l-7.335 3.971 1.401-8.168L.132 9.211l8.2-1.193L12 .587z"/>
                    </svg>
                    <span className="text-2xl font-bold text-light">
                      {rating10.toFixed(1)}
                    </span>
                    <span className="text-gray-500 text-sm">/10</span>
                  </div>
                  <p className="text-xs text-gray-400">IMDb Rating</p>
                </div>
                )}
                
                {/* My Rating */}
                {!isEditing ? (
                  item.myRating ? (
                    <div className="bg-dark/80 backdrop-blur-sm p-4 rounded-lg border border-primary/30 min-w-[140px]">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.788 1.401 8.168L12 18.896l-7.335 3.971 1.401-8.168L.132 9.211l8.2-1.193L12 .587z"/>
                        </svg>
                        <span className="text-2xl font-bold text-light">
                          {item.myRating.toFixed(1)}
                        </span>
                        <span className="text-gray-500 text-sm">/10</span>
                      </div>
                      <p className="text-xs text-gray-400">Your Rating</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-dark/80 backdrop-blur-sm p-4 rounded-lg border border-gray-600 hover:border-primary min-w-[140px] transition"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-lg font-semibold text-gray-400">Rate</span>
                      </div>
                      <p className="text-xs text-gray-400">Add Your Rating</p>
                    </button>
                  )
                ) : (
                  <div className="bg-dark/80 backdrop-blur-sm p-4 rounded-lg border border-primary min-w-[140px]">
                    <label className="block text-xs text-gray-400 mb-2">Your Rating (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={editForm.myRating}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (value <= 10 || e.target.value === '') {
                          setEditForm({ ...editForm, myRating: e.target.value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (value > 10) {
                          setEditForm({ ...editForm, myRating: '10' })
                        }
                      }}
                      className="w-full bg-surface border border-gray-600 rounded px-3 py-2 text-light focus:outline-none focus:border-primary"
                      placeholder="0.0"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!isEditing ? (
                    <>
                      {/* Show Read button for books with comic/manga format */}
                      {item.type === 'book' && (item.bookFormat === 'comic' || item.bookFormat === 'manga') ? (
                        <Button variant="primary" size="md" onClick={() => setComicReaderOpen(true)}>
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Read
                        </Button>
                      ) : (
                        <Button variant="primary" size="md" onClick={() => navigate(`/watch/${item.id}`)}>
                          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          {isVideo ? 'Play' : item.type === 'music' ? 'Listen' : 'Open'}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <svg className="w-5 h-5 mr-1" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {item.isFavorite ? 'Favorited' : 'Favorite'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => markAsWatched(item.id, item.progress ?? 0)}
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.watched ? (item.type === 'book' ? 'Finished' : 'Watched') : (item.type === 'book' ? 'Mark Finished' : 'Mark Watched')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setIsEditing(true)}
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Button>
                      {!details && (item.type === 'movie' || item.type === 'tv') && (
                        <Button
                          variant="outline"
                          size="md"
                          onClick={async () => {
                            setIsLoadingDetails(true)
                            try {
                              const omdbType = item.type === 'tv' ? 'series' : 'movie'
                              const results = await searchOMDb(item.title, omdbType)
                              if (results[0]?.imdbID) {
                                const full = await getOMDbDetails(results[0].imdbID)
                                setDetails(full)
                                // Auto-populate trailer for TV shows
                                if (item.type === 'tv' && !item.trailerUrl) {
                                  updateMedia(item.id, {
                                    trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' trailer')}`
                                  })
                                }
                              }
                            } finally {
                              setIsLoadingDetails(false)
                            }
                          }}
                          disabled={isLoadingDetails}
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {isLoadingDetails ? 'Fetching...' : 'Fetch Metadata'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => {
                          if (confirm('Delete this item from your library?')) {
                            removeMedia(item.id)
                            navigate(-1)
                          }
                        }}
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" />
                        </svg>
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Fetch Metadata in Edit Mode */}
                      {(item.type === 'movie' || item.type === 'tv') && (
                        <Button
                          variant="outline"
                          size="md"
                          onClick={async () => {
                            setIsLoadingDetails(true)
                            try {
                              const omdbType = item.type === 'tv' ? 'series' : 'movie'
                              const results = await searchOMDb(editForm.title || item.title, omdbType)
                              if (results[0]?.imdbID) {
                                const full = await getOMDbDetails(results[0].imdbID)
                                if (full) {
                                  setDetails(full)
                                  // Auto-populate form fields
                                  setEditForm(prev => ({
                                    ...prev,
                                    description: full.Plot || prev.description,
                                    genres: full.Genre || prev.genres,
                                    director: full.Director || prev.director,
                                    actors: full.Actors || prev.actors,
                                    year: full.Year || prev.year,
                                    poster: full.Poster || prev.poster,
                                    rating: full.imdbRating || prev.rating,
                                  }))
                                  // Auto-populate trailer for TV shows
                                  if (item.type === 'tv' && !editForm.trailerUrl) {
                                    setEditForm(prev => ({
                                      ...prev,
                                      trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(editForm.title || item.title + ' trailer')}`
                                    }))
                                  }
                                }
                              }
                            } finally {
                              setIsLoadingDetails(false)
                            }
                          }}
                          disabled={isLoadingDetails}
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {isLoadingDetails ? 'Fetching...' : 'Fetch Metadata'}
                        </Button>
                      )}
                      <Button variant="primary" size="md" onClick={handleSaveEdit}>
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                      </Button>
                      <Button variant="secondary" size="md" onClick={handleCancelEdit}>
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <TagChip key={genre} label={genre} />
                ))}
              </div>

              {/* Plot */}
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Storyline</h2>
                {!isEditing ? (
                  <p className="text-base text-gray-200 leading-relaxed">
                    {(details?.Plot && details.Plot !== 'N/A') ? details.Plot : (item.description || 'No overview available.')}
                  </p>
                ) : (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-dark border border-gray-600 rounded px-4 py-3 text-gray-200 focus:outline-none focus:border-primary min-h-[120px]"
                    placeholder="Plot summary..."
                  />
                )}
              </div>



              {/* Trailer/Preview Section */}
              {(item.trailerUrl || item.previewUrl) && (
                <div className="border-t border-dark pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                      {item.type === 'book' ? 'Preview' : item.type === 'music' ? 'Music Video' : 'Trailer'}
                    </h2>
                    {item.trailerUrl && (
                      <a
                        href={item.trailerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Open in YouTube ↗
                      </a>
                    )}
                  </div>
                  
                  {/* YouTube Embed */}
                  {item.trailerUrl && item.trailerUrl.includes('youtube.com') && (
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-none border border-gray-700"
                        src={item.trailerUrl.replace('watch?v=', 'embed/').split('&')[0]}
                        title="Trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  
                  {/* Google Books Preview */}
                  {item.type === 'book' && item.previewUrl && (
                    <div className="relative w-full" style={{ minHeight: '400px' }}>
                      <iframe
                        className="w-full h-full rounded-none border border-gray-700"
                        src={item.previewUrl}
                        title="Book Preview"
                        style={{ minHeight: '400px' }}
                        frameBorder="0"
                      />
                    </div>
                  )}
                </div>
              )}



              {/* Details Grid */}
              <div className="border-t border-dark pt-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Details</h2>
                {!isEditing ? (
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {isVideo && (
                      <div className="flex gap-3">
                        <dt className="text-gray-400 font-medium min-w-[100px]">Director</dt>
                        <dd className="text-light">{details?.Director && details.Director !== 'N/A' ? details.Director : '—'}</dd>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <dt className="text-gray-400 font-medium min-w-[100px]">{peopleLabel}</dt>
                      <dd className="text-light">{isVideo && details?.Actors && details.Actors !== 'N/A' ? details.Actors : (item.tags.slice(0, 3).join(', ') || '—')}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-gray-400 font-medium min-w-[100px]">Genre</dt>
                      <dd className="text-light">{genres.join(', ') || '—'}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-gray-400 font-medium min-w-[100px]">Language</dt>
                      <dd className="text-light">{item.language || '—'}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-gray-400 font-medium min-w-[100px]">{isVideo ? 'Rating' : 'Rating'}</dt>
                      <dd className="text-light">{isVideo && typeof rating10 === 'number' ? `${rating10.toFixed(1)}/10` : '—'}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-gray-400 font-medium min-w-[100px]">{statusLabel}</dt>
                      <dd className="text-light">{statusValue}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-gray-400 font-medium min-w-[100px]">Type</dt>
                      <dd className="text-light uppercase">{item.type}</dd>
                    </div>
                  </dl>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isVideo && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Director</label>
                        <input
                          type="text"
                          value={editForm.director}
                          onChange={(e) => setEditForm({ ...editForm, director: e.target.value })}
                          className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                          placeholder="Director name"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">{item.type === 'book' ? 'Authors (comma-separated)' : peopleLabel + ' (comma-separated)'}</label>
                      <input
                        type="text"
                        value={editForm.actors}
                        onChange={(e) => setEditForm({ ...editForm, actors: e.target.value })}
                        className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                        placeholder={item.type === 'book' ? 'Author 1, Author 2' : 'Name 1, Name 2'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Genres (comma-separated)</label>
                      <input
                        type="text"
                        value={editForm.genres}
                        onChange={(e) => setEditForm({ ...editForm, genres: e.target.value })}
                        className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                        placeholder="Action, Drama, Thriller"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Language</label>
                      <input
                        type="text"
                        value={editForm.language}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                        className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                        placeholder="English"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Rating (0-10)</label>
                      <input
                        type="text"
                        value={editForm.rating}
                        onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                        className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                        placeholder="8.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Poster URL</label>
                      <input
                        type="text"
                        value={editForm.poster}
                        onChange={(e) => setEditForm({ ...editForm, poster: e.target.value })}
                        className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Local File Path</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editForm.filePath}
                          onChange={(e) => setEditForm({ ...editForm, filePath: e.target.value })}
                          className="flex-1 bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                          placeholder="Link to local file..."
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const { pickFile, getFileFilters } = await import('../services/fileUtils')
                            const path = await pickFile(getFileFilters(item.type))
                            if (path) {
                              setEditForm({ ...editForm, filePath: path })
                              setIsExtractingMeta(true)
                              setMetaSummary('')
                              try {
                                const meta = await extractMediaMetadata(path, item.type)
                                const updates: Partial<typeof item> = {}
                                if (meta.duration) updates.duration = Math.round(meta.duration)
                                if (meta.resolution) updates.resolution = meta.resolution
                                if (meta.fileSize) updates.fileSize = meta.fileSize
                                if (meta.bitrate) updates.bitrate = Math.round(meta.bitrate)
                                if (Object.keys(updates).length) {
                                  updateMedia(item.id, updates)
                                  const parts: string[] = []
                                  if (meta.duration) parts.push(`${Math.round(meta.duration / 60)}m`)
                                  if (meta.resolution) parts.push(meta.resolution)
                                  if (meta.fileSize) parts.push(`${(meta.fileSize / (1024 * 1024)).toFixed(1)} MB`)
                                  setMetaSummary(`Extracted: ${parts.join(' • ')}`)
                                } else {
                                  setMetaSummary('No metadata extracted')
                                }
                              } catch (err) {
                                console.error('Metadata extract failed', err)
                                setMetaSummary('Metadata extraction failed')
                              } finally {
                                setIsExtractingMeta(false)
                              }
                            }
                          }}
                          className="px-4 py-2 bg-primary hover:bg-highlight text-dark font-medium text-sm rounded"
                        >
                          {isExtractingMeta ? 'Extracting…' : 'Browse'}
                        </button>
                      </div>
                      {metaSummary && (
                        <p className="text-xs text-gray-400 mt-1">{metaSummary}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        {isVideo ? 'Trailer URL (YouTube)' : item.type === 'music' ? 'Music Video URL (YouTube)' : 'Preview URL'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editForm.trailerUrl}
                          onChange={(e) => setEditForm({ ...editForm, trailerUrl: e.target.value })}
                          className="flex-1 bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                        {(item.type === 'movie' || item.type === 'tv') && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const { searchTMDB, getMovieTrailer, getShowTrailer } = await import('../services/tmdb')
                                const results = await searchTMDB(item.title, item.type === 'tv' ? 'tv' : 'movie')
                                if (results && results[0]) {
                                  const trailer = item.type === 'tv' 
                                    ? await getShowTrailer(results[0].id)
                                    : await getMovieTrailer(results[0].id)
                                  if (trailer) {
                                    setEditForm({ ...editForm, trailerUrl: trailer })
                                  }
                                }
                              } catch (e) {
                                console.error('Failed to fetch trailer:', e)
                              }
                            }}
                            className="px-4 py-2 bg-primary hover:bg-highlight text-dark font-medium text-sm rounded whitespace-nowrap"
                          >
                            Auto-Fetch
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        {item.type === 'book' ? 'Book Preview URL (Google Books)' : 'Additional Preview URL'}
                      </label>
                      <input
                        type="url"
                        value={editForm.previewUrl}
                        onChange={(e) => setEditForm({ ...editForm, previewUrl: e.target.value })}
                        className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Fields */}
              {(customFields.length > 0 || isEditing) && (
                <div className="border-t border-dark pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Custom Fields</h2>
                    {isEditing && (
                      <button
                        onClick={() => setShowAddFieldDialog(true)}
                        className="text-xs text-primary hover:text-highlight flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Field
                      </button>
                    )}
                  </div>
                  
                  {customFields.length > 0 && !isEditing ? (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {customFields.map((field) => {
                        const value = item.customFields?.[field.id]
                        if (!value) return null
                        return (
                          <div key={field.id} className="flex gap-3">
                            <dt className="text-gray-400 font-medium min-w-[100px]">{field.label}</dt>
                            <dd className="text-light">{value}</dd>
                          </div>
                        )
                      })}
                    </dl>
                  ) : isEditing && customFields.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customFields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                          <input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                            className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-sm text-light focus:outline-none focus:border-primary"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  
                  {/* Add Custom Field Dialog */}
                  {showAddFieldDialog && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                      <div className="bg-surface border border-dark rounded-lg p-6 max-w-md w-full space-y-4">
                        <h3 className="text-xl font-bold text-light">Add Custom Field</h3>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Field Name</label>
                          <input
                            type="text"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-light focus:outline-none focus:border-primary"
                            placeholder="e.g., Studio, Publisher, Platform"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Field Type</label>
                          <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value as any)}
                            className="w-full bg-dark border border-gray-600 rounded px-3 py-2 text-light focus:outline-none focus:border-primary"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="url">URL</option>
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="secondary" size="sm" onClick={() => setShowAddFieldDialog(false)}>
                            Cancel
                          </Button>
                          <Button variant="primary" size="sm" onClick={handleAddCustomField}>
                            Add Field
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Tags */}
              {item.tags.length > 0 && (
                <div className="border-t border-dark pt-6">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <TagChip key={tag} label={tag} color="bg-highlight text-dark" />
                    ))}
                  </div>
                </div>
              )}

              {isLoadingDetails && (
                <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Loading IMDb details…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Comic Reader */}
      {comicReaderOpen && (
        <ComicReader
          media={item}
          onClose={() => setComicReaderOpen(false)}
        />
      )}
      
      {/* Add to Collection Modal */}
      {showAddToCollection && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowAddToCollection(false)}
        >
          <div 
            className="bg-surface rounded-none p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-light mb-4">Add to Collection</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Collection</label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full bg-dark text-light px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose a collection...</option>
                  {collections.filter((c) => c.type !== 'smart').map((col) => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowAddToCollection(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (selectedCollection && id) {
                      addItemToCollection(selectedCollection, id)
                      setShowAddToCollection(false)
                      setSelectedCollection('')
                    }
                  }}
                  disabled={!selectedCollection}
                  className="flex-1"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
