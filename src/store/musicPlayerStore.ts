import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MusicPlayerState {
  queue: string[]
  currentIndex: number
  isPlaying: boolean
  volume: number
  setQueue: (queue: string[], startIndex?: number) => void
  playQueue: (queue: string[], startId?: string) => void
  playMedia: (id: string) => void
  playNext: () => void
  playPrevious: () => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  clear: () => void
}

function clampIndex(index: number, length: number) {
  if (length === 0) return -1
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export const useMusicPlayerStore = create<MusicPlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      volume: 0.8,

      setQueue: (queue, startIndex = 0) => {
        const idx = clampIndex(startIndex, queue.length)
        set({
          queue,
          currentIndex: idx,
          isPlaying: queue.length > 0,
        }, false)
      },

      playQueue: (queue, startId) => {
        const startIndex = startId ? queue.indexOf(startId) : 0
        const idx = startIndex >= 0 ? startIndex : 0
        set({
          queue,
          currentIndex: queue.length ? idx : -1,
          isPlaying: queue.length > 0,
        }, false)
      },

      playMedia: (id) => {
        set({ queue: [id], currentIndex: 0, isPlaying: true }, false)
      },

      playNext: () => {
        const { queue, currentIndex } = get()
        if (queue.length === 0) return
        const nextIndex = currentIndex + 1
        if (nextIndex < queue.length) {
          set({ currentIndex: nextIndex, isPlaying: true }, false)
        } else {
          set({ isPlaying: false }, false)
        }
      },

      playPrevious: () => {
        const { queue, currentIndex } = get()
        if (queue.length === 0) return
        const prevIndex = currentIndex - 1
        if (prevIndex >= 0) {
          set({ currentIndex: prevIndex, isPlaying: true }, false)
        }
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }, false),

      setVolume: (volume) => set({ volume }, false),

      clear: () => set({ queue: [], currentIndex: -1, isPlaying: false }, false),
    }),
    {
      name: 'reel-reader-music-player',
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        isPlaying: state.isPlaying,
        volume: state.volume,
      }),
    },
  ),
)
