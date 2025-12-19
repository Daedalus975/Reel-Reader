import React, { useState } from 'react'
import { X, Upload, Download, List } from 'lucide-react'
import { exportM3UPlaylist, importM3UPlaylist, matchM3UWithLibrary, type M3UEntry } from '@/services/playlistService'
import { useLibraryStore } from '@/store/libraryStore'
import { useMusicPlayerStore } from '@/store/musicPlayerStore'
import type { Media } from '@/types'

interface PlaylistManagerProps {
  isOpen: boolean
  onClose: () => void
  currentPlaylist?: Media[]
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  isOpen,
  onClose,
  currentPlaylist = [],
}) => {
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<Array<{ entry: M3UEntry; match: Media | null }>>([])
  const library = useLibraryStore((s) => s.media.filter((m) => m.type === 'music'))
  const playQueue = useMusicPlayerStore((s) => s.playQueue)

  const handleExport = () => {
    const items = currentPlaylist.length > 0 ? currentPlaylist : library
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `reel-reader-playlist-${timestamp}.m3u`
    exportM3UPlaylist(items, filename)
  }

  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.m3u,.m3u8'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImporting(true)
      try {
        const entries = await importM3UPlaylist(file)
        const matches = matchM3UWithLibrary(entries, library)
        setImportResults(matches)
      } catch (error) {
        console.error('Failed to import playlist:', error)
        alert('Failed to import playlist')
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  const handlePlayMatched = () => {
    const matchedItems = importResults.filter((r) => r.match).map((r) => r.match!.id)
    if (matchedItems.length > 0) {
      playQueue(matchedItems, matchedItems[0])
    }
    setImportResults([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-surface max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface">
          <div className="flex items-center gap-2">
            <List size={20} className="text-highlight" />
            <h2 className="text-lg font-bold text-light">Playlist Manager</h2>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white hover:bg-primary/80 transition"
            >
              <Download size={18} />
              <span>Export to M3U</span>
            </button>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-surface text-light hover:bg-dark transition disabled:opacity-50"
            >
              <Upload size={18} />
              <span>{importing ? 'Importing...' : 'Import M3U'}</span>
            </button>
          </div>

          {/* Export Info */}
          {importResults.length === 0 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                <p className="mb-2">
                  <strong className="text-light">Export:</strong> Creates an M3U playlist file from your current queue or entire library.
                </p>
                <p>
                  <strong className="text-light">Import:</strong> Load an M3U playlist and match tracks with your library.
                </p>
              </div>

              <div className="bg-dark/50 p-4 rounded-sm">
                <p className="text-sm text-gray-400 mb-2">Current selection:</p>
                <p className="text-light">
                  {currentPlaylist.length > 0
                    ? `${currentPlaylist.length} tracks in queue`
                    : `${library.length} tracks in library`}
                </p>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Found <span className="text-light font-semibold">{importResults.filter((r) => r.match).length}</span> of{' '}
                  <span className="text-light font-semibold">{importResults.length}</span> tracks in your library
                </p>
                <button
                  onClick={handlePlayMatched}
                  disabled={importResults.filter((r) => r.match).length === 0}
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/80 transition disabled:opacity-50"
                >
                  Play Matched Tracks
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {importResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 border ${
                      result.match ? 'border-green-500/30 bg-green-500/5' : 'border-surface bg-dark/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-light font-medium">
                          {result.entry.artist ? `${result.entry.artist} - ` : ''}
                          {result.entry.title}
                        </p>
                        {result.match ? (
                          <p className="text-xs text-green-400 mt-1">✓ Matched in library</p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">✗ Not found in library</p>
                        )}
                      </div>
                      {result.entry.duration > 0 && (
                        <span className="text-xs text-gray-500">
                          {Math.floor(result.entry.duration / 60)}:{String(result.entry.duration % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setImportResults([])}
                className="w-full px-4 py-2 bg-surface text-light hover:bg-dark transition"
              >
                Clear Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
