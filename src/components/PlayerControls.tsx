import React from 'react'
import { Play, Pause, Volume2, Settings, Maximize } from 'lucide-react'
import { motion } from 'framer-motion'

interface PlayerControlsProps {
  isPlaying?: boolean
  onPlayPause?: () => void
  onSettings?: () => void
  duration?: number
  currentTime?: number
  onSeek?: (time: number) => void
  volume?: number
  onVolumeChange?: (volume: number) => void
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying = false,
  onPlayPause,
  onSettings,
  duration = 0,
  currentTime = 0,
  onSeek,
  volume = 0.8,
  onVolumeChange,
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-0 left-0 right-0 bg-dark border-t border-surface p-4 z-50"
    >
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-surface h-1 rounded-full overflow-hidden cursor-pointer group">
          <div
            className="h-full bg-primary transition-all duration-100 group-hover:bg-highlight"
            style={{ width: `${progressPercent}%` }}
            onClick={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect()
              if (rect && onSeek) {
                const percent = (e.clientX - rect.left) / rect.width
                onSeek(percent * duration)
              }
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayPause}
            className="p-2 bg-primary hover:bg-primary/80 text-white rounded-none transition"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => onVolumeChange?.(Number(e.target.value) / 100)}
              className="w-20 accent-primary"
            />
          </div>
        </div>

        {/* Time Display */}
        <span className="text-xs text-gray-400 font-medium">
          {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} /{' '}
          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
        </span>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSettings}
            className="p-2 hover:bg-surface rounded-none transition text-gray-400 hover:text-light"
          >
            <Settings size={16} />
          </button>
          <button className="p-2 hover:bg-surface rounded-none transition text-gray-400 hover:text-light">
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
