import React, { useCallback, useState } from 'react'
import { MediaTypePage } from './MediaTypePage'
import { MusicVideoPlaylistBuilder, MusicVideoPlayer, MusicDetailModal } from '@components/index'
import { useMusicPlayerStore } from '@store/musicPlayerStore'
import { useLibraryStore } from '@store/libraryStore'
import type { Media } from '../types'

export const Music: React.FC = () => {
  const playQueue = useMusicPlayerStore((state) => state.playQueue)
  const setIsPlaying = useMusicPlayerStore((state) => state.setIsPlaying)
  const musicItems = useLibraryStore((state) => state.media.filter((m) => m.type === 'music' && !m.isAdult))
  const [selectedMusic, setSelectedMusic] = useState<Media | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const handleCardClick = useCallback((media: Media) => {
    setSelectedMusic(media)
    setShowDetail(true)
  }, [])

  const handlePlayFromDetail = useCallback(() => {
    if (!selectedMusic) return
    const queue = musicItems.map((m) => m.id)
    playQueue(queue, selectedMusic.id)
    setIsPlaying(true)
    setShowDetail(false)
  }, [selectedMusic, musicItems, playQueue, setIsPlaying])

  return (
    <>
      <MediaTypePage
        type="music"
        title="Music"
        pagePath="/music"
        onItemClick={handleCardClick}
      />
      <section className="px-6 md:px-10 lg:px-16 pb-16 space-y-4">
        <MusicVideoPlaylistBuilder items={musicItems} />
        <MusicVideoPlayer />
      </section>

      {/* Music Detail Modal */}
      {selectedMusic && (
        <MusicDetailModal
          music={selectedMusic}
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false)
            setSelectedMusic(null)
          }}
          onPlay={handlePlayFromDetail}
        />
      )}
    </>
  )
}
