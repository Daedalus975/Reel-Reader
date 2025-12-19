import React from 'react'
import { Media } from '../types'
import { Heart, Download, Copy, ExternalLink, X } from 'lucide-react'
import { ComicReader } from './ComicReader'

interface DoujinDetailLayoutProps {
  media: Media
  onToggleFavorite?: () => void
}

export const DoujinDetailLayout: React.FC<DoujinDetailLayoutProps> = ({ media, onToggleFavorite }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (date?: Date | string) => {
    if (!date) return undefined
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - d.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const renderTagSection = (title: string, tags: string[] | undefined, tagType?: string) => {
    if (!tags || tags.length === 0) return null

    return (
      <div className="mb-2">
        <span className="text-gray-400 text-sm font-medium">{title}: </span>
        {tags.map((tag, idx) => (
          <React.Fragment key={idx}>
            <button
              className="text-primary hover:underline text-sm"
              onClick={() => {
                // TODO: Filter library by this tag
                console.log('Filter by', tagType || title, tag)
              }}
            >
              {tag}
            </button>
            {idx < tags.length - 1 && <span className="text-gray-500 mx-1">•</span>}
          </React.Fragment>
        ))}
      </div>
    )
  }

  const renderTag = (label: string, value: string | number | undefined, count?: number) => {
    if (!value) return null
    
    return (
      <button
        className="inline-flex items-center gap-1 px-2 py-1 bg-surface rounded text-sm hover:bg-surface/80 transition"
        onClick={() => {
          // TODO: Filter library by this tag
          console.log('Filter by', label, value)
        }}
      >
        <span className="text-gray-400">{label}</span>
        {count && <span className="text-gray-500 text-xs">{count}</span>}
      </button>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 p-6">
      {/* Cover Image */}
      <div className="flex flex-col items-center lg:items-start">
        {media.poster ? (
          <img
            src={media.poster}
            alt={media.title}
            className="w-64 h-auto rounded shadow-lg"
          />
        ) : (
          <div className="w-64 h-96 bg-surface rounded flex items-center justify-center">
            <span className="text-gray-500">No Cover</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-4 w-full">
          <button
            onClick={onToggleFavorite}
            className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 transition ${
              media.isFavorite
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-surface/80 text-gray-300'
            }`}
          >
            <Heart size={18} fill={media.isFavorite ? 'currentColor' : 'none'} />
            <span>Favorite</span>
            {media.favoriteCount && (
              <span className="text-xs">({media.favoriteCount.toLocaleString()})</span>
            )}
          </button>
          
          <button
            onClick={() => window.location.href = `/detail/${media.id}?edit=true`}
            className="w-full px-4 py-2 bg-surface hover:bg-surface/80 rounded flex items-center justify-center gap-2 text-gray-300 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
          
          {media.sourceUrl && (
            <a
              href={media.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 bg-surface hover:bg-surface/80 rounded flex items-center justify-center gap-2 text-gray-300 transition"
              title="Open source"
            >
              <ExternalLink size={18} />
              <span>Source</span>
            </a>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-light mb-2">{media.title}</h1>
          {media.originalTitle && (
            <h2 className="text-xl text-gray-400 mb-2">{media.originalTitle}</h2>
          )}
        </div>

        {/* Gallery ID */}
        {media.galleryId && (
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-2xl font-bold">{media.galleryId}</span>
            <button
              onClick={() => copyToClipboard(media.galleryId!)}
              className="p-1 hover:text-primary transition"
              title="Copy ID"
            >
              <Copy size={16} />
            </button>
          </div>
        )}

        {/* Parodies */}
        {renderTagSection('Parodies', media.parodies, 'parody')}

        {/* Characters */}
        {renderTagSection('Characters', media.characters, 'character')}

        {/* Tags - Primary Display */}
        {media.tags && media.tags.length > 0 && (
          <div>
            <span className="text-gray-400 text-sm font-medium mb-2 block">Tags:</span>
            <div className="flex flex-wrap gap-2">
              {media.tags.map((tag, idx) => (
                <button
                  key={idx}
                  className="px-3 py-1 bg-surface hover:bg-primary/20 rounded text-sm transition"
                  onClick={() => {
                    // TODO: Filter by tag
                    console.log('Filter by tag', tag)
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Artists */}
        {renderTagSection('Artists', media.artists, 'artist')}

        {/* Groups/Circles */}
        {renderTagSection('Groups', media.groups, 'group')}

        {/* Languages */}
        {renderTagSection('Languages', media.doujinLanguages, 'language')}

        {/* Categories */}
        {renderTagSection('Categories', media.doujinCategories, 'category')}

        {/* Pages */}
        {media.pageCount && (
          <div>
            <span className="text-gray-400 text-sm">Pages: </span>
            <span className="text-light font-medium">{media.pageCount}</span>
          </div>
        )}

        {/* Upload Date */}
        {(media.uploadedAt || media.dateAdded) && (
          <div>
            <span className="text-gray-400 text-sm">Uploaded: </span>
            <span className="text-light">
              {formatDate(media.uploadedAt || media.dateAdded)}
            </span>
          </div>
        )}

        {/* Description */}
        {media.description && (
          <div>
            <p className="text-gray-300 text-sm">{media.description}</p>
          </div>
        )}

        {/* Source URL */}
        {media.sourceUrl && (
          <div>
            <span className="text-gray-400 text-sm">Source: </span>
            <a
              href={media.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              {media.sourceUrl}
            </a>
          </div>
        )}
      </div>

      {/* Page Reader */}
      {media.pageCount && media.description && (
        <div className="col-span-1 lg:col-span-2 mt-8">
          <DoujinPageReader media={media} />
        </div>
      )}
    </div>
  )
}

// Page Reader Component
const DoujinPageReader: React.FC<{ media: Media }> = ({ media }) => {
  const [pages, setPages] = React.useState<string[]>([])
  const [readerOpen, setReaderOpen] = React.useState(false)
  const [initialPage, setInitialPage] = React.useState(0)

  React.useEffect(() => {
    // Extract media_id and extensions from description
    const mediaIdMatch = media.description?.match(/media_id: (\d+)/)
    const extsMatch = media.description?.match(/exts: ([^•]+)/)
    
    if (mediaIdMatch && media.pageCount) {
      const mediaId = mediaIdMatch[1]
      const extensions = extsMatch 
        ? extsMatch[1].split(',').map(e => e.trim())
        : Array(media.pageCount).fill('jpg')
      
      // Generate page URLs for nhentai
      const pageUrls = Array.from({ length: media.pageCount }, (_, i) => {
        const pageNum = i + 1
        const ext = extensions[i] || 'jpg'
        return `https://i.nhentai.net/galleries/${mediaId}/${pageNum}.${ext}`
      })
      
      setPages(pageUrls)
    }
  }, [media])

  const openReader = (pageIndex: number = 0) => {
    setInitialPage(pageIndex)
    setReaderOpen(true)
  }

  if (pages.length === 0) return null

  return (
    <>
      <div className="bg-dark/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-light">Pages</h2>
          <button
            onClick={() => openReader(0)}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded transition"
          >
            Open Reader
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {pages.map((pageUrl, index) => (
            <button
              key={index}
              onClick={() => openReader(index)}
              className="relative aspect-[2/3] bg-surface rounded overflow-hidden hover:ring-2 hover:ring-primary transition group"
            >
              <img
                src={pageUrl}
                alt={`Page ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">
                  {index + 1}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Full-Featured Comic Reader */}
      {readerOpen && (
        <ComicReader
          media={media}
          onClose={() => setReaderOpen(false)}
          initialPage={initialPage}
        />
      )}
    </>
  )
}
