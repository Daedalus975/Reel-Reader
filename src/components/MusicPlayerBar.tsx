import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Music2 } from 'lucide-react'
import { useLibraryStore } from '@store/libraryStore'
import { useMusicPlayerStore } from '@store/musicPlayerStore'

function toFileUrl(path?: string) {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.replace(/\\/g, '/').replace(/^\//, '')
  return `file:///${normalized}`
}

function isYouTube(url?: string) {
  if (!url) return false
  return /youtube\.com|youtu\.be/.test(url)
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export const MusicPlayerBar: React.FC = () => {
  const { media, markAsWatched } = useLibraryStore()
  const {
    queue,
    currentIndex,
    isPlaying,
    volume,
    playNext,
    playPrevious,
    setIsPlaying,
    setVolume,
    clear,
  } = useMusicPlayerStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentId = queue[currentIndex]
  const currentMedia = useMemo(() => media.find((m) => m.id === currentId), [media, currentId])

  const sourceUrl = useMemo(() => {
    if (!currentMedia) return undefined
    if (currentMedia.filePath) return toFileUrl(currentMedia.filePath)
    if (currentMedia.previewUrl && !isYouTube(currentMedia.previewUrl)) return currentMedia.previewUrl
    if (currentMedia.trailerUrl && !isYouTube(currentMedia.trailerUrl)) return currentMedia.trailerUrl
    return undefined
  }, [currentMedia])

  // Load and autoplay when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentMedia || !sourceUrl) return
    audio.src = sourceUrl
    audio.currentTime = currentMedia.progress || 0
    audio.volume = volume
    audio.load()
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [currentMedia, sourceUrl, volume, setIsPlaying])

  // Wire audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoaded = () => setDuration(audio.duration || 0)
    const handleTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      if (currentMedia) {
        markAsWatched(currentMedia.id, audio.duration || audio.currentTime || 0)
      }
      playNext()
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('timeupdate', handleTime)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('timeupdate', handleTime)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [currentMedia, markAsWatched, playNext, setIsPlaying])

  // Keep audio volume in sync
  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = volume
  }, [volume])

  // Persist progress when track changes/unmounts
  useEffect(() => {
    return () => {
      if (currentMedia && currentTime > 0) {
        markAsWatched(currentMedia.id, currentTime)
      }
    }
  }, [currentMedia, currentTime, markAsWatched])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const handleSeek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrentTime(value)
  }

  const handleVolumeChange = (value: number) => {
    const vol = Math.max(0, Math.min(1, value))
    setVolume(vol)
    const audio = audioRef.current
    if (audio) {
      audio.volume = vol
      audio.muted = vol === 0
    }
  }

  if (!currentMedia || !sourceUrl) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/95 border-t border-surface px-4 py-3 z-40 backdrop-blur">
      <audio ref={audioRef} className="hidden" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 min-w-[200px]">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-primary text-white hover:bg-primary/80 transition rounded-none"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-light line-clamp-1 flex items-center gap-1">
              <Music2 size={14} className="text-highlight" />
              <span>{currentMedia.title}</span>
            </div>
            <div className="text-xs text-gray-400">
              {currentMedia.description || currentMedia.tags?.[0] || currentMedia.genres[0] || 'Music'}
              {queue.length > 0 && ` • ${currentIndex + 1} / ${queue.length}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playPrevious}
            className="p-2 hover:bg-surface rounded-none text-gray-200"
            aria-label="Previous"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={playNext}
            className="p-2 hover:bg-surface rounded-none text-gray-200"
            aria-label="Next"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-gray-400 w-12 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs text-gray-400 w-12">{formatTime(duration || 0)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-gray-300" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>

        <button
          onClick={clear}
          className="p-2 hover:bg-surface rounded-none text-gray-400"
          aria-label="Clear queue"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
