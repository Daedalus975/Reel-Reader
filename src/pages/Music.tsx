import React, { useCallback } from 'react'
import { MediaTypePage } from './MediaTypePage'
import { MusicVideoPlaylistBuilder, MusicVideoPlayer } from '@components/index'
import { useMusicPlayerStore } from '@store/musicPlayerStore'
import { useLibraryStore } from '@store/libraryStore'
import type { Media } from '../types'

export const Music: React.FC = () => {
  const playQueue = useMusicPlayerStore((state) => state.playQueue)
  const musicItems = useLibraryStore((state) => state.media.filter((m) => m.type === 'music' && !m.isAdult))

  const handlePlay = useCallback((media: Media, list: Media[]) => {
    const queue = list.map((m) => m.id)
    playQueue(queue, media.id)
  }, [playQueue])

  return (
    <>
      <MediaTypePage type="music" title="Music" pagePath="/music" onItemClick={handlePlay} />
      <section className="px-6 md:px-10 lg:px-16 pb-16 space-y-4">
        <MusicVideoPlaylistBuilder items={musicItems} />
        <MusicVideoPlayer />
      </section>
    </>
  )
}
