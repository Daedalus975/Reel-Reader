import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Media, FilterOptions } from '../types'
import { useProfileStore } from './profileStore'
import { useProfileMediaStore } from './profileMediaStore'

interface LibraryStore {
  media: Media[]
  filteredMedia: Media[]
  filters: FilterOptions
  isLoading: boolean
  error?: string

  setMedia: (media: Media[]) => void
  addMedia: (media: Media) => void
  removeMedia: (id: string) => void
  updateMedia: (id: string, updates: Partial<Media>) => void
  setFilters: (filters: Partial<FilterOptions>) => void
  applyFilters: () => void
  clearFilters: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error?: string) => void
  toggleFavorite: (id: string) => void
  markAsWatched: (id: string, progress: number) => void
}

const DEFAULT_FILTERS: FilterOptions = {
  genre: undefined,
  language: undefined,
  rating: undefined,
  type: undefined,
  watched: undefined,
  isFavorite: undefined,
  searchQuery: undefined,
  isAdult: undefined,
}

const filterMedia = (list: Media[], filters: FilterOptions) => {
  return list.filter((m) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase()
      const haystacks = [m.title, m.description ?? '', m.genres.join(' '), m.tags.join(' ')].map((s) =>
        s.toLowerCase(),
      )
      if (!haystacks.some((h) => h.includes(q))) return false
    }
    if (filters.genre && !m.genres.includes(filters.genre)) return false
    if (filters.language && m.language !== filters.language) return false
    if (filters.type && m.type !== filters.type) return false
    if (filters.rating && m.rating && m.rating < filters.rating) return false
    if (filters.watched !== undefined && m.watched !== filters.watched) return false
    if (filters.isFavorite !== undefined && m.isFavorite !== filters.isFavorite) return false
    if (filters.isAdult !== undefined && m.isAdult !== filters.isAdult) return false
    return true
  })
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => {
      // Get initial media from the current profile
      const profileStore = useProfileStore.getState()
      const mediaStore = useProfileMediaStore.getState()
      const currentProfile = profileStore.getCurrentProfile()
      const initialMedia = currentProfile ? mediaStore.getMediaForProfile(currentProfile.id) : []

      return {
        media: initialMedia,
        filteredMedia: initialMedia,
        filters: DEFAULT_FILTERS,
        isLoading: false,
        error: undefined,

        setMedia: (media) => set({ media, filteredMedia: filterMedia(media, get().filters) }, false),

        addMedia: (media) => set((state) => {
          const profileStore = useProfileStore.getState()
          const currentProfile = profileStore.getCurrentProfile()
          if (currentProfile) {
            const mediaStore = useProfileMediaStore.getState()
            if (media.isAdult && !currentProfile.adultContentEnabled) {
              // Redirect to an adult profile; create one if needed
              const adultProfile = profileStore.profiles.find((p) => p.adultContentEnabled)
                || profileStore.createProfile('Adult', undefined, true)
              mediaStore.addMediaToProfile(adultProfile.id, media)
              // Do not add to current general profile
            } else {
              mediaStore.addMediaToProfile(currentProfile.id, media)
            }
          }
          const updated = currentProfile && media.isAdult && !currentProfile.adultContentEnabled
            ? state.media
            : [...state.media, media]
          return {
            media: updated,
            filteredMedia: filterMedia(updated, state.filters),
          }
        }, false),

        removeMedia: (id) => set((state) => {
          const profileStore = useProfileStore.getState()
          const currentProfile = profileStore.getCurrentProfile()
          if (currentProfile) {
            useProfileMediaStore.getState().removeMediaFromProfile(currentProfile.id, id)
          }
          const updated = state.media.filter((m) => m.id !== id)
          return {
            media: updated,
            filteredMedia: filterMedia(updated, state.filters),
          }
        }, false),

        updateMedia: (id, updates) => set((state) => {
          const profileStore = useProfileStore.getState()
          const currentProfile = profileStore.getCurrentProfile()
          if (currentProfile) {
            useProfileMediaStore.getState().updateMediaInProfile(currentProfile.id, id, updates)
          }
          const updated = state.media.map((m) => (m.id === id ? { ...m, ...updates } : m))
          return {
            media: updated,
            filteredMedia: filterMedia(updated, state.filters),
          }
        }, false),

        setFilters: (filters) => set((state) => {
          const merged = { ...state.filters, ...filters }
          return {
            filters: merged,
            filteredMedia: filterMedia(state.media, merged),
          }
        }, false),

        applyFilters: () => {
          const state = get()
          const filtered = filterMedia(state.media, state.filters)
          set({ filteredMedia: filtered }, false)
        },

        clearFilters: () => set((state) => ({ filters: DEFAULT_FILTERS, filteredMedia: state.media }), false),

        setLoading: (isLoading) => set({ isLoading }, false),

        setError: (error) => set({ error }, false),

        toggleFavorite: (id) => {
          set((state) => {
            const profileStore = useProfileStore.getState()
            const currentProfile = profileStore.getCurrentProfile()
            if (currentProfile) {
              const target = state.media.find((m) => m.id === id)
              if (target) {
                useProfileMediaStore.getState().updateMediaInProfile(currentProfile.id, id, {
                  isFavorite: !target.isFavorite,
                })
              }
            }
            const updated = state.media.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m))
            return {
              media: updated,
              filteredMedia: filterMedia(updated, state.filters),
            }
          }, false)
        },

        markAsWatched: (id, progress) => {
          set((state) => {
            const profileStore = useProfileStore.getState()
            const currentProfile = profileStore.getCurrentProfile()
            if (currentProfile) {
              useProfileMediaStore.getState().updateMediaInProfile(currentProfile.id, id, {
                watched: true,
                progress,
              })
            }
            const updated = state.media.map((m) => (m.id === id ? { ...m, watched: true, progress } : m))
            return {
              media: updated,
              filteredMedia: filterMedia(updated, state.filters),
            }
          }, false)
        },
      }
    },
    {
      name: 'reel-reader-library',
      partialize: (state) => ({
        media: state.media,
        filters: state.filters,
      }),
    },
  ),
)
