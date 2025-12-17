import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MusicVideoPlaylistState {
  queue: string[]
  currentIndex: number
  isPlaying: boolean
  setQueue: (queue: string[], startId?: string) => void
  add: (id: string) => void
  remove: (id: string) => void
  setIndex: (index: number) => void
  playNext: () => void
  playPrevious: () => void
  setIsPlaying: (playing: boolean) => void
  clear: () => void
}

export const useMusicVideoPlaylistStore = create<MusicVideoPlaylistState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: -1,
      isPlaying: false,

      setQueue: (queue, startId) => {
        const startIndex = startId ? queue.indexOf(startId) : 0
        const idx = startIndex >= 0 ? startIndex : 0
        set({
          queue,
          currentIndex: queue.length ? idx : -1,
          isPlaying: queue.length > 0,
        }, false)
      },

      add: (id) => {
        set((state) => {
          if (state.queue.includes(id)) return state
          const nextQueue = [...state.queue, id]
          return {
            queue: nextQueue,
            currentIndex: state.currentIndex === -1 ? 0 : state.currentIndex,
            isPlaying: state.isPlaying,
          }
        }, false)
      },

      remove: (id) => {
        set((state) => {
          const idx = state.queue.indexOf(id)
          if (idx === -1) return state
          const nextQueue = state.queue.filter((q) => q !== id)
          let nextIndex = state.currentIndex
          if (idx < state.currentIndex) nextIndex -= 1
          if (nextIndex >= nextQueue.length) nextIndex = nextQueue.length - 1
          return {
            queue: nextQueue,
            currentIndex: nextQueue.length ? Math.max(nextIndex, 0) : -1,
            isPlaying: nextQueue.length ? state.isPlaying : false,
          }
        }, false)
      },

      setIndex: (index) => {
        const { queue } = get()
        if (index < 0 || index >= queue.length) return
        set({ currentIndex: index, isPlaying: true }, false)
      },

      playNext: () => {
        const { queue, currentIndex } = get()
        if (!queue.length) return
        const next = currentIndex + 1
        if (next < queue.length) {
          set({ currentIndex: next, isPlaying: true }, false)
        } else {
          set({ isPlaying: false }, false)
        }
      },

      playPrevious: () => {
        const { queue, currentIndex } = get()
        if (!queue.length) return
        const prev = currentIndex - 1
        if (prev >= 0) set({ currentIndex: prev, isPlaying: true }, false)
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }, false),

      clear: () => set({ queue: [], currentIndex: -1, isPlaying: false }, false),
    }),
    {
      name: 'reel-reader-music-video-playlist',
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        isPlaying: state.isPlaying,
      }),
    },
  ),
)
