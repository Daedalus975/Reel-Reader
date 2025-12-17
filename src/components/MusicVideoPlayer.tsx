import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SkipBack, SkipForward, Play, Pause, Film, X } from 'lucide-react'
import { useLibraryStore } from '@store/libraryStore'
import { useMusicVideoPlaylistStore } from '@store/musicVideoPlaylistStore'

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

export const MusicVideoPlayer: React.FC = () => {
  const { media, markAsWatched } = useLibraryStore()
  const {
    queue,
    currentIndex,
    isPlaying,
    playNext,
    playPrevious,
    setIndex,
    clear,
    setIsPlaying,
  } = useMusicVideoPlaylistStore()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentId = queue[currentIndex]
  const currentMedia = useMemo(() => media.find((m) => m.id === currentId), [media, currentId])

  const sourceUrl = useMemo(() => {
    if (!currentMedia) return undefined
    if (currentMedia.trailerUrl) return currentMedia.trailerUrl
    if (currentMedia.previewUrl) return currentMedia.previewUrl
    if (currentMedia.filePath) return toFileUrl(currentMedia.filePath)
    return undefined
  }, [currentMedia])

  const isYouTubeSource = isYouTube(sourceUrl)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentMedia || !sourceUrl || isYouTubeSource) return
    video.src = sourceUrl
    video.currentTime = currentMedia.progress || 0
    video.load()
    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [currentMedia, sourceUrl, isYouTubeSource, setIsPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video || isYouTubeSource) return

    const handleLoaded = () => setDuration(video.duration || 0)
    const handleTime = () => setCurrentTime(video.currentTime)
    const handleEnded = () => {
      if (currentMedia) {
        markAsWatched(currentMedia.id, video.duration || video.currentTime || 0)
      }
      playNext()
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('timeupdate', handleTime)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('timeupdate', handleTime)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [currentMedia, isYouTubeSource, markAsWatched, playNext, setIsPlaying])

  useEffect(() => {
    return () => {
      if (currentMedia && currentTime > 0) {
        markAsWatched(currentMedia.id, currentTime)
      }
    }
  }, [currentMedia, currentTime, markAsWatched])

  const handlePlayPause = () => {
    if (isYouTubeSource) return
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const handleSeek = (value: number) => {
    if (isYouTubeSource) return
    const video = videoRef.current
    if (!video) return
    video.currentTime = value
    setCurrentTime(value)
  }

  if (!currentMedia || !sourceUrl) {
    return null
  }

  return (
    <div className="bg-dark border border-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-light font-semibold">
          <Film size={18} className="text-highlight" />
          <span>Now Playing</span>
          <span className="text-gray-400 text-sm">{currentMedia.title}</span>
        </div>
        <button onClick={clear} className="text-gray-400 hover:text-light" aria-label="Clear playlist">
          <X size={16} />
        </button>
      </div>

      <div className="w-full bg-black">
        {isYouTubeSource ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={sourceUrl.replace('watch?v=', 'embed/')} 
              title="Music Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={sourceUrl}
            className="w-full aspect-video bg-black"
            controls
            preload="metadata"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={playPrevious} className="p-2 bg-surface text-light hover:bg-surface/70 rounded-none" aria-label="Previous">
          <SkipBack size={16} />
        </button>
        {!isYouTubeSource && (
          <button onClick={handlePlayPause} className="p-2 bg-primary text-white rounded-none hover:bg-primary/80" aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}
        <button onClick={playNext} className="p-2 bg-surface text-light hover:bg-surface/70 rounded-none" aria-label="Next">
          <SkipForward size={16} />
        </button>
        {!isYouTubeSource && (
          <div className="flex items-center gap-2 w-full">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="text-xs text-gray-400 min-w-[70px] text-right">
              {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
            </span>
          </div>
        )}
        {isYouTubeSource && (
          <span className="text-xs text-gray-400">Use YouTube controls to play/pause</span>
        )}
      </div>

      <div className="max-h-40 overflow-auto border-t border-surface pt-3">
        {queue.map((id, idx) => {
          const item = media.find((m) => m.id === id)
          if (!item) return null
          const active = idx === currentIndex
          return (
            <button
              key={id}
              onClick={() => setIndex(idx)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 ${active ? 'bg-surface text-light' : 'text-gray-300 hover:bg-surface/70'}`}
            >
              <span className="text-xs text-gray-500 w-8">{idx + 1}</span>
              <span className="text-sm truncate">{item.title}</span>
              <span className="text-xs text-gray-500 truncate">{item.genres[0] ?? 'Music'}</span>
            </button>
          )
        })}
        {queue.length === 0 && <p className="text-xs text-gray-400">No playlist yet.</p>}
      </div>
    </div>
  )
}
