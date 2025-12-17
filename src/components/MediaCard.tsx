import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayCircle, Heart, ChevronRight } from 'lucide-react'
import type { Media } from '../types'
import { useLibraryStore } from '@store/libraryStore'
import { useUIStore } from '@store/index'
import { useSpotifyStore } from '@store/spotifyStore'
import { isSpotifyConnected } from '@/services/spotify'
import { addTracksToPlaylist } from '@/services/spotifyFeatures'
import { createPreviewLoop } from '../services/youtubePreview'

interface MediaCardProps {
  media: Media
  onClick?: () => void
  size?: 'xs' | 'sm' | 'md' | 'lg'
  viewMode?: 'grid' | 'list'
}

function getYouTubeId(url?: string) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, onClick, size, viewMode }) => {
  const navigate = useNavigate()
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite)
  const removeMedia = useLibraryStore((s) => s.removeMedia)
  const globalViewMode = useUIStore((s) => s.mediaViewMode) || 'grid'
  const globalSize = useUIStore((s) => s.mediaCardSize) || 'md'
  const [showPreview, setShowPreview] = useState(false)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const previewLoopRef = useRef<{ stop: () => void } | null>(null)
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null)
  const [showSpotifySubmenu, setShowSpotifySubmenu] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const youtubeId = getYouTubeId(media.trailerUrl)
  const resolvedViewMode = viewMode ?? globalViewMode
  const resolvedSize = size ?? globalSize
  const isList = resolvedViewMode === 'list'

  const spotifyPlaylists = useSpotifyStore((s) => s.playlists)
  const spotifyConnected = isSpotifyConnected()
  const canAddToSpotify = media.type === 'music' && media.spotifyTrackId && spotifyConnected && spotifyPlaylists.length > 0

  const containerClasses = isList
    ? 'group relative bg-surface rounded-none cursor-pointer overflow-hidden shadow-md hover:shadow-xl flex gap-3 sm:gap-4 p-3'
    : 'group relative bg-surface rounded-none cursor-pointer overflow-hidden shadow-md hover:shadow-xl'

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    navigate(`/detail/${media.id}`)
  }

  const handleMouseEnter = () => {
    if (media.type !== 'music') return
    if (!youtubeId || !previewContainerRef.current || previewLoopRef.current) return
    createPreviewLoop(previewContainerRef.current, youtubeId, {
      startAt: 10,
      playDuration: 5,
      skipInterval: 20,
    })
      .then((loop) => {
        previewLoopRef.current = loop
        setShowPreview(true)
      })
      .catch(() => setShowPreview(false))
  }

  const handleMouseLeave = () => {
    setShowPreview(false)
    if (previewLoopRef.current) {
      previewLoopRef.current.stop()
      previewLoopRef.current = null
    }
  }

  const handleContextMenu: React.MouseEventHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const approxWidth = 208
    const approxHeight = 160
    const x = Math.min(e.clientX, window.innerWidth - approxWidth - 4)
    const y = Math.min(e.clientY, window.innerHeight - approxHeight - 4)
    setContextPos({ x, y })
  }

  const closeContext = () => {
    setContextPos(null)
    setShowSpotifySubmenu(false)
  }

  const handleToggleFavorite = () => {
    toggleFavorite(media.id)
    closeContext()
  }

  const handleDelete = () => {
    removeMedia(media.id)
    closeContext()
  }

  const handleOpenDetail = () => {
    navigate(`/detail/${media.id}`)
    closeContext()
  }

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!media.spotifyTrackId) return
    await addTracksToPlaylist(playlistId, [media.spotifyTrackId])
    closeContext()
  }

  const imageClass = 'w-full h-full object-cover bg-black/40'

  const posterAspectClass = useMemo(() => {
    switch (media.type) {
      case 'music':
      case 'podcast':
        return 'aspect-square'
      case 'book':
        return 'aspect-[3/5]'
      default:
        return 'aspect-[2/3]'
    }
  }, [media.type])

  const listThumbClass = useMemo(() => {
    if (!isList) return ''
    const sizeMap = { xs: 'w-12 h-12', sm: 'w-14 h-14', md: 'w-16 h-16', lg: 'w-20 h-20' }
    return sizeMap[resolvedSize]
  }, [isList, resolvedSize])

  const footerMinGrid = useMemo(() => {
    if (isList) return ''
    const sizeMap = { xs: 'min-h-[36px]', sm: 'min-h-[42px]', md: 'min-h-[48px]', lg: 'min-h-[58px]' }
    return sizeMap[resolvedSize]
  }, [isList, resolvedSize])

  const footerMinList = useMemo(() => {
    if (!isList) return ''
    const sizeMap = { xs: 'min-h-[32px]', sm: 'min-h-[36px]', md: 'min-h-[42px]', lg: 'min-h-[52px]' }
    return sizeMap[resolvedSize]
  }, [isList, resolvedSize])

  useEffect(() => {
    if (!contextPos) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeContext()
    }
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContext()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [contextPos])

  return (
    <motion.div
      whileHover={{ scale: isList ? 1 : 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={containerClasses}
    >
      <div
        className={
          isList
            ? `relative overflow-hidden ${listThumbClass} bg-dark flex-shrink-0`
            : `relative overflow-hidden ${posterAspectClass} w-full bg-dark`
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showPreview && youtubeId ? (
          <div ref={previewContainerRef} className="w-full h-full" />
        ) : media.poster ? (
          <img src={media.poster} alt={media.title} className={imageClass} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface text-light/50 text-sm">
            No Image
          </div>
        )}

        {!showPreview && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <PlayCircle size={isList ? 28 : 48} className="text-highlight drop-shadow-lg" />
          </div>
        )}

        {media.isFavorite && (
          <div className="absolute top-2 right-2 z-20">
            <Heart size={18} className="text-highlight fill-highlight" />
          </div>
        )}

        {media.rating && (
          <div className="absolute top-2 left-2 z-20 bg-highlight text-dark px-2 py-1 rounded-none font-semibold text-[10px]">
            ⭐ {media.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className={isList ? `flex-1 flex flex-col justify-between ${footerMinList}` : `p-2 space-y-1 ${footerMinGrid} flex flex-col justify-between`}>
        <div className={isList ? 'pr-2' : ''}>
          <h3 className={`${isList ? 'text-[13px]' : 'text-sm'} font-semibold text-light truncate group-hover:text-highlight transition-colors`}>
            {media.title}
          </h3>

          {media.type === 'music' ? (
            <p className={`${isList ? 'text-[11px]' : 'text-[11px]'} text-gray-400 truncate`}>
              {media.description || media.artist || media.tags[0] || ''}
            </p>
          ) : (
            <p className={`${isList ? 'text-[11px]' : 'text-[11px]'} text-gray-400 truncate`}>
              {media.year && <span>{media.year}</span>}
              {media.year && media.genres[0] && <span> • </span>}
              {media.genres[0] && <span>{media.genres[0]}</span>}
            </p>
          )}
        </div>

        <div className={`flex items-center justify-between ${isList ? 'text-[10px]' : 'text-[10px]'}`}>
          <span className="text-gray-400 uppercase font-medium">{media.language}</span>
          {media.watched && (
            <span className="bg-primary/30 text-primary px-2 py-0.5 rounded-none">
              {media.type === 'book' ? 'Finished' : 'Watched'}
            </span>
          )}
        </div>
      </div>

      {contextPos && createPortal(
        <div
          ref={menuRef}
          className="z-[1000] fixed w-52 bg-surface border border-dark shadow-lg rounded-none text-sm text-light"
          style={{ top: contextPos.y, left: contextPos.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="block w-full text-left px-4 py-2 hover:bg-dark" onClick={handleOpenDetail}>
            Open details
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-dark" onClick={handleToggleFavorite}>
            {media.isFavorite ? 'Remove favorite' : 'Add to favorites'}
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-dark"
            onClick={() => {
              closeContext()
              handleClick()
            }}
          >
            Play / open
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-dark text-red-400" onClick={handleDelete}>
            Delete from library
          </button>
          {canAddToSpotify && (
            <div className="relative">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-dark flex items-center justify-between"
                onMouseEnter={() => setShowSpotifySubmenu(true)}
                onMouseLeave={() => setShowSpotifySubmenu(false)}
              >
                <span>Add to Spotify playlist</span>
                <ChevronRight size={14} />
              </button>
              {showSpotifySubmenu && (
                <div
                  className="absolute left-full top-0 ml-1 w-56 bg-surface border border-dark shadow-lg rounded-none max-h-64 overflow-y-auto"
                  onMouseEnter={() => setShowSpotifySubmenu(true)}
                  onMouseLeave={() => setShowSpotifySubmenu(false)}
                >
                  {spotifyPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      className="block w-full text-left px-4 py-2 hover:bg-dark text-sm truncate"
                      onClick={() => handleAddToPlaylist(pl.id)}
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </motion.div>
  )
}
