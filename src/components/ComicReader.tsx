import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, Settings, BookOpen, ArrowLeftRight, RotateCw } from 'lucide-react'
import { Media } from '../types'

interface ComicReaderProps {
  media: Media
  onClose: () => void
  initialPage?: number
}

type ReadingMode = 'single' | 'double' | 'continuous'
type FitMode = 'width' | 'height' | 'original'
type ReadingDirection = 'ltr' | 'rtl'

export const ComicReader: React.FC<ComicReaderProps> = ({ media, onClose, initialPage = 0 }) => {
  const [pages, setPages] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [zoom, setZoom] = useState(100)
  const [fitMode, setFitMode] = useState<FitMode>('width')
  const [readingMode, setReadingMode] = useState<ReadingMode>('single')
  const [readingDirection, setReadingDirection] = useState<ReadingDirection>('ltr')
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rotation, setRotation] = useState(0)

  // Extract pages from media
  useEffect(() => {
    const extractPages = () => {
      // For doujinshi imported from nhentai/hitomi
      const mediaIdMatch = media.description?.match(/media_id: (\d+)/)
      const extsMatch = media.description?.match(/exts: ([^•]+)/)
      
      if (mediaIdMatch && media.pageCount) {
        const mediaId = mediaIdMatch[1]
        const extensions = extsMatch 
          ? extsMatch[1].split(',').map(e => e.trim())
          : Array(media.pageCount).fill('jpg')
        
        const pageUrls = Array.from({ length: media.pageCount }, (_, i) => {
          const pageNum = i + 1
          const ext = extensions[i] || 'jpg'
          return `https://i.nhentai.net/galleries/${mediaId}/${pageNum}.${ext}`
        })
        
        setPages(pageUrls)
      }
      // For regular books/comics with file paths
      else if (media.filePath) {
        // TODO: Extract pages from CBZ/CBR/PDF files
        // This will require a backend service or Tauri command
        console.log('File-based comic reading not yet implemented')
      }
    }

    extractPages()
  }, [media])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        readingDirection === 'ltr' ? previousPage() : nextPage()
      } else if (e.key === 'ArrowRight') {
        readingDirection === 'ltr' ? nextPage() : previousPage()
      } else if (e.key === 'Home') {
        goToFirst()
      } else if (e.key === 'End') {
        goToLast()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      } else if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(z + 10, 300))
      } else if (e.key === '-' || e.key === '_') {
        setZoom(z => Math.max(z - 10, 50))
      } else if (e.key === '0') {
        setZoom(100)
      } else if (e.key === '1') {
        setFitMode('width')
      } else if (e.key === '2') {
        setFitMode('height')
      } else if (e.key === '3') {
        setFitMode('original')
      } else if (e.key === 'd' || e.key === 'D') {
        setReadingMode(m => m === 'double' ? 'single' : 'double')
      } else if (e.key === 'r' || e.key === 'R') {
        setReadingDirection(d => d === 'ltr' ? 'rtl' : 'ltr')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, pages.length, readingDirection])

  const nextPage = useCallback(() => {
    if (readingMode === 'double' && currentPage < pages.length - 2) {
      setCurrentPage(currentPage + 2)
    } else if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, pages.length, readingMode])

  const previousPage = useCallback(() => {
    if (readingMode === 'double' && currentPage > 1) {
      setCurrentPage(currentPage - 2)
    } else if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage, readingMode])

  const goToFirst = () => setCurrentPage(0)
  const goToLast = () => setCurrentPage(pages.length - 1)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleRotate = () => {
    setRotation((rotation + 90) % 360)
  }

  const getFitModeStyles = () => {
    switch (fitMode) {
      case 'width':
        return 'w-full h-auto'
      case 'height':
        return 'h-full w-auto'
      case 'original':
        return 'max-w-none max-h-none'
      default:
        return 'w-full h-auto'
    }
  }

  const getCurrentPages = () => {
    if (readingMode === 'double' && currentPage < pages.length - 1) {
      if (readingDirection === 'rtl') {
        return [pages[currentPage + 1], pages[currentPage]]
      }
      return [pages[currentPage], pages[currentPage + 1]]
    }
    return [pages[currentPage]]
  }

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Loading pages...</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary/80 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const currentPages = getCurrentPages()
  const displayPageNumber = readingMode === 'double' 
    ? `${currentPage + 1}-${Math.min(currentPage + 2, pages.length)}`
    : `${currentPage + 1}`

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark/90 text-light">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded transition"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-sm">{media.title}</h2>
            <p className="text-xs text-gray-400">
              Page {displayPageNumber} / {pages.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={() => setZoom(z => Math.max(z - 10, 50))}
            className="p-2 hover:bg-surface rounded transition"
            title="Zoom Out (-)"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm min-w-[4rem] text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(z + 10, 300))}
            className="p-2 hover:bg-surface rounded transition"
            title="Zoom In (+)"
          >
            <ZoomIn size={18} />
          </button>

          {/* Fit Mode */}
          <select
            value={fitMode}
            onChange={(e) => setFitMode(e.target.value as FitMode)}
            className="bg-surface text-light px-3 py-1 rounded text-sm"
            title="Fit Mode (1/2/3)"
          >
            <option value="width">Fit Width</option>
            <option value="height">Fit Height</option>
            <option value="original">Original</option>
          </select>

          {/* Reading Mode */}
          <button
            onClick={() => setReadingMode(m => m === 'double' ? 'single' : 'double')}
            className="p-2 hover:bg-surface rounded transition"
            title="Toggle Single/Double Page (D)"
          >
            <BookOpen size={18} />
          </button>

          {/* Reading Direction */}
          <button
            onClick={() => setReadingDirection(d => d === 'ltr' ? 'rtl' : 'ltr')}
            className="p-2 hover:bg-surface rounded transition"
            title="Toggle Reading Direction (R)"
          >
            <ArrowLeftRight size={18} />
            <span className="text-xs ml-1">{readingDirection.toUpperCase()}</span>
          </button>

          {/* Rotation */}
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-surface rounded transition"
            title="Rotate Image"
          >
            <RotateCw size={18} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-surface rounded transition"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-surface rounded transition"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-14 right-4 bg-surface border border-dark rounded-lg p-4 text-light z-20 w-80">
          <h3 className="font-semibold mb-3">Reader Settings</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Reading Mode</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setReadingMode('single')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    readingMode === 'single' ? 'bg-primary' : 'bg-dark'
                  }`}
                >
                  Single Page
                </button>
                <button
                  onClick={() => setReadingMode('double')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    readingMode === 'double' ? 'bg-primary' : 'bg-dark'
                  }`}
                >
                  Double Page
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400">Reading Direction</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setReadingDirection('ltr')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    readingDirection === 'ltr' ? 'bg-primary' : 'bg-dark'
                  }`}
                >
                  Left to Right
                </button>
                <button
                  onClick={() => setReadingDirection('rtl')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    readingDirection === 'rtl' ? 'bg-primary' : 'bg-dark'
                  }`}
                >
                  Right to Left
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400">Zoom: {zoom}%</label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-full mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Rotation: {rotation}°</label>
              <input
                type="range"
                min="0"
                max="270"
                step="90"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dark">
            <h4 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <p><kbd className="px-1 py-0.5 bg-dark rounded">←/→</kbd> Navigate pages</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">Home/End</kbd> First/Last page</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">+/-</kbd> Zoom in/out</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">0</kbd> Reset zoom</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">1/2/3</kbd> Fit width/height/original</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">D</kbd> Toggle double page</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">R</kbd> Toggle reading direction</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">F</kbd> Fullscreen</p>
              <p><kbd className="px-1 py-0.5 bg-dark rounded">Esc</kbd> Close reader</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Navigation Buttons */}
        <button
          onClick={readingDirection === 'ltr' ? previousPage : nextPage}
          disabled={readingDirection === 'ltr' ? currentPage === 0 : currentPage >= pages.length - 1}
          className="absolute left-4 z-10 p-3 bg-dark/80 hover:bg-dark text-light rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
          title={readingDirection === 'ltr' ? 'Previous Page (←)' : 'Next Page (←)'}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Page Display */}
        <div 
          className="flex items-center justify-center gap-2 h-full overflow-auto p-4"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {currentPages.map((pageUrl, index) => (
            <img
              key={`${currentPage}-${index}`}
              src={pageUrl}
              alt={`Page ${currentPage + index + 1}`}
              className={`${getFitModeStyles()} object-contain transition-transform`}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          ))}
        </div>

        <button
          onClick={readingDirection === 'ltr' ? nextPage : previousPage}
          disabled={readingDirection === 'ltr' ? currentPage >= pages.length - 1 : currentPage === 0}
          className="absolute right-4 z-10 p-3 bg-dark/80 hover:bg-dark text-light rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
          title={readingDirection === 'ltr' ? 'Next Page (→)' : 'Previous Page (→)'}
        >
          <ChevronRight size={24} />
        </button>

        {/* Click Areas for Navigation */}
        <button
          onClick={readingDirection === 'ltr' ? previousPage : nextPage}
          disabled={readingDirection === 'ltr' ? currentPage === 0 : currentPage >= pages.length - 1}
          className="absolute left-0 top-0 bottom-0 w-1/4 cursor-w-resize disabled:cursor-not-allowed"
          title={readingDirection === 'ltr' ? 'Previous Page' : 'Next Page'}
        />
        <button
          onClick={readingDirection === 'ltr' ? nextPage : previousPage}
          disabled={readingDirection === 'ltr' ? currentPage >= pages.length - 1 : currentPage === 0}
          className="absolute right-0 top-0 bottom-0 w-1/4 cursor-e-resize disabled:cursor-not-allowed"
          title={readingDirection === 'ltr' ? 'Next Page' : 'Previous Page'}
        />
      </div>

      {/* Bottom Progress Bar */}
      <div className="bg-dark/90 px-4 py-2">
        <div className="flex items-center gap-4">
          <button
            onClick={goToFirst}
            disabled={currentPage === 0}
            className="px-3 py-1 bg-surface hover:bg-surface/80 rounded text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={readingDirection === 'ltr' ? previousPage : nextPage}
            disabled={readingDirection === 'ltr' ? currentPage === 0 : currentPage >= pages.length - 1}
            className="px-3 py-1 bg-surface hover:bg-surface/80 rounded text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          
          <input
            type="range"
            min="0"
            max={pages.length - 1}
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value))}
            className="flex-1"
          />
          
          <button
            onClick={readingDirection === 'ltr' ? nextPage : previousPage}
            disabled={readingDirection === 'ltr' ? currentPage >= pages.length - 1 : currentPage === 0}
            className="px-3 py-1 bg-surface hover:bg-surface/80 rounded text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={goToLast}
            disabled={currentPage >= pages.length - 1}
            className="px-3 py-1 bg-surface hover:bg-surface/80 rounded text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  )
}
