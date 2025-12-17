import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { MediaCard, Button } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import type { Media, MediaType } from '../types'

export const Home: React.FC = () => {
  const { media } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const navigate = useNavigate()

  useEffect(() => {
    setCurrentPage('/')
  }, [setCurrentPage])

  const nonAdultMedia = useMemo(() => media.filter((m) => !m.isAdult), [media])

  const sixMonthsAgo = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d
  }, [])

  const buildTrends = (list: Media[]) => {
    const recent = list.filter((m) => new Date(m.dateAdded) >= sixMonthsAgo)
    const base = recent.length > 0 ? recent : list
    const genreCounts = new Map<string, number>()
    const langCounts = new Map<string, number>()

    base.forEach((m) => {
      m.genres.forEach((g) => genreCounts.set(g, (genreCounts.get(g) || 0) + 1))
      langCounts.set(m.language, (langCounts.get(m.language) || 0) + 1)
    })

    return { genreCounts, langCounts }
  }

  const scoreMedia = (item: Media, trends: ReturnType<typeof buildTrends>) => {
    let score = 0
    const added = new Date(item.dateAdded)
    const daysAgo = (Date.now() - added.getTime()) / (1000 * 60 * 60 * 24)
    if (daysAgo <= 30) score += 2
    else if (daysAgo <= 90) score += 1

    if (item.isFavorite) score += 2
    if (item.watched) score += 1
    if (item.rating) score += (item.rating / 10) * 2

    item.genres.forEach((g) => {
      const freq = trends.genreCounts.get(g) || 0
      score += freq * 0.6
    })

    const langFreq = trends.langCounts.get(item.language) || 0
    score += langFreq * 0.3

    return score
  }

  const recommendForType = (type: MediaType, limit = 10) => {
    const list = nonAdultMedia.filter((m) => m.type === type)
    if (list.length === 0) return []
    const trends = buildTrends(list)
    return [...list]
      .sort((a, b) => scoreMedia(b, trends) - scoreMedia(a, trends))
      .slice(0, limit)
  }

  const recommendedMovies = useMemo(() => recommendForType('movie', 12), [nonAdultMedia])
  const recommendedTV = useMemo(() => recommendForType('tv', 12), [nonAdultMedia])
  const recommendedBooks = useMemo(() => recommendForType('book', 12), [nonAdultMedia])
  const recommendedMusic = useMemo(() => recommendForType('music', 12), [nonAdultMedia])
  const recommendedPodcasts = useMemo(() => recommendForType('podcast', 12), [nonAdultMedia])

  const headliner = recommendedMovies[0] || nonAdultMedia.find((m) => m.type === 'movie')

  const sections: Array<{ title: string; data: Media[] }> = [
    { title: 'Recommended Movies', data: recommendedMovies },
    { title: 'Recommended TV Shows', data: recommendedTV },
    { title: 'Recommended Books', data: recommendedBooks },
    { title: 'Recommended Music', data: recommendedMusic },
    { title: 'Recommended Podcasts', data: recommendedPodcasts },
  ]

  if (!headliner) {
    return (
      <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
        <div className="text-light">Add some movies to see recommendations.</div>
      </main>
    )
  }

  return (
    <main className="pt-16 pb-20">
      {/* Headliner: Top recommended movie */}
      <section className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden -mt-16 mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${(headliner.backdrop || headliner.poster || '').replace('/w500/', '/original/')}')`,
            imageRendering: 'crisp-edges',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
        </div>

        <div className="relative h-full flex flex-col justify-end p-6 md:p-10 lg:p-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-sm uppercase tracking-wide text-gray-300 mb-2">Top Recommendation</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-light mb-3 max-w-2xl">
              {headliner.title}
            </h1>

            <div className="flex items-center gap-4 mb-5 text-light text-sm md:text-base">
              {headliner.rating && (
                <span className="flex items-center gap-1">
                  <span className="text-highlight font-semibold">★ {headliner.rating.toFixed(1)}</span>
                </span>
              )}
              {headliner.year && <span>{headliner.year}</span>}
              {headliner.genres[0] && <span>{headliner.genres[0]}</span>}
              {headliner.language && <span className="uppercase font-semibold">{headliner.language}</span>}
            </div>

            <p className="text-sm md:text-base text-gray-200 max-w-2xl mb-6 line-clamp-3">
              {headliner.description || 'Curated for you based on your recent viewing habits.'}
            </p>

            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/watch/${headliner.id}`)}
                className="flex items-center gap-2"
              >
                <Play size={20} />
                Watch Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommendation rails per media type (excluding adult) */}
      <div className="space-y-12 px-6 md:px-10 lg:px-16">
        {sections.map((section) => {
          if (!section.data || section.data.length === 0) return null
          return (
            <section key={section.title}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-light">{section.title}</h2>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={(() => {
                  const size = useUIStore.getState().mediaCardSize || 'md'
                  switch (size) {
                    case 'xs':
                      return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
                    case 'sm':
                      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'
                    case 'md':
                      return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                    case 'lg':
                    default:
                      return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  }
                })()}
              >
                {section.data.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <MediaCard media={item} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
