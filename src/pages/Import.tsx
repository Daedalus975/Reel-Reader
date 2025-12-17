import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@components/index'
import { useUIStore, useLibraryStore } from '@store/index'
import type { MediaType } from '../types'
import { useProfileStore } from '@store/profileStore'
import { open } from '@tauri-apps/api/dialog'
import { searchOMDb, getPosterUrl as getOmdbPosterUrl, parseRating, parseGenres, parseYear, type OMDbResult } from '../services/omdb'
import { searchBooks, getOpenLibraryCoverUrl, type OpenLibraryDoc } from '../services/books'
import { searchMusic, getArtworkUrlLarge, type ITunesResult } from '../services/music'
import { searchJAV, type FanzaItem } from '../services/fanza'
import { searchDoujinshi, type DlsiteWork } from '../services/dlsite'
import { importDoujinFromUrl } from '../services/doujin'
import { searchYouTubeVideo } from '../services/youtube'

export const Import: React.FC = () => {
  const { setCurrentPage } = useUIStore()
  const { addMedia } = useLibraryStore()
  const [sourcePath, setSourcePath] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MediaType>('movie')
  const currentProfileId = useProfileStore((s) => s.currentProfileId)
  const profiles = useProfileStore((s) => s.profiles)
  const currentProfile = profiles.find((p) => p.id === currentProfileId)
  const [language, setLanguage] = useState('EN')
  const [year, setYear] = useState<number | undefined>(undefined)
  const [tags, setTags] = useState('')
  
  // Unified search state across providers
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultCard[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [addedItemNotification, setAddedItemNotification] = useState<{ title: string; path: string } | null>(null)
  const navigate = useNavigate()

  type SearchResultCard = {
    id: string
    title: string
    subtitle?: string
    poster?: string
    description?: string
    source: 'omdb' | 'books' | 'music' | 'fanza' | 'dlsite'
    payload: OMDbResult | OpenLibraryDoc | ITunesResult | FanzaItem | DlsiteWork
  }

  useEffect(() => {
    setCurrentPage('/import')
  }, [setCurrentPage])

  const showSuccessNotification = (title: string, mediaType: MediaType) => {
    let path = '/'
    switch (mediaType) {
      case 'movie': path = '/movies'; break
      case 'tv': path = '/tv'; break
      case 'book': path = '/books'; break
      case 'music': path = '/music'; break
      case 'podcast': path = '/podcasts'; break
      case 'jav':
      case 'doujinshi': path = '/adult'; break
    }
    setAddedItemNotification({ title, path })
    setTimeout(() => setAddedItemNotification(null), 5000)
  }

  const addManual = () => {
    if (!title.trim()) return
    const now = new Date()
    addMedia({
      id: `${now.getTime()}`,
      title: title.trim(),
      type,
      year,
      genres: [],
      language: language.trim() || 'EN',
      rating: undefined,
      poster: undefined,
      backdrop: undefined,
      description: undefined,
      isAdult: false,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      watched: false,
      isFavorite: false,
      dateAdded: now,
    })
    showSuccessNotification(title.trim(), type)
    setTitle('')
    setTags('')
    setYear(undefined)
    setType('movie')
    setLanguage('EN')
  }

  const handleChooseFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select a folder to scan for media',
      })
      if (selected && typeof selected === 'string') {
        setSourcePath(selected)
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error)
    }
  }

  const handleAddUrl = async () => {
    if (!url.trim()) return
    // Doujinshi: import from nhentai/hitomi
    if (type === 'doujinshi') {
      const imported = await importDoujinFromUrl(url.trim())
      if (imported) {
        const now = new Date()
        addMedia({
          id: `${now.getTime()}`,
          title: imported.title,
          type: 'doujinshi',
          year: imported.year,
          genres: imported.tags,
          language: imported.languages[0] || 'JP',
          rating: undefined,
          poster: imported.cover,
          backdrop: undefined,
          description: imported.description,
          isAdult: true,
          tags: [...imported.artists, ...imported.tags].slice(0, 6),
          watched: false,
          isFavorite: false,
          dateAdded: now,
        })
          showSuccessNotification(imported.title, 'doujinshi')
        setUrl('')
        return
      }
    }
    // Fallback: do nothing for now (other URL types can be handled later)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      let cards: SearchResultCard[] = []
      if (type === 'movie' || type === 'tv') {
        const omdbType = type === 'tv' ? 'series' : 'movie'
        const results = await searchOMDb(searchQuery.trim(), omdbType)
        cards = results.map((r) => ({
          id: r.imdbID,
          title: r.Title,
          subtitle: `${r.Year} • ${r.Type.toUpperCase()}`,
          poster: getOmdbPosterUrl(r.Poster),
          description: r.Plot,
          source: 'omdb',
          payload: r,
        }))
      } else if (type === 'book') {
        const results = await searchBooks(searchQuery.trim())
        cards = results.map((d) => ({
          id: d.key,
          title: d.title,
          subtitle: `${d.first_publish_year ?? ''} • ${d.author_name?.[0] ?? ''}`.trim(),
          poster: getOpenLibraryCoverUrl(d.cover_i),
          description: d.subject?.slice(0, 5).join(', '),
          source: 'books',
          payload: d,
        }))
      } else if (type === 'music') {
        const results = await searchMusic(searchQuery.trim(), 'album')
        cards = results.map((m) => ({
          id: String(m.collectionId ?? m.trackId ?? Math.random()),
          title: m.collectionName || m.trackName || 'Unknown',
          subtitle: m.artistName,
          poster: getArtworkUrlLarge(m.artworkUrl100),
          description: m.primaryGenreName,
          source: 'music',
          payload: m,
        }))
      } else if (type === 'jav') {
        const results = await searchJAV(searchQuery.trim())
        cards = results.map((j) => ({
          id: j.content_id,
          title: j.title,
          subtitle: `${j.iteminfo?.maker?.[0]?.name ?? ''}`.trim(),
          poster: j.imageURL?.large,
          description: j.iteminfo?.actress?.map((a) => a.name).join(', '),
          source: 'fanza',
          payload: j,
        }))
      } else if (type === 'doujinshi') {
        const results = await searchDoujinshi(searchQuery.trim())
        cards = results.map((w) => ({
          id: w.workno,
          title: w.title,
          subtitle: w.maker_name,
          poster: w.work_image,
          description: w.genre?.join(', '),
          source: 'dlsite',
          payload: w,
        }))
      }

      setSearchResults(cards)
      setShowSearchResults(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectResult = async (card: SearchResultCard) => {
    const now = new Date()
    if (card.source === 'omdb') {
      const r = card.payload as OMDbResult
      addMedia({
        id: `${now.getTime()}`,
        title: r.Title,
        type,
        year: parseYear(r.Year),
        genres: parseGenres(r.Genre),
        language: 'EN',
        rating: parseRating(r.imdbRating),
        poster: getOmdbPosterUrl(r.Poster),
        backdrop: undefined,
        description: r.Plot,
        isAdult: false,
        tags: r.Actors?.split(',').map((a) => a.trim()).slice(0, 3) || [],
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
        showSuccessNotification(r.Title, type)
    } else if (card.source === 'books') {
      const d = card.payload as OpenLibraryDoc
      addMedia({
        id: `${now.getTime()}`,
        title: d.title,
        type: 'book',
        year: d.first_publish_year,
        genres: d.subject?.slice(0, 6) || [],
        language: d.language?.[0]?.toUpperCase() || 'EN',
        rating: undefined,
        poster: getOpenLibraryCoverUrl(d.cover_i),
        backdrop: undefined,
        description: d.author_name?.join(', '),
        isAdult: false,
        tags: (d.author_name || []).slice(0, 3),
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
        showSuccessNotification(d.title, 'book')
    } else if (card.source === 'music') {
      const m = card.payload as ITunesResult
      const musicTitle = m.collectionName || m.trackName || 'Unknown'
      let trailerUrl: string | undefined
      try {
        const ytQuery = [m.artistName, m.trackName || m.collectionName, 'official music video'].filter(Boolean).join(' ')
        const yt = await searchYouTubeVideo(ytQuery)
        if (yt) trailerUrl = yt
      } catch {}
      addMedia({
        id: `${now.getTime()}`,
        title: musicTitle,
        type: 'music',
        year: m.releaseDate ? parseInt(m.releaseDate.slice(0, 4)) : undefined,
        genres: m.primaryGenreName ? [m.primaryGenreName] : [],
        language: 'EN',
        rating: undefined,
        poster: getArtworkUrlLarge(m.artworkUrl100),
        backdrop: undefined,
        description: m.artistName,
        trailerUrl,
        previewUrl: m.previewUrl,
        isAdult: false,
        tags: [m.artistName].filter(Boolean),
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
      showSuccessNotification(musicTitle, 'music')
    } else if (card.source === 'fanza') {
      const j = card.payload as FanzaItem
      addMedia({
        id: `${now.getTime()}`,
        title: j.title,
        type: 'jav',
        year: j.date ? parseInt(j.date.slice(0, 4)) : undefined,
        genres: j.iteminfo?.genre?.map((g) => g.name) || [],
        language: 'JP',
        rating: undefined,
        poster: j.imageURL?.large,
        backdrop: undefined,
        description: j.iteminfo?.maker?.[0]?.name,
        isAdult: true,
        tags: j.iteminfo?.actress?.map((a) => a.name) || [],
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
        showSuccessNotification(j.title, 'jav')
    } else if (card.source === 'dlsite') {
      const w = card.payload as DlsiteWork
      addMedia({
        id: `${now.getTime()}`,
        title: w.title,
        type: 'doujinshi',
        year: w.reg_date ? parseInt(w.reg_date.slice(0, 4)) : undefined,
        genres: w.genre || [],
        language: 'JP',
        rating: undefined,
        poster: w.work_image,
        backdrop: undefined,
        description: w.maker_name,
        isAdult: true,
        tags: (w.genre || []).slice(0, 5),
        watched: false,
        isFavorite: false,
        dateAdded: now,
      })
        showSuccessNotification(w.title, 'doujinshi')
    }
    
    // Reset form
    setTitle('')
    setTags('')
    setYear(undefined)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-light mb-6">Import Media</h1>

      <section className="bg-surface p-6 rounded-none mb-6 max-w-3xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-light">Scan a folder</h2>
          <p className="text-sm text-gray-400">Select a local folder to ingest files (stub).</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={sourcePath}
            onChange={(e) => setSourcePath(e.target.value)}
            placeholder="/path/to/media"
            className="flex-1 bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button variant="secondary" size="md" onClick={handleChooseFolder}>Choose Folder</Button>
          <Button variant="primary" size="md">Scan</Button>
        </div>
      </section>

      <section className="bg-surface p-6 rounded-none mb-6 max-w-3xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-light">Import from URL</h2>
          <p className="text-sm text-gray-400">Add a direct media link or RSS (stub).</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/media.mp4"
            className="flex-1 bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button variant="primary" size="md" onClick={handleAddUrl}>Add URL</Button>
        </div>
      </section>

      <section className="bg-surface p-6 rounded-none max-w-3xl space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-light">Search & Import Metadata</h2>
          <p className="text-sm text-gray-400">Search providers: {currentProfile?.adultContentEnabled ? 'FANZA (JAV), DLsite (doujinshi)' : 'OMDb (movies/TV), Open Library (books), iTunes (music)'}.</p>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              className="flex-1 bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MediaType)}
              className="bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {!currentProfile?.adultContentEnabled && (
                <>
                  <option value="movie">Movie</option>
                  <option value="tv">TV</option>
                  <option value="book">Book</option>
                  <option value="music">Music</option>
                </>
              )}
              {currentProfile?.adultContentEnabled && (
                <>
                  <option value="jav">JAV</option>
                  <option value="doujinshi">Doujinshi</option>
                </>
              )}
            </select>
            <Button
              variant="primary"
              size="md"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-4 border-t border-dark pt-4">
              <p className="text-sm text-gray-400 mb-3">Found {searchResults.length} results:</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start gap-3 p-2 bg-dark rounded border border-dark/50 hover:border-primary/50 transition cursor-pointer"
                    onClick={() => { void handleSelectResult(result) }}
                  >
                    {result.poster && (
                      <img
                        src={result.poster}
                        alt={result.title}
                        className="w-10 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-light truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500">{result.subtitle}</p>
                      )}
                      <p className="text-xs text-gray-400 line-clamp-2">{result.description || 'No description'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && (
            <div className="mt-4 p-3 bg-dark rounded border border-dark text-sm text-gray-400">
              No results found. For movies/TV, configure OMDb key in .env.local. Others may not require keys.
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface p-6 rounded-none max-w-3xl space-y-3 mt-6">
        <div>
          <h2 className="text-xl font-semibold text-light">Manual Entry</h2>
          <p className="text-sm text-gray-400">Create a placeholder item without metadata.</p>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MediaType)}
              className="bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="movie">Movie</option>
              <option value="tv">TV</option>
              <option value="music">Music</option>
              <option value="book">Book</option>
              <option value="podcast">Podcast</option>
              <option value="jav">JAV</option>
              <option value="doujinshi">Doujinshi</option>
            </select>
            <input
              type="text"
              placeholder="Language (e.g., EN)"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Year"
              value={year ?? ''}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="bg-dark text-light px-3 py-2 rounded-none border border-dark focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button variant="secondary" size="md" onClick={addManual}>
            Add Manual Item
          </Button>
        </div>
      </section>

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
