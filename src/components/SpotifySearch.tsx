import React, { useState } from 'react'
import { Search, Play } from 'lucide-react'
import { searchTracks, type SpotifyTrack } from '../services/spotifyFeatures'
import { isSpotifyConnected } from '../services/spotify'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'

interface SpotifySearchProps {
  onSelectTrack: (track: SpotifyTrack) => void
  showPlayButton?: boolean
}

export const SpotifySearch: React.FC<SpotifySearchProps> = ({ onSelectTrack, showPlayButton = true }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyTrack[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const connected = isSpotifyConnected()
  const playTrack = useSpotifyPlaybackStore((s) => s.playTrack)

  const handleSearch = async () => {
    if (!query.trim() || !connected) return
    setSearching(true)
    try {
      const tracks = await searchTracks(query.trim())
      setResults(tracks)
      setShowResults(true)
    } finally {
      setSearching(false)
    }
  }

  const handleSelect = (track: SpotifyTrack) => {
    onSelectTrack(track)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  if (!connected) {
    return (
      <div className="bg-surface p-4 rounded-none text-sm text-gray-400">
        Connect Spotify in Settings to search and link tracks.
      </div>
    )
  }

  return (
    <div className="bg-surface p-4 rounded-none">
      <h3 className="text-light font-semibold mb-3">Search Spotify</h3>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for a track on Spotify…"
          className="flex-1 bg-dark text-light px-3 py-2 rounded-none border border-dark focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-4 py-2 bg-primary text-white rounded-none hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
        >
          <Search size={16} />
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-2 bg-dark hover:bg-dark/80 cursor-pointer rounded-none group relative"
            >
              {track.imageUrl && (
                <img
                  src={track.imageUrl}
                  alt={track.name}
                  className="w-12 h-12 object-cover rounded-none"
                />
              )}
              <div className="flex-1 min-w-0" onClick={() => handleSelect(track)}>
                <p className="text-light font-semibold truncate">{track.name}</p>
                <p className="text-sm text-gray-400 truncate">{track.artists.join(', ')}</p>
                <p className="text-xs text-gray-500 truncate">{track.album}</p>
              </div>
              
              {showPlayButton && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    playTrack(track.uri)
                  }}
                  className="flex-shrink-0 p-1 bg-primary text-white rounded-none hover:bg-primary/80 transition opacity-0 group-hover:opacity-100"
                  title="Play track"
                >
                  <Play size={16} className="fill-current" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !searching && (
        <p className="text-sm text-gray-400">No results found. Try a different search.</p>
      )}
    </div>
  )
}
