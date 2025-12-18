import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, X, Menu } from 'lucide-react'
import { useMusicVideoPlaylistStore } from '@store/musicVideoPlaylistStore'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'
import { useLibraryStore } from '@store/libraryStore'
import { useSpotifyStore } from '@store/spotifyStore'

// Persisted key
const MINI_PLAYER_KEY = 'miniPlayer:minimized'

export const MiniPlayer: React.FC = () => {
  const queue = useMusicVideoPlaylistStore((s) => s.queue)
  const currentIndex = useMusicVideoPlaylistStore((s) => s.currentIndex)
  const setQueue = useMusicVideoPlaylistStore((s) => s.setQueue)
  const remove = useMusicVideoPlaylistStore((s) => s.remove)
  const setIndex = useMusicVideoPlaylistStore((s) => s.setIndex)

  const toggle = useSpotifyPlaybackStore((s) => s.togglePlay)
  const isPlaying = useSpotifyPlaybackStore((s) => s.isPlaying)
  const currentTrack = useSpotifyPlaybackStore((s) => s.currentTrack)
  const seek = useSpotifyPlaybackStore((s) => s.seek)

  const [minimized, setMinimized] = useState(() => {
    try {
      return localStorage.getItem(MINI_PLAYER_KEY) === 'true'
    } catch (err) {
      return true
    }
  })
  const dragIndex = useRef<number | null>(null)

  useEffect(() => {
    try { localStorage.setItem(MINI_PLAYER_KEY, minimized ? 'true' : 'false') } catch (err) {}
  }, [minimized])

  const onDragStart = (e: React.DragEvent, idx: number) => {
    dragIndex.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }

  // Sync with spotify current track selection: when index changes, if the queue item corresponds to a spotify track id/uri, try to play it on spotify
  useEffect(() => {
    const idx = currentIndex
    if (idx === -1 || idx >= queue.length) return
    const id = queue[idx]
    // If id looks like a spotify uri, play it on spotify
    if (typeof id === 'string' && id.startsWith('spotify:track:')) {
      // play via spotify store
      useSpotifyPlaybackStore.getState().playTrack(id)
    }
  }, [currentIndex, queue])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null) return
    const to = idx
    if (from === to) return
    const next = [...queue]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setQueue(next)
    dragIndex.current = null
  }

  return (
    <div>
      {minimized ? (
        <button
          title="Open player"
          onClick={() => setMinimized(false)}
          className="fixed right-6 bottom-6 z-50 bg-primary p-3 rounded-full shadow-lg"
        >
          <Menu size={18} className="text-white" />
        </button>
      ) : (
        <div className="fixed right-6 bottom-6 z-50 w-80 bg-dark border border-dark/60 rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-dark/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-surface flex items-center justify-center rounded-sm">MP</div>
              <div className="text-sm">Player</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMinimized(true)}
                className="p-1 hover:bg-dark/50 rounded"
                aria-label="Minimize player"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-3">
            {/* Current Spotify track (if available) */}
            {currentTrack ? (
              <div className="mb-3">
                <div className="flex items-center gap-3 mb-2">
                  {currentTrack.albumArt ? (
                    <img src={currentTrack.albumArt} alt={currentTrack.name} className="w-10 h-10 object-cover rounded-sm" />
                  ) : (
                    <div className="w-10 h-10 bg-surface flex items-center justify-center rounded-sm">MP</div>
                  )}
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-light line-clamp-1">{currentTrack.name}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{currentTrack.artist}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle()} className="p-2 bg-primary text-white rounded" aria-label="Toggle play">
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400 w-10 text-right">{Math.floor((currentTrack.progress || 0) / 1000 / 60)}:{String(Math.floor((currentTrack.progress || 0) / 1000) % 60).padStart(2, '0')}</div>
                  <input
                    type="range"
                    min={0}
                    max={currentTrack.duration || 0}
                    step={1000}
                    value={Math.min(currentTrack.progress || 0, currentTrack.duration || 0)}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <div className="text-xs text-gray-400 w-10">{Math.floor((currentTrack.duration || 0) / 1000 / 60)}:{String(Math.floor((currentTrack.duration || 0) / 1000) % 60).padStart(2, '0')}</div>
                </div>
              </div>
            ) : null}

            <div className="max-h-32 overflow-y-auto">
              {queue.length === 0 ? (
                <div className="text-xs text-gray-400">Queue is empty</div>
              ) : (
                queue.map((id, idx) => {
                  // Resolve metadata: library item -> spotify track -> fallback to id
                  const libItem = useLibraryStore.getState().media.find((m) => m.id === id)
                  const spotifyTracksMap = useSpotifyStore.getState().playlistTracks
                  let resolved: { title: string; subtitle?: string; image?: string } | null = null
                  if (libItem) {
                    resolved = { title: libItem.title, subtitle: libItem.artist, image: libItem.poster }
                  } else {
                    // search spotify tracks cached in playlists
                    for (const key of Object.keys(spotifyTracksMap)) {
                      const t = (spotifyTracksMap as Record<string, any[]>)[key].find((trk) => trk.id === id || trk.uri === id)
                      if (t) {
                        resolved = { title: t.name, subtitle: t.artists.join(', '), image: t.imageUrl }
                        break
                      }
                    }
                  }

                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => onDragStart(e, idx)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, idx)}
                      className={`flex items-center justify-between p-2 rounded ${idx === currentIndex ? 'bg-dark/50' : 'hover:bg-dark/30'}`}
                    >
                      <div className="flex items-center gap-3" onClick={() => setIndex(idx)}>
                        <div className="w-8 h-8 bg-surface flex items-center justify-center text-xs rounded-sm overflow-hidden">
                          {resolved?.image ? <img src={resolved.image} className="w-full h-full object-cover" alt={resolved.title} /> : idx + 1}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-light line-clamp-1">{resolved?.title || id}</div>
                          <div className="text-xs text-gray-400 line-clamp-1">{resolved?.subtitle || ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => remove(id)}
                          className="p-1 hover:bg-dark/40 rounded"
                          title="Remove from queue"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-dark/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggle()}
                className="p-2 bg-primary text-white rounded"
                aria-label="Toggle play"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
            <div className="text-xs text-gray-400">{queue.length} in queue</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MiniPlayer

