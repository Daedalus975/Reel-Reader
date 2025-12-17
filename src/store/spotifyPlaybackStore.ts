import { create } from 'zustand'
import {
  play,
  pause,
  nextTrack,
  previousTrack,
  seek,
  setVolume,
  getCurrentState,
  playTrack,
  playPlaylist,
  initSpotifyPlayback,
} from '@/services/spotifyPlayback'
import { getStoredToken } from '@/services/spotify'

interface CurrentTrack {
  id: string
  name: string
  artist: string
  albumArt?: string
  uri: string
  duration: number
  progress: number
}

interface SpotifyPlaybackState {
  isPlaying: boolean
  currentTrack: CurrentTrack | null
  volume: number
  isInitialized: boolean

  // Actions
  initializePlayback: () => Promise<void>
  play: () => Promise<void>
  pause: () => Promise<void>
  togglePlay: () => Promise<void>
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
  seek: (ms: number) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  playTrack: (trackUri: string) => Promise<void>
  playPlaylist: (playlistUri: string) => Promise<void>
  updateCurrentState: (state: any) => void
}

export const useSpotifyPlaybackStore = create<SpotifyPlaybackState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  volume: 0.5,
  isInitialized: false,

  initializePlayback: async () => {
    // Playback will be initialized in SpotifyCallback
    set({ isInitialized: true })
  },

  play: async () => {
    try {
      await play()
      set({ isPlaying: true })
    } catch (err) {
      console.error('Failed to play:', err)
    }
  },

  pause: async () => {
    try {
      await pause()
      set({ isPlaying: false })
    } catch (err) {
      console.error('Failed to pause:', err)
    }
  },

  togglePlay: async () => {
    const state = await getCurrentState()
    if (state?.paused) {
      await play()
      set({ isPlaying: true })
    } else {
      await pause()
      set({ isPlaying: false })
    }
  },

  nextTrack: async () => {
    try {
      await nextTrack()
    } catch (err) {
      console.error('Failed to skip:', err)
    }
  },

  previousTrack: async () => {
    try {
      await previousTrack()
    } catch (err) {
      console.error('Failed to go back:', err)
    }
  },

  seek: async (ms: number) => {
    try {
      await seek(ms)
    } catch (err) {
      console.error('Failed to seek:', err)
    }
  },

  setVolume: async (volume: number) => {
    try {
      await setVolume(volume)
      set({ volume })
    } catch (err) {
      console.error('Failed to set volume:', err)
    }
  },

  playTrack: async (trackUri: string) => {
    try {
      const state = getStoredToken()
      if (!state?.accessToken) throw new Error('Connect Spotify first')
      if (!get().isInitialized) {
        await initSpotifyPlayback()
        set({ isInitialized: true })
      }
      await playTrack(trackUri)
      set({ isPlaying: true })
    } catch (err: any) {
      console.error('Failed to play track:', err)
      alert(`Failed to play track: ${err?.message || 'Unknown error'}`)
    }
  },

  playPlaylist: async (playlistUri: string) => {
    try {
      const state = getStoredToken()
      if (!state?.accessToken) throw new Error('Connect Spotify first')
      if (!get().isInitialized) {
        await initSpotifyPlayback()
        set({ isInitialized: true })
      }
      await playPlaylist(playlistUri)
      set({ isPlaying: true })
    } catch (err: any) {
      console.error('Failed to play playlist:', err)
      alert(`Failed to play playlist: ${err?.message || 'Unknown error'}.`)
    }
  },

  updateCurrentState: (state: any) => {
    if (state?.track_window?.current_track) {
      const track = state.track_window.current_track
      set({
        isPlaying: !state.paused,
        currentTrack: {
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown',
          albumArt: track.album?.images[0]?.url,
          uri: track.uri,
          duration: track.duration_ms,
          progress: state.position,
        },
      })
    }
  },
}))
