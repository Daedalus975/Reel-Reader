import React, { useEffect, useMemo, useRef, useState } from 'react'
import { isDesktop } from '@/utils/runtime'
let _convertFileSrc: ((s: string) => string) | null = null
async function getConvertFileSrc(): Promise<(s: string) => string> {
  if (_convertFileSrc) return _convertFileSrc
  if (!isDesktop()) {
    const fallback = (s: string) => s
    _convertFileSrc = fallback
    return fallback
  }
  try {
    const mod = await import('@tauri-apps/api/tauri')
    _convertFileSrc = mod.convertFileSrc
    return _convertFileSrc
  } catch (err) {
    _convertFileSrc = (s: string) => s
    return _convertFileSrc
  }
}
import { SkipBack, SkipForward, Loader2, BookOpenCheck } from 'lucide-react'

interface BookReaderProps {
  filePath?: string
  previewUrl?: string
  initialProgress?: number
  onProgress?: (percent: number) => void
}

function getExt(path?: string) {
  if (!path) return ''
  const parts = path.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export const BookReader: React.FC<BookReaderProps> = ({ filePath, previewUrl, initialProgress = 0, onProgress }) => {
  const [safeSrc, setSafeSrc] = useState<string | undefined>(undefined)
  const [isEpubReady, setIsEpubReady] = useState(false)
  const [epubProgress, setEpubProgress] = useState(initialProgress)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const renditionRef = useRef<any>(null)
  const bookRef = useRef<any>(null)

  const ext = getExt(filePath || previewUrl)
  const isPDF = ext === 'pdf'
  const isEPUB = ext === 'epub'

  useEffect(() => {
    if (filePath) {
      // Attempt to convert file path to a tauri-safe src if available
      (async () => {
        const conv = await getConvertFileSrc()
        setSafeSrc(conv(filePath))
      })()
    } else if (previewUrl) {
      setSafeSrc(previewUrl)
    } else {
      setSafeSrc(undefined)
    }
  }, [filePath, previewUrl])

  // EPUB rendering via epub.js
  useEffect(() => {
    let cancelled = false
    if (!isEPUB || !safeSrc || !containerRef.current) {
      return () => {}
    }

    async function loadEpub() {
      setIsEpubReady(false)
      try {
        const epubModule: any = await import('epubjs')
        if (cancelled) return
        const book = epubModule.default ? epubModule.default(safeSrc) : epubModule(safeSrc)
        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
          allowScriptedContent: true,
        })
        renditionRef.current = rendition
        bookRef.current = book

        rendition.display()

        // Attempt to generate locations for progress
        book.ready
          .then(() => book.locations.generate(1000).catch(() => {}))
          .catch(() => {})

        const handleRelocated = (location: any) => {
          if (book.locations && book.locations.length() > 0) {
            const percent = book.locations.percentageFromCfi(location.start.cfi) || 0
            setEpubProgress(percent)
            onProgress?.(percent)
          }
        }

        rendition.on('relocated', handleRelocated)
        setIsEpubReady(true)

        // Jump to saved progress if provided
        if (initialProgress > 0 && book.locations && book.locations.length() > 0) {
          const cfi = book.locations.cfiFromPercentage(initialProgress)
          if (cfi) rendition.display(cfi)
        }

        return () => {
          rendition.off('relocated', handleRelocated)
          rendition.destroy?.()
          book.destroy?.()
        }
      } catch (err) {
        console.error('EPUB load failed', err)
      }
    }

    loadEpub()

    return () => {
      cancelled = true
      if (renditionRef.current) {
        renditionRef.current.destroy?.()
        renditionRef.current = null
      }
      if (bookRef.current) {
        bookRef.current.destroy?.()
        bookRef.current = null
      }
    }
  }, [isEPUB, safeSrc, initialProgress, onProgress])

  const handleNext = () => {
    if (renditionRef.current?.next) renditionRef.current.next()
  }

  const handlePrev = () => {
    if (renditionRef.current?.prev) renditionRef.current.prev()
  }

  const progressPercent = useMemo(() => {
    if (isEPUB) return Math.round(epubProgress * 100)
    return undefined
  }, [isEPUB, epubProgress])

  if (!safeSrc) {
    return (
      <div className="w-full h-full min-h-[420px] bg-dark border border-surface flex items-center justify-center text-gray-400">
        No file or preview available.
      </div>
    )
  }

  if (isPDF) {
    return (
      <div className="w-full h-full min-h-[520px] bg-dark border border-surface">
        <iframe
          title="PDF Reader"
          src={`${safeSrc}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-full border-0"
        />
      </div>
    )
  }

  if (isEPUB) {
    return (
      <div className="w-full h-full min-h-[520px] bg-dark border border-surface flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface bg-surface/60">
          <div className="flex items-center gap-2 text-sm text-light">
            <BookOpenCheck size={16} className="text-highlight" />
            <span>EPUB Reader</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="px-2 py-1 bg-surface text-light hover:bg-surface/70 rounded-none text-sm"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={handleNext}
              className="px-2 py-1 bg-surface text-light hover:bg-surface/70 rounded-none text-sm"
            >
              <SkipForward size={16} />
            </button>
            {progressPercent !== undefined && (
              <span className="text-xs text-gray-400">{progressPercent}%</span>
            )}
          </div>
        </div>
        <div className="flex-1" ref={containerRef} />
        {!isEpubReady && (
          <div className="flex items-center gap-2 text-gray-400 text-sm px-4 py-3 border-t border-surface">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading book…</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[520px] bg-dark border border-surface">
      <iframe title="Book Preview" src={safeSrc} className="w-full h-full border-0" />
    </div>
  )
}
