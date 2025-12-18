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
  setShuffle,
  setRepeat,
  transferPlaybackToDevice,
} from '@/services/spotifyPlayback'
import { getStoredToken } from '@/services/spotify'
import { useMusicVideoPlaylistStore } from '@store/musicVideoPlaylistStore'
import { useSpotifyStore } from '@store/spotifyStore'

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
  _pollIntervalId: any | null

  // Actions
  initializePlayback: () => Promise<void>
  stopPolling: () => void
  setShuffle: (state: boolean) => Promise<void>
  setRepeat: (mode: 'off' | 'track' | 'context') => Promise<void>
  transferToDevice: (deviceId: string) => Promise<void>
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
  _pollIntervalId: null as any,

  initializePlayback: async () => {
    // Playback will be initialized in SpotifyCallback; start polling for state
    set({ isInitialized: true })
    try {
      await initSpotifyPlayback()
      // Start polling
      const startPolling = async () => {
        try {
          const state = await getCurrentState()
          get().updateCurrentState(state)
        } catch (err) {
          // ignore polling errors
        }
      }
      await startPolling()
      const id = setInterval(startPolling, 1000)
      set({ _pollIntervalId: id })
    } catch (err) {
      console.error('Failed to initialize playback store polling:', err)
    }
  },

  play: async () => {
    try {
      await play()
      set({ isPlaying: true })
    } catch (err) {
      console.error('Failed to play:', err)
    }
  },

  setShuffle: async (state: boolean) => {
    try {
      await setShuffle(state)
    } catch (err) {
      console.error('Failed to set shuffle:', err)
    }
  },

  setRepeat: async (mode: 'off' | 'track' | 'context') => {
    try {
      await setRepeat(mode)
    } catch (err) {
      console.error('Failed to set repeat:', err)
    }
  },

  transferToDevice: async (deviceId: string) => {
    try {
      await transferPlaybackToDevice(deviceId, true)
    } catch (err) {
      console.error('Failed to transfer playback:', err)
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

      // Keep the app queue in sync: set single-track queue so the foldout shows the track
      try {
        const qStore = useMusicVideoPlaylistStore.getState()
        qStore.setQueue([trackUri], trackUri)
      } catch (e) {
        // non-fatal
      }
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

      // When playing a playlist, also populate the app queue so the foldout shows it
      try {
        const parts = playlistUri.split(':')
        const playlistId = parts[parts.length - 1]
        const sStore = useSpotifyStore.getState()
        // Ensure we have tracks loaded
        if (!sStore.playlistTracks[playlistId]) {
          await sStore.fetchPlaylistTracks(playlistId)
        }
        const tracks = useSpotifyStore.getState().playlistTracks[playlistId] || []
        if (tracks.length) {
          const uris = tracks.map((t) => t.uri)
          useMusicVideoPlaylistStore.getState().setQueue(uris, uris[0])
        }
      } catch (e) {
        // non-fatal; don't block playback
      }
    } catch (err: any) {
      console.error('Failed to play playlist:', err)
      alert(`Failed to play playlist: ${err?.message || 'Unknown error'}.`)
    }
  },

  stopPolling: () => {
    const id = get()._pollIntervalId
    if (id) {
      clearInterval(id)
      set({ _pollIntervalId: null })
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
