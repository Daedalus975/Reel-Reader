import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayCircle, Heart } from 'lucide-react'
import type { Media } from '../types'
import { useLibraryStore } from '@store/libraryStore'
import { useUIStore } from '@store/index'
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
  const globalViewMode = useUIStore((s) => s.mediaViewMode) || 'grid'
  const globalSize = useUIStore((s) => s.mediaCardSize) || 'md'
  const [showPreview, setShowPreview] = useState(false)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const previewLoopRef = useRef<{ stop: () => void } | null>(null)
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const youtubeId = getYouTubeId(media.trailerUrl)
  const resolvedViewMode = viewMode ?? globalViewMode
  const resolvedSize = size ?? globalSize
  const isList = resolvedViewMode === 'list'

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
    setShowPreview(true)
    createPreviewLoop(previewContainerRef.current, youtubeId, {
      startAt: 10,
      playDuration: 5,
      skipInterval: 20,
    })
      .then((loop) => {
        previewLoopRef.current = loop
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
    const approxWidth = 208 // px
    const approxHeight = 160 // px
    const x = Math.min(e.clientX, window.innerWidth - approxWidth - 4)
    const y = Math.min(e.clientY, window.innerHeight - approxHeight - 4)
    setContextPos({ x, y })
  }

  const closeContext = () => setContextPos(null)

  const handleToggleFavorite = () => {
    toggleFavorite(media.id)
    closeContext()
  }

  const handleOpenDetail = () => {
    navigate(`/detail/${media.id}`)
    closeContext()
  }

  const imageClass = 'w-full h-full object-cover bg-black/40'

  // Aspect ratio per media type (grid mode)
  const posterAspectClass = useMemo(() => {
    switch (media.type) {
      case 'music':
      case 'podcast':
        return 'aspect-square'
      case 'book':
        return 'aspect-[3/5]'
      case 'movie':
      case 'tv':
      case 'jav':
      default:
        return 'aspect-[2/3]'
    }
  }, [media.type])

  // List thumb sizes by card size
  const listThumbClass = useMemo(() => {
    switch (resolvedSize) {
      case 'xs':
        return 'w-16 h-20 sm:w-20 sm:h-24'
      case 'sm':
        return 'w-24 h-32 sm:w-28 sm:h-36'
      case 'md':
        return 'w-28 h-36 sm:w-32 sm:h-40'
      case 'lg':
      default:
        return 'w-32 h-40 sm:w-36 sm:h-44'
    }
  }, [resolvedSize])

  // Footer min-heights (reduced ~1/3)
  const footerMinGrid = useMemo(() => {
    switch (resolvedSize) {
      case 'xs':
        return 'min-h-[80px]'
      case 'sm':
        return 'min-h-[94px]'
      case 'md':
        return 'min-h-[94px]'
      case 'lg':
      default:
        return 'min-h-[110px]'
    }
  }, [resolvedSize])

  const footerMinList = useMemo(() => {
    switch (resolvedSize) {
      case 'xs':
        return 'min-h-[64px]'
      case 'sm':
        return 'min-h-[74px]'
      case 'md':
        return 'min-h-[80px]'
      case 'lg':
      default:
        return 'min-h-[96px]'
    }
  }, [resolvedSize])

  // Click-away and ESC to close context menu
  useEffect(() => {
    if (!contextPos) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) {
        setContextPos(null)
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextPos(null)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onEsc)
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
      {/* Poster Image Container or Video Preview */}
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

        {/* Overlay on Hover */}
        {!showPreview && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <PlayCircle size={isList ? 28 : 48} className="text-highlight drop-shadow-lg" />
          </div>
        )}

        {/* Favorite Badge */}
        {media.isFavorite && (
          <div className="absolute top-2 right-2 z-20">
            <Heart size={18} className="text-highlight fill-highlight" />
          </div>
        )}

        {/* Rating Badge */}
        {media.rating && (
          <div className="absolute top-2 left-2 z-20 bg-highlight text-dark px-2 py-1 rounded-none font-semibold text-[10px]">
            ⭐ {media.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Card Content */}
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

        {/* Language and Watched Badge */}
        <div className={`flex items-center justify-between ${isList ? 'text-[10px]' : 'text-[10px]'}`}>
          <span className="text-gray-400 uppercase font-medium">{media.language}</span>
          {media.watched && (
            <span className="bg-primary/30 text-primary px-2 py-0.5 rounded-none">
              {media.type === 'book' ? 'Finished' : 'Watched'}
            </span>
          )}
        </div>
      </div>

      {/* Context menu (portal) */}
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
        </div>,
        document.body
      )}
    </motion.div>
  )
}
