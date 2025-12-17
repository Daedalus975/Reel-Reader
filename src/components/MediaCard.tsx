import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayCircle, Heart } from 'lucide-react'
import type { Media } from '../types'

interface MediaCardProps {
  media: Media
  onClick?: () => void
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, onClick }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    navigate(`/detail/${media.id}`)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={handleClick}
      className="group relative bg-surface rounded-none cursor-pointer overflow-hidden shadow-md hover:shadow-xl"
    >
      {/* Poster Image Container */}
      <div className="relative overflow-hidden h-72 w-full bg-dark">
        {media.poster ? (
          <img
            src={media.poster}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface text-light/50 text-sm">
            No Image
          </div>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <PlayCircle size={56} className="text-highlight drop-shadow-lg" />
        </div>

        {/* Favorite Badge */}
        {media.isFavorite && (
          <div className="absolute top-2 right-2 z-20">
            <Heart size={20} className="text-highlight fill-highlight" />
          </div>
        )}

        {/* Rating Badge */}
        {media.rating && (
          <div className="absolute top-2 left-2 z-20 bg-highlight text-dark px-2 py-1 rounded-none font-semibold text-xs">
            ⭐ {media.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-2 min-h-[140px] flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-light truncate group-hover:text-highlight transition-colors">
            {media.title}
          </h3>

          {media.type === 'music' ? (
            <p className="text-xs text-gray-400 truncate">
              {media.description || media.tags[0] || ''}
            </p>
          ) : (
            <p className="text-xs text-gray-400 truncate">
              {media.year && <span>{media.year}</span>}
              {media.year && media.genres[0] && <span> • </span>}
              {media.genres[0] && <span>{media.genres[0]}</span>}
            </p>
          )}
        </div>

        {/* Language and Watched Badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 uppercase font-medium">{media.language}</span>
          {media.watched && (
            <span className="bg-primary/30 text-primary px-2 py-0.5 rounded-none">
              {media.type === 'book' ? 'Finished' : 'Watched'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
