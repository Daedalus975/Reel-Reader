import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useUIStore } from '@store/index'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'
import { useMusicVideoPlaylistStore } from '@store/musicVideoPlaylistStore'
import DeviceSelector from '@components/DeviceSelector'

export const FoldoutPlayer: React.FC = () => {
  const { playerOpen, setPlayerOpen, playerEdgeOpenEnabled } = useUIStore()
  const playerRef = useRef<HTMLDivElement>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)

  const { currentTrack, isPlaying, togglePlay, nextTrack, previousTrack, seek } = useSpotifyPlaybackStore((s) => ({
    currentTrack: s.currentTrack,
    isPlaying: s.isPlaying,
    togglePlay: s.togglePlay,
    nextTrack: s.nextTrack,
    previousTrack: s.previousTrack,
    seek: s.seek,
  }))

  // Playlist queue from app store
  const queue = useMusicVideoPlaylistStore((s) => s.queue)
  const currentIndex = useMusicVideoPlaylistStore((s) => s.currentIndex)
  const remove = useMusicVideoPlaylistStore((s) => s.remove)

  useEffect(() => {
    const handleMouseLeave = () => {
      if (playerOpen) {
        hoverTimeout.current = setTimeout(() => {
          setPlayerOpen(false)
        }, 300)
      }
    }

    const handleMouseEnter = () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
    }

    const node = playerRef.current
    if (node) {
      node.addEventListener('mouseenter', handleMouseEnter)
      node.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (node) {
        node.removeEventListener('mouseenter', handleMouseEnter)
        node.removeEventListener('mouseleave', handleMouseLeave)
      }
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
      }
    }
  }, [playerOpen, setPlayerOpen])

  const handleEdgeEnter = () => {
    if (!playerEdgeOpenEnabled || playerOpen) return
    setPlayerOpen(true)
  }

  const handleEdgeLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
  }

  return (
    <>
      {/* Right-edge hover trigger */}
      <div
        className="fixed right-0 top-16 bottom-0 w-8 z-30 hidden md:block hover:bg-primary/10 transition-colors"
        onMouseEnter={handleEdgeEnter}
        onMouseLeave={handleEdgeLeave}
        title="Hover to open player"
      />

      {/* Mobile overlay */}
      {playerOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPlayerOpen(false)} className="fixed inset-0 bg-black/50 md:hidden z-30" />
      )}

      {/* Foldout panel anchored to right */}
      <motion.aside
        ref={playerRef}
        initial={{ x: 360 }}
        animate={{ x: playerOpen ? 0 : 360 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-16 bottom-0 w-80 bg-surface border-l border-dark overflow-y-auto z-40"
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Player</div>
            <div className="flex items-center gap-2">
              <DeviceSelector />
              <button onClick={() => setPlayerOpen(false)} className="p-2 hover:bg-dark/40 rounded" aria-label="Close player">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Track header */}
          <div className="mb-3">
            {currentTrack ? (
              <div className="flex items-center gap-3">
                {currentTrack.albumArt ? <img src={currentTrack.albumArt} alt={currentTrack.name} className="w-14 h-14 object-cover rounded-sm" /> : <div className="w-14 h-14 bg-surface" />}
                <div className="flex-1">
                  <div className="font-semibold text-light">{currentTrack.name}</div>
                  <div className="text-xs text-gray-400">{currentTrack.artist}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">No track playing</div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={previousTrack} className="p-2 hover:bg-dark/50 rounded" aria-label="Previous">
              <SkipBack size={18} />
            </button>
            <button onClick={togglePlay} className="p-3 bg-primary text-white rounded" aria-label="Play/Pause">
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={nextTrack} className="p-2 hover:bg-dark/50 rounded" aria-label="Next">
              <SkipForward size={18} />
            </button>
          </div>

          {currentTrack && (
            <div className="mb-4">
              <div className="text-xs text-gray-400 w-12 text-right">{Math.floor((currentTrack.progress || 0) / 1000 / 60)}:{String(Math.floor((currentTrack.progress || 0) / 1000) % 60).padStart(2, '0')}</div>
              <input
                type="range"
                min={0}
                max={currentTrack.duration || 0}
                step={1000}
                value={Math.min(currentTrack.progress || 0, currentTrack.duration || 0)}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          {/* Queue */}
          <div className="flex-1 overflow-y-auto">
            {/* Reuse MiniPlayer queue UI by selecting from store directly (simple list) */}
            {queue.map((id: string, idx: number) => (
              <div key={id} className={`flex items-center justify-between p-2 ${idx === currentIndex ? 'bg-dark/50' : 'hover:bg-dark/30'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface flex items-center justify-center text-xs rounded-sm">{idx + 1}</div>
                  <div className="text-sm">{id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => remove(id)} className="p-1 hover:bg-dark/40 rounded"><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </motion.aside>
    </>
  )
}

export default FoldoutPlayer
