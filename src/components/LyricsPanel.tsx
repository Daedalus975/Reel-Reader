import React, { useEffect, useState } from 'react'
import { X, Music2, Loader2 } from 'lucide-react'
import { fetchLyrics, getCurrentLyricsLine, type Lyrics } from '@/services/lyricsService'

interface LyricsPanelProps {
  isOpen: boolean
  onClose: () => void
  artist?: string
  title?: string
  filePath?: string
  album?: string
  duration?: number
  currentTime: number
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  isOpen,
  onClose,
  artist,
  title,
  filePath,
  album,
  duration,
  currentTime,
}) => {
  const [lyrics, setLyrics] = useState<Lyrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !artist || !title) return

    setLoading(true)
    setError(null)

    fetchLyrics(artist, title, { filePath, album, duration })
      .then((result) => {
        if (result) {
          setLyrics(result)
          setError(null)
        } else {
          setError('No lyrics found')
        }
      })
      .catch((err) => {
        console.error('Lyrics fetch error:', err)
        setError('Failed to fetch lyrics')
      })
      .finally(() => setLoading(false))
  }, [isOpen, artist, title, filePath, album, duration])

  const currentLine = lyrics?.synced ? getCurrentLyricsLine(lyrics.synced, currentTime) : -1

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-surface max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface">
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-highlight" />
            <div>
              <h2 className="text-lg font-bold text-light">{title || 'Lyrics'}</h2>
              {artist && <p className="text-sm text-gray-400">{artist}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface/50 text-gray-400 hover:text-light transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Music2 size={48} className="mb-4 opacity-50" />
              <p>{error}</p>
            </div>
          )}

          {lyrics && !loading && (
            <div className="space-y-2">
              {lyrics.synced ? (
                // Synced lyrics with highlighting
                <div className="space-y-1">
                  {lyrics.synced.map((line, index) => (
                    <div
                      key={index}
                      className={`p-2 transition-all duration-300 ${
                        index === currentLine
                          ? 'text-highlight font-semibold text-lg scale-105'
                          : index === currentLine - 1 || index === currentLine + 1
                          ? 'text-light'
                          : 'text-gray-400'
                      }`}
                    >
                      {line.text}
                    </div>
                  ))}
                </div>
              ) : lyrics.plain ? (
                // Plain text lyrics
                <pre className="text-light whitespace-pre-wrap font-sans leading-relaxed">
                  {lyrics.plain}
                </pre>
              ) : (
                <p className="text-gray-400">No lyrics available</p>
              )}

              {/* Source attribution */}
              {lyrics.source && (
                <div className="text-xs text-gray-500 mt-8 pt-4 border-t border-surface">
                  Lyrics provided by {lyrics.source}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
