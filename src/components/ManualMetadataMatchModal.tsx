import { useState } from 'react'
import { X, Search, Check } from 'lucide-react'
import { Button } from './Button'
import type { Media } from '../types'

interface ManualMetadataMatchModalProps {
  media: Media
  onClose: () => void
  onMatch: (matchedData: Partial<Media>) => void
}

export function ManualMetadataMatchModal({ media, onClose, onMatch }: ManualMetadataMatchModalProps) {
  const [searchQuery, setSearchQuery] = useState(media.title)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)

  const handleSearch = async () => {
    setLoading(true)
    try {
      // TODO: Integrate with TMDB/OMDB/MusicBrainz/Google Books based on media.type
      const apiKey = (import.meta as any).env?.VITE_OMDB_API_KEY || 'demo'
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchQuery)}&type=${media.type === 'tv' ? 'series' : media.type}`
      )
      const data = await response.json()
      if (data.Search) {
        setResults(data.Search)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmMatch = () => {
    if (!selectedMatch) return

    const matchedData: Partial<Media> = {
      title: selectedMatch.Title,
      year: parseInt(selectedMatch.Year),
      poster: selectedMatch.Poster !== 'N/A' ? selectedMatch.Poster : undefined,
      imdbId: selectedMatch.imdbID
      // metadataLocked would be set separately if needed
    }

    onMatch(matchedData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">Manual Metadata Match</h2>
            <p className="text-white/60 mt-1">Search and select the correct match for "{media.title}"</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-white/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by title..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search size={20} />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 && !loading && (
            <div className="text-center text-white/40 py-12">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>Search for the correct metadata match</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
              <button
                key={result.imdbID}
                onClick={() => setSelectedMatch(result)}
                className={`
                  flex gap-4 p-4 rounded-lg border-2 transition text-left
                  ${selectedMatch?.imdbID === result.imdbID
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                  }
                `}
              >
                {result.Poster !== 'N/A' && (
                  <img
                    src={result.Poster}
                    alt={result.Title}
                    className="w-20 h-28 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{result.Title}</h3>
                  <p className="text-white/60 text-sm">{result.Year}</p>
                  <p className="text-white/40 text-xs mt-1">ID: {result.imdbID}</p>
                  {selectedMatch?.imdbID === result.imdbID && (
                    <div className="flex items-center gap-2 mt-2 text-purple-400 text-sm">
                      <Check size={16} />
                      Selected
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmMatch}
            disabled={!selectedMatch}
          >
            <Check size={20} />
            Confirm Match
          </Button>
        </div>
      </div>
    </div>
  )
}
