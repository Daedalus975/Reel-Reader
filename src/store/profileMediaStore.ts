import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Media } from '../types'

interface ProfileMediaStore {
  mediaByProfile: Record<string, Media[]>

  getMediaForProfile: (profileId: string) => Media[]
  addMediaToProfile: (profileId: string, media: Media) => void
  removeMediaFromProfile: (profileId: string, mediaId: string) => void
  updateMediaInProfile: (profileId: string, mediaId: string, updates: Partial<Media>) => void
  initializeProfileMedia: (profileId: string) => void
}

const SAMPLE_MEDIA: Media[] = [
  {
    id: '1',
    title: 'Piku',
    type: 'movie',
    year: 2015,
    genres: ['Comedy', 'Drama'],
    language: 'EN',
    rating: 8.5,
    poster: 'https://via.placeholder.com/300x450?text=Piku',
    backdrop: 'https://via.placeholder.com/1920x1080?text=Piku',
    description: 'A road trip movie about family and relationships.',
    isAdult: false,
    tags: ['Bollywood', 'Family'],
    watched: false,
    isFavorite: false,
    dateAdded: new Date(),
  },
  {
    id: '2',
    title: 'Tamasha',
    type: 'movie',
    year: 2015,
    genres: ['Drama', 'Romance'],
    language: 'EN',
    rating: 7.2,
    poster: 'https://via.placeholder.com/300x450?text=Tamasha',
    backdrop: 'https://via.placeholder.com/1920x1080?text=Tamasha',
    description: 'A young couple explores their relationship during travels.',
    isAdult: false,
    tags: ['Bollywood', 'Romance'],
    watched: false,
    isFavorite: false,
    dateAdded: new Date(),
  },
  {
    id: '3',
    title: 'The Expanse',
    type: 'tv',
    year: 2015,
    genres: ['Sci-Fi'],
    language: 'EN',
    rating: 8.4,
    poster: 'https://via.placeholder.com/300x450?text=Expanse',
    backdrop: 'https://via.placeholder.com/1920x1080?text=Expanse',
    description: 'A solar-system spanning mystery and political thriller.',
    isAdult: false,
    tags: ['Space', 'Thriller'],
    watched: false,
    isFavorite: false,
    dateAdded: new Date(),
  },
  {
    id: '4',
    title: 'Project Hail Mary',
    type: 'book',
    year: 2021,
    genres: ['Sci-Fi'],
    language: 'EN',
    rating: 4.6,
    poster: 'https://via.placeholder.com/300x450?text=Hail+Mary',
    backdrop: undefined,
    description: 'A stranded astronaut must save humanity.',
    isAdult: false,
    tags: ['Novel', 'Adventure'],
    watched: false,
    isFavorite: false,
    dateAdded: new Date(),
  },
]

export const useProfileMediaStore = create<ProfileMediaStore>()(
  persist(
    (set, get) => ({
      mediaByProfile: {
        '1': SAMPLE_MEDIA, // Default profile starts with sample media
      },

      getMediaForProfile: (profileId: string) => {
        const state = get()
        return state.mediaByProfile[profileId] || []
      },

      addMediaToProfile: (profileId, media) => {
        set((state) => {
          const currentMedia = state.mediaByProfile[profileId] || []
          return {
            mediaByProfile: {
              ...state.mediaByProfile,
              [profileId]: [...currentMedia, media],
            },
          }
        })
      },

      removeMediaFromProfile: (profileId, mediaId) => {
        set((state) => {
          const currentMedia = state.mediaByProfile[profileId] || []
          return {
            mediaByProfile: {
              ...state.mediaByProfile,
              [profileId]: currentMedia.filter((m) => m.id !== mediaId),
            },
          }
        })
      },

      updateMediaInProfile: (profileId, mediaId, updates) => {
        set((state) => {
          const currentMedia = state.mediaByProfile[profileId] || []
          return {
            mediaByProfile: {
              ...state.mediaByProfile,
              [profileId]: currentMedia.map((m) => (m.id === mediaId ? { ...m, ...updates } : m)),
            },
          }
        })
      },

      initializeProfileMedia: (profileId: string) => {
        set((state) => {
          if (!state.mediaByProfile[profileId]) {
            return {
              mediaByProfile: {
                ...state.mediaByProfile,
                [profileId]: SAMPLE_MEDIA,
              },
            }
          }
          return state
        })
      },
    }),
    {
      name: 'reel-reader-profile-media',
      partialize: (state) => ({
        mediaByProfile: state.mediaByProfile,
      }),
    },
  ),
)
