// Playlists Store - Music playlists with smart playlist support
// Features: #71-80, #156-160

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Playlist, SmartCollectionRule } from '../types'
import type { Media } from '../types'

interface PlaylistsStore {
  playlists: Playlist[]
  currentPlaylist?: string
  shuffleEnabled: boolean
  repeatMode: 'none' | 'one' | 'all'
  crossfadeSeconds: number
  
  // Playlist management
  createPlaylist: (name: string, type: 'manual' | 'smart') => Playlist
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void
  deletePlaylist: (id: string) => void
  
  // Track management
  addTrack: (playlistId: string, trackId: string) => void
  removeTrack: (playlistId: string, trackId: string) => void
  reorderTracks: (playlistId: string, trackIds: string[]) => void
  moveTrack: (playlistId: string, fromIndex: number, toIndex: number) => void
  
  // Smart playlists
  updatePlaylistRules: (playlistId: string, rules: SmartCollectionRule[]) => void
  evaluateSmartPlaylist: (playlistId: string, allMedia: Media[]) => string[]
  
  // Playback settings
  setCurrentPlaylist: (playlistId?: string) => void
  setShuffle: (enabled: boolean) => void
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void
  setCrossfade: (seconds: number) => void
  
  // Import/Export
  exportToM3U: (playlistId: string) => string
  importFromM3U: (content: string, name: string) => void
  
  // Queries
  getPlaylist: (id: string) => Playlist | undefined
  getPlaylistsByTrackId: (trackId: string) => Playlist[]
}

export const usePlaylistsStore = create<PlaylistsStore>()(
  persist(
    (set, get) => ({
      playlists: [],
      currentPlaylist: undefined,
      shuffleEnabled: false,
      repeatMode: 'none',
      crossfadeSeconds: 0,
      
      createPlaylist: (name, type) => {
        const playlist: Playlist = {
          id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          type,
          trackIds: [],
          createdAt: new Date(),
        }
        set((state) => ({ playlists: [...state.playlists, playlist] }))
        return playlist
      },
      
      updatePlaylist: (id, updates) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }))
      },
      
      deletePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
          currentPlaylist: state.currentPlaylist === id ? undefined : state.currentPlaylist,
        }))
      },
      
      addTrack: (playlistId, trackId) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId && !p.trackIds.includes(trackId)
              ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: new Date() }
              : p
          ),
        }))
      },
      
      removeTrack: (playlistId, trackId) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId), updatedAt: new Date() }
              : p
          ),
        }))
      },
      
      reorderTracks: (playlistId, trackIds) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, trackIds, updatedAt: new Date() } : p
          ),
        }))
      },
      
      moveTrack: (playlistId, fromIndex, toIndex) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p
            
            const tracks = [...p.trackIds]
            const [moved] = tracks.splice(fromIndex, 1)
            tracks.splice(toIndex, 0, moved)
            
            return { ...p, trackIds: tracks, updatedAt: new Date() }
          }),
        }))
      },
      
      updatePlaylistRules: (playlistId, rules) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, rules, updatedAt: new Date() } : p
          ),
        }))
      },
      
      evaluateSmartPlaylist: (playlistId, allMedia) => {
        const playlist = get().playlists.find((p) => p.id === playlistId)
        if (!playlist || playlist.type !== 'smart' || !playlist.rules) {
          return []
        }
        
        // Filter for music only
        const musicMedia = allMedia.filter((m) => m.type === 'music')
        
        const matches = musicMedia.filter((media) => {
          return playlist.rules!.every((rule) => {
            const fieldValue = (media as any)[rule.field]
            
            switch (rule.operator) {
              case 'equals':
                return fieldValue === rule.value
              case 'contains':
                return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase())
              case 'greaterThan':
                return Number(fieldValue) > Number(rule.value)
              case 'lessThan':
                return Number(fieldValue) < Number(rule.value)
              case 'in':
                return Array.isArray(rule.value) && rule.value.includes(fieldValue)
              default:
                return false
            }
          })
        })
        
        const matchIds = matches.map((m) => m.id)
        
        // Auto-update smart playlist tracks
        get().updatePlaylist(playlistId, { trackIds: matchIds })
        
        return matchIds
      },
      
      setCurrentPlaylist: (playlistId) => {
        set({ currentPlaylist: playlistId })
      },
      
      setShuffle: (enabled) => {
        set({ shuffleEnabled: enabled })
      },
      
      setRepeatMode: (mode) => {
        set({ repeatMode: mode })
      },
      
      setCrossfade: (seconds) => {
        set({ crossfadeSeconds: Math.max(0, Math.min(12, seconds)) })
      },
      
      exportToM3U: (playlistId) => {
        const playlist = get().playlists.find((p) => p.id === playlistId)
        if (!playlist) return ''
        
        let m3u = '#EXTM3U\n'
        m3u += `#PLAYLIST:${playlist.name}\n\n`
        
        // Note: This is a stub - real implementation would need to resolve track paths/URLs
        playlist.trackIds.forEach((trackId) => {
          m3u += `#EXTINF:-1,${trackId}\n`
          m3u += `${trackId}.mp3\n`
        })
        
        return m3u
      },
      
      importFromM3U: (content, name) => {
        const lines = content.split('\n').filter((line) => line.trim())
        const trackIds: string[] = []
        
        lines.forEach((line) => {
          if (!line.startsWith('#')) {
            // This is a track path/URL
            // In real implementation, would parse and match against library
            trackIds.push(line.trim())
          }
        })
        
        get().createPlaylist(name, 'manual')
        // Would need to set trackIds after creation in real implementation
      },
      
      getPlaylist: (id) => {
        return get().playlists.find((p) => p.id === id)
      },
      
      getPlaylistsByTrackId: (trackId) => {
        return get().playlists.filter((p) => p.trackIds.includes(trackId))
      },
    }),
    {
      name: 'reel-reader-playlists',
    }
  )
)
