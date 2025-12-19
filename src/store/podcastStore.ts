import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PodcastFeed } from '../types/features'

interface PodcastEpisode {
  id: string
  feedId: string
  title: string
  description: string
  audioUrl: string
  duration: number
  pubDate: Date
  episodeNumber?: number
  seasonNumber?: number
  artwork?: string
  fileSize?: number
  played: boolean
  playedDuration: number
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed'
  downloadPath?: string
}

interface PodcastSubscription {
  feedId: string
  lastChecked: Date
  autoDownload: boolean
  notifyNewEpisodes: boolean
}

interface PodcastPlaybackSettings {
  speed: number // 0.5 - 3.0
  skipForward: number // seconds
  skipBackward: number // seconds
  trimSilence: boolean
  volumeBoost: boolean
}

interface PodcastState {
  feeds: PodcastFeed[]
  episodes: PodcastEpisode[]
  subscriptions: Record<string, PodcastSubscription>
  playbackSettings: PodcastPlaybackSettings
  currentEpisode: string | null
  queue: string[] // Episode IDs
}

interface PodcastActions {
  // Feed Management
  addFeed: (rssUrl: string) => Promise<void>
  removeFeed: (feedId: string) => void
  refreshFeed: (feedId: string) => Promise<void>
  refreshAllFeeds: () => Promise<void>
  
  // Subscriptions
  subscribe: (feedId: string, autoDownload?: boolean) => void
  unsubscribe: (feedId: string) => void
  updateSubscription: (feedId: string, settings: Partial<PodcastSubscription>) => void
  
  // Episodes
  getEpisodes: (feedId: string) => PodcastEpisode[]
  markPlayed: (episodeId: string) => void
  markUnplayed: (episodeId: string) => void
  updateProgress: (episodeId: string, duration: number) => void
  
  // Download
  downloadEpisode: (episodeId: string) => Promise<void>
  cancelDownload: (episodeId: string) => void
  deleteDownload: (episodeId: string) => void
  
  // Playback
  playEpisode: (episodeId: string) => void
  addToQueue: (episodeId: string) => void
  removeFromQueue: (episodeId: string) => void
  clearQueue: () => void
  
  // Settings
  updatePlaybackSettings: (settings: Partial<PodcastPlaybackSettings>) => void
}

const DEFAULT_PLAYBACK_SETTINGS: PodcastPlaybackSettings = {
  speed: 1.0,
  skipForward: 30,
  skipBackward: 15,
  trimSilence: false,
  volumeBoost: false
}

export const usePodcastStore = create<PodcastState & PodcastActions>()(
  persist(
    (set, get) => ({
      // State
      feeds: [],
      episodes: [],
      subscriptions: {},
      playbackSettings: DEFAULT_PLAYBACK_SETTINGS,
      currentEpisode: null,
      queue: [],

      // Feed Management
      addFeed: async (rssUrl) => {
        try {
          // TODO: Parse RSS feed
          const response = await fetch(rssUrl)
          await response.text() // Parse XML here
          
          // Basic RSS parsing (replace with proper XML parser)
          const feedId = crypto.randomUUID()
          const feed: PodcastFeed = {
            id: feedId,
            title: 'Podcast Title', // Extract from RSS
            feedUrl: rssUrl,
            episodes: [],
            lastFetched: new Date()
          }

          set((state) => ({
            feeds: [...state.feeds, feed]
          }))

          // Auto-subscribe
          get().subscribe(feedId)
          
          // Fetch episodes
          await get().refreshFeed(feedId)
        } catch (error) {
          console.error('Failed to add feed:', error)
        }
      },

      removeFeed: (feedId) => {
        set((state) => ({
          feeds: state.feeds.filter((f) => f.id !== feedId),
          episodes: state.episodes.filter((e) => e.feedId !== feedId),
          subscriptions: Object.fromEntries(
            Object.entries(state.subscriptions).filter(([id]) => id !== feedId)
          )
        }))
      },

      refreshFeed: async (feedId) => {
        const feed = get().feeds.find((f) => f.id === feedId)
        if (!feed) return

        try {
          // TODO: Fetch and parse RSS feed for new episodes
          set((state) => ({
            subscriptions: {
              ...state.subscriptions,
              [feedId]: {
                ...state.subscriptions[feedId],
                lastChecked: new Date()
              }
            }
          }))
        } catch (error) {
          console.error('Failed to refresh feed:', error)
        }
      },

      refreshAllFeeds: async () => {
        const { feeds } = get()
        await Promise.all(feeds.map((f) => get().refreshFeed(f.id)))
      },

      // Subscriptions
      subscribe: (feedId, autoDownload = false) => {
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [feedId]: {
              feedId,
              lastChecked: new Date(),
              autoDownload,
              notifyNewEpisodes: true
            }
          }
        }))
      },

      unsubscribe: (feedId) => {
        set((state) => {
          const { [feedId]: removed, ...rest } = state.subscriptions
          return { subscriptions: rest }
        })
      },

      updateSubscription: (feedId, settings) => {
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [feedId]: {
              ...state.subscriptions[feedId],
              ...settings
            }
          }
        }))
      },

      // Episodes
      getEpisodes: (feedId) => {
        return get().episodes.filter((e) => e.feedId === feedId)
      },

      markPlayed: (episodeId) => {
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId ? { ...e, played: true } : e
          )
        }))
      },

      markUnplayed: (episodeId) => {
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId ? { ...e, played: false, playedDuration: 0 } : e
          )
        }))
      },

      updateProgress: (episodeId, duration) => {
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId ? { ...e, playedDuration: duration } : e
          )
        }))
      },

      // Download
      downloadEpisode: async (episodeId) => {
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId ? { ...e, downloadStatus: 'downloading' as const } : e
          )
        }))

        // TODO: Integrate with download manager
      },

      cancelDownload: (episodeId) => {
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId ? { ...e, downloadStatus: undefined } : e
          )
        }))
      },

      deleteDownload: (episodeId) => {
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId ? { ...e, downloadStatus: undefined, downloadPath: undefined } : e
          )
        }))
      },

      // Playback
      playEpisode: (episodeId) => {
        set({ currentEpisode: episodeId })
      },

      addToQueue: (episodeId) => {
        set((state) => ({
          queue: [...state.queue, episodeId]
        }))
      },

      removeFromQueue: (episodeId) => {
        set((state) => ({
          queue: state.queue.filter((id) => id !== episodeId)
        }))
      },

      clearQueue: () => {
        set({ queue: [] })
      },

      // Settings
      updatePlaybackSettings: (settings) => {
        set((state) => ({
          playbackSettings: { ...state.playbackSettings, ...settings }
        }))
      }
    }),
    {
      name: 'podcast-store',
      version: 1,
      partialize: (state) => ({
        feeds: state.feeds,
        subscriptions: state.subscriptions,
        playbackSettings: state.playbackSettings,
        episodes: state.episodes.map((e) => ({
          ...e,
          // Don't persist download states
          downloadStatus: undefined
        }))
      })
    }
  )
)
