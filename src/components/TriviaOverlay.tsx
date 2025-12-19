import { useState, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TriviaItem {
  timestamp: number
  text: string
  category?: 'trivia' | 'goof' | 'quote' | 'connection'
}

interface TriviaOverlayProps {
  currentTime: number
  trivia: TriviaItem[]
  enabled?: boolean
}

export function TriviaOverlay({ currentTime, trivia, enabled = true }: TriviaOverlayProps) {
  const [currentTrivia, setCurrentTrivia] = useState<TriviaItem | null>(null)
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!enabled) return

    // Find trivia within 2 seconds of current time that hasn't been dismissed
    const active = trivia.find(
      (item) =>
        Math.abs(item.timestamp - currentTime) < 2 &&
        !dismissed.has(item.timestamp)
    )

    setCurrentTrivia(active || null)
  }, [currentTime, trivia, enabled, dismissed])

  const handleDismiss = () => {
    if (currentTrivia) {
      setDismissed(new Set([...dismissed, currentTrivia.timestamp]))
    }
    setCurrentTrivia(null)
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'goof':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
      case 'quote':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      case 'connection':
        return 'bg-green-500/20 border-green-500/30 text-green-400'
      default:
        return 'bg-purple-500/20 border-purple-500/30 text-purple-400'
    }
  }

  return (
    <AnimatePresence>
      {currentTrivia && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute bottom-20 left-4 right-4 md:left-8 md:right-8 z-10"
        >
          <div
            className={`
              ${getCategoryColor(currentTrivia.category)}
              border-2 rounded-lg p-4 backdrop-blur-sm flex items-start gap-3
            `}
          >
            <Info size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {currentTrivia.category && (
                <p className="text-xs font-semibold uppercase mb-1 opacity-80">
                  {currentTrivia.category}
                </p>
              )}
              <p className="text-sm leading-relaxed">{currentTrivia.text}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
