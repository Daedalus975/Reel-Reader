// Spotify playlists and user state
import { create } from 'zustand'
import { getCurrentUser, getPlaylists, getSavedTracks, getPlaylistTracks, type SpotifyPlaylist, type SpotifyTrack, type SpotifyUser } from '@/services/spotifyFeatures'

interface SpotifyStore {
  user: SpotifyUser | null
  playlists: SpotifyPlaylist[]
  savedTracks: SpotifyTrack[]
  playlistTracks: Record<string, SpotifyTrack[]>
  loading: boolean
  error: string | null

  // Actions
  fetchUser: () => Promise<void>
  fetchPlaylists: () => Promise<void>
  fetchSavedTracks: () => Promise<void>
  fetchPlaylistTracks: (playlistId: string) => Promise<void>
  clearSpotifyData: () => void
}

export const useSpotifyStore = create<SpotifyStore>((set) => ({
  user: null,
  playlists: [],
  savedTracks: [],
  playlistTracks: {},
  loading: false,
  error: null,

  fetchUser: async () => {
    set({ loading: true, error: null })
    try {
      const user = await getCurrentUser()
      set({ user, loading: false })
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch user', loading: false })
    }
  },

  fetchPlaylists: async () => {
    set({ loading: true, error: null })
    try {
      const playlists = await getPlaylists()
      set({ playlists, loading: false })
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch playlists', loading: false })
    }
  },

  fetchSavedTracks: async () => {
    set({ loading: true, error: null })
    try {
      const savedTracks = await getSavedTracks()
      set({ savedTracks, loading: false })
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch saved tracks', loading: false })
    }
  },

  fetchPlaylistTracks: async (playlistId: string) => {
    set({ loading: true, error: null })
    try {
      const tracks = await getPlaylistTracks(playlistId)
      set((state) => ({
        playlistTracks: { ...state.playlistTracks, [playlistId]: tracks },
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch playlist tracks', loading: false })
    }
  },

  clearSpotifyData: () => {
    set({
      user: null,
      playlists: [],
      savedTracks: [],
      playlistTracks: {},
      error: null,
    })
  },
}))
