import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { VideoPlayer, Button } from '@components/index'
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
  const { id } = useParams<{ id: string }>()
  const { media, markAsWatched, toggleFavorite, updateMedia } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const navigate = useNavigate()

  const [currentTime, setCurrentTime] = useState(0)

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

  // Persist progress on unmount
  useEffect(() => {
    return () => {
      if (item && currentTime > 0) {
        updateMedia(item.id, { progress: currentTime })
      }
    }
  }, [item, currentTime, updateMedia])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handleEnded = () => {
    if (item) {
      markAsWatched(item.id, currentTime)
    }
  }

  const handlePlay = () => {}
  const handlePause = () => {}
  // Find next episode for TV shows
  const nextEpisode = useMemo(() => {
    if (!item || item.type !== 'tv') return null
    // Simple logic: find next item in library with same title prefix
    const current = media.find((m) => m.id === id)
    if (!current) return null
    const titleBase = current.title.split('-')[0].trim()
    const next = media.find(
      (m) =>
        m.type === 'tv' &&
        m.id !== id &&
        m.title.startsWith(titleBase) &&
        (m.year === current.year || !m.year)
    )
    return next || null
  }, [item, media, id])

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
    <main className="pt-16 pb-0 px-0 bg-black text-light min-h-screen">
      <div className="w-full bg-black">
        {hasPlayableVideo ? (
          <VideoPlayer
            src={sourceUrl}
            poster={item.poster}
            currentTime={item.progress || 0}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onPlay={handlePlay}
            onPause={handlePause}
            className="w-full"
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

      <div className="p-4 md:p-6 space-y-3 bg-dark border-t border-surface">
        <div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <p className="text-gray-400 text-sm">
            {item.year ?? 'Year N/A'} • {item.language} • {item.type.toUpperCase()}
            {item.watched && <span className="ml-2 text-green-400">✓ Watched</span>}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => markAsWatched(item.id, currentTime)}>
            {item.watched ? 'Mark Unwatched' : 'Mark as Watched'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleFavorite(item.id)}>
            {item.isFavorite ? '★ Favorited' : '☆ Favorite'}
          </Button>
          <Link to={`/detail/${item.id}`}>
            <Button variant="secondary" size="sm">Details</Button>
          </Link>
          {nextEpisode && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/watch/${nextEpisode.id}`)}
            >
              Next Episode →
            </Button>
          )}
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-300 mt-2 max-w-4xl">{item.description}</p>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          <p>Keyboard shortcuts: Space (play/pause) • ← → (seek) • F (fullscreen) • M (mute)</p>
        </div>
      </div>
    </main>
  )
}
