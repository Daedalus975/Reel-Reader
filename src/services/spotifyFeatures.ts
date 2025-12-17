// Spotify Web API features: fetch/manage playlists, saved tracks, search
import { getStoredToken, refreshSpotifyToken } from './spotify'

const API_BASE = 'https://api.spotify.com/v1'

export interface SpotifyPlaylist {
  id: string
  uri: string
  name: string
  description?: string
  imageUrl?: string
  trackCount: number
  public: boolean
  collaborative: boolean
  ownerName: string
}

export interface SpotifyTrack {
  id: string
  uri: string
  name: string
  artists: string[]
  album: string
  externalUrl?: string
  imageUrl?: string
  duration_ms: number
}

export interface SpotifyUser {
  id: string
  display_name?: string
  email?: string
  external_urls?: { spotify: string }
  images?: Array<{ url: string }>
}

async function getValidToken(): Promise<string | null> {
  const { accessToken, expiresAt } = getStoredToken()
  const now = Math.floor(Date.now() / 1000)

  if (accessToken && expiresAt > now + 30) {
    return accessToken
  }

  // Try refresh
  if (await refreshSpotifyToken()) {
    const newToken = getStoredToken().accessToken
    return newToken || null
  }

  return null
}

async function spotifyFetch(endpoint: string, method = 'GET'): Promise<any> {
  const token = await getValidToken()
  if (!token) throw new Error('Not authenticated with Spotify')

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('Spotify token expired or invalid')
    throw new Error(`Spotify API error: ${res.status}`)
  }

  return await res.json()
}

export async function getCurrentUser(): Promise<SpotifyUser | null> {
  try {
    return await spotifyFetch('/me')
  } catch (err) {
    console.error('Failed to fetch Spotify user:', err)
    return null
  }
}

export async function getPlaylists(): Promise<SpotifyPlaylist[]> {
  try {
    const data = await spotifyFetch('/me/playlists?limit=50')
    return (data.items || []).map((p: any) => ({
      id: p.id,
      uri: p.uri,
      name: p.name,
      description: p.description,
      imageUrl: p.images?.[0]?.url,
      trackCount: p.tracks?.total || 0,
      public: p.public,
      collaborative: p.collaborative,
      ownerName: p.owner?.display_name || 'Unknown',
    }))
  } catch (err) {
    console.error('Failed to fetch Spotify playlists:', err)
    return []
  }
}

export async function getSavedTracks(): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyFetch('/me/tracks?limit=50')
    return (data.items || []).map((item: any) => {
      const track = item.track
      return {
        id: track.id,
        name: track.name,
        artists: track.artists?.map((a: any) => a.name) || [],
        album: track.album?.name || '',
        externalUrl: track.external_urls?.spotify,
        imageUrl: track.album?.images?.[0]?.url,
        duration_ms: track.duration_ms,
      }
    })
  } catch (err) {
    console.error('Failed to fetch saved tracks:', err)
    return []
  }
}

export async function getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyFetch(`/playlists/${playlistId}/tracks?limit=50`)
    return (data.items || []).map((item: any) => {
      const track = item.track
      return {
        id: track.id,
        name: track.name,
        artists: track.artists?.map((a: any) => a.name) || [],
        album: track.album?.name || '',
        externalUrl: track.external_urls?.spotify,
        imageUrl: track.album?.images?.[0]?.url,
        duration_ms: track.duration_ms,
      }
    })
  } catch (err) {
    console.error(`Failed to fetch tracks for playlist ${playlistId}:`, err)
    return []
  }
}

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=20`)
    return (data.tracks?.items || []).map((track: any) => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artists: track.artists?.map((a: any) => a.name) || [],
      album: track.album?.name || '',
      externalUrl: track.external_urls?.spotify,
      imageUrl: track.album?.images?.[0]?.url,
      duration_ms: track.duration_ms,
    }))
  } catch (err) {
    console.error(`Failed to search Spotify for "${query}":`, err)
    return []
  }
}

export async function saveTrack(trackId: string): Promise<boolean> {
  try {
    await spotifyFetch(`/me/tracks?ids=${trackId}`, 'PUT')
    return true
  } catch (err) {
    console.error(`Failed to save track ${trackId}:`, err)
    return false
  }
}

export async function removeTrack(trackId: string): Promise<boolean> {
  try {
    await spotifyFetch(`/me/tracks?ids=${trackId}`, 'DELETE')
    return true
  } catch (err) {
    console.error(`Failed to remove track ${trackId}:`, err)
    return false
  }
}

export async function isSavedTrack(trackId: string): Promise<boolean> {
  try {
    const data = await spotifyFetch(`/me/tracks/contains?ids=${trackId}`)
    return data[0] === true
  } catch (err) {
    console.error(`Failed to check if track ${trackId} is saved:`, err)
    return false
  }
}

export async function addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<boolean> {
  try {
    const trackUris = trackIds.map((id) => `spotify:track:${id}`)
    const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getValidToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: trackUris }),
    })
    return res.ok
  } catch (err) {
    console.error(`Failed to add tracks to playlist ${playlistId}:`, err)
    return false
  }
}

export async function createPlaylist(name: string, description?: string, isPublic = false): Promise<SpotifyPlaylist | null> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const token = await getValidToken()
    const res = await fetch(`${API_BASE}/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
        collaborative: false,
      }),
    })

    if (!res.ok) throw new Error(`Failed to create playlist: ${res.status}`)
    const data = await res.json()

    return {
      id: data.id,
      uri: data.uri,
      name: data.name,
      description: data.description,
      imageUrl: data.images?.[0]?.url,
      trackCount: 0,
      public: data.public,
      collaborative: data.collaborative,
      ownerName: data.owner?.display_name || 'Me',
    }
  } catch (err) {
    console.error('Failed to create playlist:', err)
    return null
  }
}
