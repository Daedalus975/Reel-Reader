import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Play, Music2, Calendar, Disc3, Languages, Star, Clock } from 'lucide-react'
import { useLibraryStore } from '@store/libraryStore'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'
import { saveTrack, isSavedTrack } from '@/services/spotifyFeatures'
import { isSpotifyConnected } from '@/services/spotify'
import type { Media } from '../types'

interface MusicDetailModalProps {
  music: Media
  isOpen: boolean
  onClose: () => void
  onPlay?: () => void
}

export const MusicDetailModal: React.FC<MusicDetailModalProps> = ({ music, isOpen, onClose, onPlay }) => {
  const { toggleFavorite } = useLibraryStore()
  const playTrack = useSpotifyPlaybackStore((s) => s.playTrack)
  const [isFavorited, setIsFavorited] = useState(music.isFavorite)
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyConnected())
  const [isSavedToSpotify, setIsSavedToSpotify] = useState(false)
  const [savingToSpotify, setSavingToSpotify] = useState(false)

  const handleFavorite = () => {
    toggleFavorite(music.id)
    setIsFavorited(!isFavorited)
  }

  const handleSaveToSpotify = async () => {
    if (!music.spotifyTrackId) {
      console.warn('No Spotify track ID available')
      return
    }
    setSavingToSpotify(true)
    try {
      const success = await saveTrack(music.spotifyTrackId)
      if (success) {
        setIsSavedToSpotify(true)
      }
    } finally {
      setSavingToSpotify(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  // Allow closing with Escape as well as clicking the backdrop
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Check Spotify connection and if track is already saved
  useEffect(() => {
    setSpotifyConnected(isSpotifyConnected())
    if (isOpen && spotifyConnected && music.spotifyTrackId) {
      ;(async () => {
        const saved = await isSavedTrack(music.spotifyTrackId!)
        setIsSavedToSpotify(saved)
      })()
    }
  }, [isOpen, spotifyConnected, music.spotifyTrackId])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header with Close Button */}
              <div className="sticky top-0 bg-surface border-b border-dark p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-light">Music Details</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-dark rounded-none transition"
                  aria-label="Close"
                >
                  <X size={24} className="text-light" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Album Art and Basic Info */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Album Cover */}
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 rounded-lg overflow-hidden bg-dark flex items-center justify-center">
                      {music.poster ? (
                        <img
                          src={music.poster}
                          alt={music.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface">
                          <Music2 size={64} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title, Artist, Actions */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-light mb-2">{music.title}</h1>
                      <p className="text-lg text-gray-300 mb-4">
                        {music.description || 'Artist information not available'}
                      </p>
                      {music.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {music.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-primary/20 text-highlight text-sm rounded-none"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={onPlay}
                        className="flex-1 bg-primary text-white px-6 py-3 rounded-none hover:bg-primary/80 transition flex items-center justify-center gap-2 font-semibold"
                      >
                        <Play size={18} />
                        Play
                      </button>
                      {spotifyConnected && music.spotifyTrackId && (
                        <button
                          onClick={() => playTrack(music.spotifyTrackId!)}
                          className="px-6 py-3 rounded-none transition font-semibold flex items-center gap-2 bg-green-600 hover:bg-green-600/80 text-white"
                        >
                          <Play size={18} />
                          Spotify
                        </button>
                      )}
                      <button
                        onClick={handleFavorite}
                        className={`px-6 py-3 rounded-none transition font-semibold flex items-center gap-2 ${
                          isFavorited
                            ? 'bg-highlight/20 text-highlight'
                            : 'bg-surface hover:bg-dark text-light'
                        }`}
                      >
                        <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                        {isFavorited ? 'Favorited' : 'Favorite'}
                      </button>
                      {spotifyConnected && music.spotifyTrackId && (
                        <button
                          onClick={handleSaveToSpotify}
                          disabled={savingToSpotify || isSavedToSpotify}
                          className={`px-6 py-3 rounded-none transition font-semibold flex items-center gap-2 ${
                            isSavedToSpotify
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-surface hover:bg-dark text-light disabled:opacity-50'
                          }`}
                        >
                          {savingToSpotify ? '…' : isSavedToSpotify ? '✓' : '+'}
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-dark" />

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Duration */}
                  {music.duration && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Clock size={16} />
                        <span className="text-xs uppercase font-semibold">Duration</span>
                      </div>
                      <p className="text-lg font-semibold text-light">
                        {formatDuration(music.duration)}
                      </p>
                    </div>
                  )}

                  {/* Year */}
                  {music.year && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Calendar size={16} />
                        <span className="text-xs uppercase font-semibold">Year</span>
                      </div>
                      <p className="text-lg font-semibold text-light">{music.year}</p>
                    </div>
                  )}

                  {/* Rating */}
                  {music.rating && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Star size={16} />
                        <span className="text-xs uppercase font-semibold">Rating</span>
                      </div>
                      <p className="text-lg font-semibold text-light">
                        ⭐ {music.rating.toFixed(1)}
                      </p>
                    </div>
                  )}

                  {/* Language */}
                  <div className="bg-dark/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Languages size={16} />
                      <span className="text-xs uppercase font-semibold">Language</span>
                    </div>
                    <p className="text-lg font-semibold text-light uppercase">{music.language}</p>
                  </div>

                  {/* Genres */}
                  {music.genres.length > 0 && (
                    <div className="bg-dark/50 p-4 rounded-lg md:col-span-2">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Disc3 size={16} />
                        <span className="text-xs uppercase font-semibold">Genres</span>
                      </div>
                      <p className="text-lg font-semibold text-light line-clamp-2">
                        {music.genres.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Album */}
                  {music.album && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Disc3 size={16} />
                        <span className="text-xs uppercase font-semibold">Album</span>
                      </div>
                      <p className="text-lg font-semibold text-light line-clamp-2">{music.album}</p>
                    </div>
                  )}

                  {/* Artist */}
                  {music.artist && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Artist</span>
                      <p className="text-lg font-semibold text-light line-clamp-2">{music.artist}</p>
                    </div>
                  )}

                  {/* Album Artist */}
                  {music.albumArtist && music.albumArtist !== music.artist && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Album Artist</span>
                      <p className="text-lg font-semibold text-light line-clamp-2">{music.albumArtist}</p>
                    </div>
                  )}

                  {/* Track Number */}
                  {music.trackNumber && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Track Number</span>
                      <p className="text-lg font-semibold text-light">{music.trackNumber}</p>
                    </div>
                  )}

                  {/* BPM */}
                  {music.bpm && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">BPM</span>
                      <p className="text-lg font-semibold text-light">{music.bpm}</p>
                    </div>
                  )}

                  {/* Mood */}
                  {music.mood && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Mood</span>
                      <p className="text-lg font-semibold text-light capitalize">{music.mood}</p>
                    </div>
                  )}

                  {/* Audio Format */}
                  {music.audioFormat && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Audio Format</span>
                      <p className="text-lg font-semibold text-light uppercase">{music.audioFormat}</p>
                    </div>
                  )}

                  {/* ISRC */}
                  {music.isrc && (
                    <div className="bg-dark/50 p-4 rounded-lg md:col-span-2">
                      <span className="text-xs uppercase font-semibold text-gray-400">ISRC</span>
                      <p className="text-lg font-semibold text-light font-mono">{music.isrc}</p>
                    </div>
                  )}

                  {/* Play Count */}
                  {music.playCount !== undefined && music.playCount > 0 && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Play Count</span>
                      <p className="text-lg font-semibold text-light">{music.playCount}</p>
                    </div>
                  )}

                  {/* File Size */}
                  {music.fileSize && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">File Size</span>
                      <p className="text-lg font-semibold text-light">
                        {(music.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}

                  {/* Bitrate */}
                  {music.bitrate && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Bitrate</span>
                      <p className="text-lg font-semibold text-light">{music.bitrate} kbps</p>
                    </div>
                  )}

                  {/* Codec */}
                  {music.codec && (
                    <div className="bg-dark/50 p-4 rounded-lg">
                      <span className="text-xs uppercase font-semibold text-gray-400">Codec</span>
                      <p className="text-lg font-semibold text-light uppercase">{music.codec}</p>
                    </div>
                  )}
                </div>

                {/* Description/Notes */}
                {music.customFields && Object.keys(music.customFields).length > 0 && (
                  <>
                    <div className="h-px bg-dark" />
                    <div>
                      <h3 className="text-lg font-semibold text-light mb-3">Additional Info</h3>
                      <div className="space-y-2">
                        {Object.entries(music.customFields).map(([key, value]) => (
                          <div key={key} className="bg-dark/50 p-3 rounded-lg">
                            <p className="text-xs uppercase font-semibold text-gray-400">{key}</p>
                            <p className="text-light">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
