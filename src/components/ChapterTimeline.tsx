import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Chapter } from '../types'

interface ChapterTimelineProps {
  chapters: Chapter[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function ChapterTimeline({ chapters, currentTime, duration, onSeek }: ChapterTimelineProps) {
  const [hoveredChapter, setHoveredChapter] = useState<Chapter | null>(null)

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`
  }

  const getCurrentChapter = () => {
    return chapters.find((chapter, index) => {
      const nextChapter = chapters[index + 1]
      return currentTime >= chapter.startTime && (!nextChapter || currentTime < nextChapter.startTime)
    })
  }

  const currentChapter = getCurrentChapter()

  return (
    <div className="space-y-2">
      {/* Timeline Bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
        {/* Chapter Segments */}
        {chapters.map((chapter, index) => {
          const nextChapter = chapters[index + 1]
          const start = (chapter.startTime / duration) * 100
          const end = nextChapter ? (nextChapter.startTime / duration) * 100 : 100
          const width = end - start

          return (
            <button
              key={chapter.id}
              onClick={() => onSeek(chapter.startTime)}
              onMouseEnter={() => setHoveredChapter(chapter)}
              onMouseLeave={() => setHoveredChapter(null)}
              className="absolute h-full transition hover:bg-white/30"
              style={{
                left: `${start}%`,
                width: `${width}%`,
                backgroundColor: currentChapter?.id === chapter.id ? 'rgba(168, 85, 247, 0.6)' : 'rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* Chapter Marker */}
              <div className="absolute left-0 top-0 w-0.5 h-full bg-white/40" />
            </button>
          )
        })}

        {/* Progress Bar */}
        <div
          className="absolute top-0 left-0 h-full bg-purple-500 pointer-events-none"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />

        {/* Hover Tooltip */}
        {hoveredChapter && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 bg-neutral-800 border border-white/20 rounded-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-none z-10"
            style={{ left: `${(hoveredChapter.startTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <p className="font-semibold">{hoveredChapter.title}</p>
            <p className="text-white/60">{formatTime(hoveredChapter.startTime)}</p>
          </motion.div>
        )}
      </div>

      {/* Current Chapter Display */}
      {currentChapter && (
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="font-medium">Chapter: {currentChapter.title}</span>
          <span>{formatTime(currentChapter.startTime)}</span>
        </div>
      )}

      {/* Chapter List */}
      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => onSeek(chapter.startTime)}
            className={`
              w-full flex items-center justify-between p-2 rounded-lg text-left transition text-sm
              ${currentChapter?.id === chapter.id
                ? 'bg-purple-500/20 text-purple-400 font-medium'
                : 'hover:bg-white/5 text-white/80'
              }
            `}
          >
            <span className="truncate">{chapter.title}</span>
            <span className="text-xs text-white/40 ml-2 shrink-0">
              {formatTime(chapter.startTime)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
