import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PlayerControls, Button } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'

function toFileUrl(path?: string) {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  // Windows paths -> file:///C:/...
  const normalized = path.replace(/\\/g, '/')
  return `file:///${normalized.replace(/^\//, '')}`
}

function isYouTube(url?: string) {
  if (!url) return false
  return /youtube\.com|youtu\.be/.test(url)
}

export const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }> ()
  const { media, markAsWatched, toggleFavorite } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  useEffect(() => {
    setCurrentPage(`/watch/${id ?? ''}`)
  }, [id, setCurrentPage])

  const item = useMemo(() => media.find((m) => m.id === id), [media, id])

  const sourceUrl = useMemo(() => {
    if (!item) return undefined
    if (item.filePath) return toFileUrl(item.filePath)
    if (item.trailerUrl && !isYouTube(item.trailerUrl)) return item.trailerUrl
    return undefined
  }, [item])

  const youtubeTrailer = useMemo(() => (item?.trailerUrl && isYouTube(item.trailerUrl) ? item.trailerUrl : undefined), [item])

  // Attach media events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoaded = () => {
      setDuration(video.duration || 0)
      if (item?.progress) {
        video.currentTime = item.progress
        setCurrentTime(item.progress)
      }
    }
    const handleTime = () => setCurrentTime(video.currentTime)
    const handleEnded = () => {
      if (item) {
        markAsWatched(item.id, video.duration || video.currentTime || 0)
      }
      setIsPlaying(false)
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.volume = volume
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
  }, [item, markAsWatched, volume])

  // Persist progress on unmount
  useEffect(() => {
    return () => {
      if (item && currentTime > 0) {
        markAsWatched(item.id, currentTime)
      }
    }
  }, [item, currentTime, markAsWatched])

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const handleSeek = (time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }

  const handleVolume = (v: number) => {
    const video = videoRef.current
    setVolume(v)
    if (video) {
      video.volume = v
      video.muted = v === 0
    }
  }

  if (!item) {
    return (
      <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
        <div className="bg-surface p-6 rounded-none">
          <h1 className="text-2xl font-bold text-light mb-2">Not found</h1>
          <p className="text-gray-400 mb-4">The requested media could not be located.</p>
          <Link to="/library" className="text-primary font-semibold">Back to Library</Link>
        </div>
      </main>
    )
  }

  const hasPlayableVideo = !!sourceUrl

  return (
    <main className="pt-20 pb-24 px-0 md:px-0 bg-black text-light min-h-screen">
      <div className="w-full bg-black">
        {hasPlayableVideo ? (
          <video
            ref={videoRef}
            src={sourceUrl}
            className="w-full aspect-video bg-black"
            controls={false}
            onClick={handlePlayPause}
            preload="metadata"
          />
        ) : youtubeTrailer ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={youtubeTrailer.replace('watch?v=', 'embed/')}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-dark flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg font-semibold">No playable source</p>
              <p className="text-sm text-gray-500">Add a local file or trailer URL in Edit.</p>
              <Link to={`/detail/${item.id}`} className="text-primary underline text-sm mt-2 inline-block">Go to Detail</Link>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 space-y-2 bg-dark border-t border-surface">
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <p className="text-gray-400 text-sm">{item.year ?? 'Year N/A'} • {item.language} • {item.type.toUpperCase()}</p>
        <div className="flex gap-2 mt-2">
          {hasPlayableVideo && (
            <Button variant="primary" size="sm" onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => markAsWatched(item.id, currentTime)}>Mark as Watched</Button>
          <Button variant="secondary" size="sm" onClick={() => toggleFavorite(item.id)}>
            {item.isFavorite ? 'Unfavorite' : 'Favorite'}
          </Button>
          <Link to={`/detail/${item.id}`} className="text-sm text-primary underline self-center">Details</Link>
        </div>
      </div>

      {hasPlayableVideo && (
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolume}
        />
      )}
    </main>
  )
}
