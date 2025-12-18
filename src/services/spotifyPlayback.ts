// Spotify Web Playback SDK integration

import { getStoredToken, refreshSpotifyToken } from './spotify'

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: {
      Player: new (options: any) => SpotifyPlayer
    }
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (state: any) => void) => void
  connect: () => Promise<boolean>
  disconnect: () => void
  getCurrentState: () => Promise<any>
  getVolume: () => Promise<number>
  pause: () => Promise<void>
  play: (options?: any) => Promise<void>
  previousTrack: () => Promise<void>
  nextTrack: () => Promise<void>
  resume: () => Promise<void>
  seek: (ms: number) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  togglePlay: () => Promise<void>
}

let player: SpotifyPlayer | null = null
let playerDeviceId: string | null = null

async function getFreshToken(): Promise<string> {
  const { accessToken, expiresAt } = getStoredToken()
  if (!accessToken) throw new Error('Not authenticated with Spotify')
  const now = Math.floor(Date.now() / 1000)
  if (expiresAt && now >= expiresAt - 15) {
    const refreshed = await refreshSpotifyToken()
    if (!refreshed) throw new Error('Failed to refresh Spotify token')
    const latest = getStoredToken()
    if (!latest.accessToken) throw new Error('No Spotify access token available')
    return latest.accessToken
  }
  return accessToken
}

async function waitForDeviceReady(timeoutMs = 5000): Promise<string> {
  if (playerDeviceId) return playerDeviceId
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (playerDeviceId) {
        clearInterval(interval)
        resolve(playerDeviceId)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error('Spotify device not ready'))
      }
    }, 150)
  })
}

export function initSpotifyPlayback(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Set up callback BEFORE loading SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
      createPlayer(resolve, reject)
    }

    // Load SDK if not already loaded
    if (!window.Spotify) {
      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      script.onerror = () => reject(new Error('Failed to load Spotify SDK'))
      document.body.appendChild(script)
    } else {
      // SDK already loaded, call callback directly
      if (window.onSpotifyWebPlaybackSDKReady) {
        window.onSpotifyWebPlaybackSDKReady()
      }
    }
  })
}

function createPlayer(
  resolve: () => void,
  reject: (err: Error) => void
) {
  if (!window.Spotify) {
    reject(new Error('Spotify SDK not available'))
    return
  }

  player = new window.Spotify.Player({
    name: 'Reel Reader',
    getOAuthToken: async (cb: (token: string) => void) => {
      try {
        const fresh = await getFreshToken()
        cb(fresh)
      } catch (err) {
        console.error('Failed to get Spotify token for playback', err)
      }
    },
    volume: 0.5,
  })

  player.addListener('player_state_changed', (state) => {
    console.log('Spotify player state changed:', state)
  })

  player.addListener('ready', ({ device_id }) => {
    playerDeviceId = device_id
    console.log('Spotify player ready with device id:', device_id)
  })

  player.addListener('not_ready', ({ device_id }) => {
    console.warn('Spotify player not ready:', device_id)
    if (playerDeviceId === device_id) playerDeviceId = null
  })

  player.addListener('initialization_error', ({ message }) => {
    console.error('Initialization error:', message)
  })

  player.addListener('authentication_error', ({ message }) => {
    console.error('Authentication error:', message)
  })

  player.addListener('account_error', ({ message }) => {
    console.error('Account error:', message)
  })

  player.connect().then((success) => {
    if (success) {
      console.log('Spotify player connected')
      resolve()
    } else {
      reject(new Error('Failed to connect Spotify player'))
    }
  })
}

export function getPlayer(): SpotifyPlayer | null {
  return player
}

export async function playTrack(trackUri: string): Promise<void> {
  if (!player) throw new Error('Spotify player not initialized')
  try {
    console.log('Playing track:', trackUri)
    console.log('Player device ID:', playerDeviceId)
    
    if (!playerDeviceId) {
      console.warn('Waiting for device to be ready...')
      const deviceId = await waitForDeviceReady()
      console.log('Device ready:', deviceId)
    }
    
    // Use Spotify Web API to start playback
    const token = await getFreshToken()
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerDeviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [trackUri],
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Failed to start playback: ${response.status} ${errorText}`)
    }
    
    console.log('Track playing via Web API')
  } catch (err) {
    console.error('Failed to play track:', err)
    throw err
  }
}

export async function playPlaylist(playlistUri: string): Promise<void> {
  if (!player) {
    console.error('Spotify player not initialized')
    throw new Error('Spotify player not initialized. Please reconnect Spotify.')
  }
  try {
    console.log('Playing playlist:', playlistUri)
    console.log('Player device ID:', playerDeviceId)
    
    if (!playerDeviceId) {
      console.warn('Waiting for device to be ready...')
      const deviceId = await waitForDeviceReady()
      console.log('Device ready:', deviceId)
    }
    
    // Use Spotify Web API to start playback (not player.play which doesn't exist)
    const token = await getFreshToken()
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerDeviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context_uri: playlistUri,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Failed to start playback: ${response.status} ${errorText}`)
    }
    
    console.log('Playlist playing via Web API')
  } catch (err) {
    console.error('Failed to play playlist:', err)
    throw err
  }
}

export async function play(): Promise<void> {
  if (!player) throw new Error('Spotify player not initialized')
  const token = await getFreshToken()
  await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}

export async function pause(): Promise<void> {
  if (!player) throw new Error('Spotify player not initialized')
  const token = await getFreshToken()
  await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}

export async function nextTrack(): Promise<void> {
  if (!player) throw new Error('Spotify player not initialized')
  await player.nextTrack()
}

export async function previousTrack(): Promise<void> {
  if (!player) throw new Error('Spotify player not initialized')
  await player.previousTrack()
}

export async function seek(ms: number): Promise<void> {
  if (!player) throw new Error('Spotify player not initialized')
  await player.seek(ms)
}

export async function setVolume(volume: number): Promise<void> {
  // Support both SDK player and Web API device volume
  const percent = Math.round(Math.max(0, Math.min(1, volume)) * 100)
  try {
    const token = await getFreshToken()
    // Use Web API to set device volume (works for any active device)
    await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${percent}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    console.error('Failed to set volume via Web API, falling back to SDK setVolume', err)
    if (!player) throw new Error('Spotify player not initialized')
    await player.setVolume(Math.max(0, Math.min(1, volume)))
  }
}

export async function getCurrentState() {
  if (!player) return null
  return await player.getCurrentState()
}

export async function getAvailableDevices(): Promise<any[]> {
  const token = await getFreshToken()
  const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch devices')
  const data = await res.json()
  return data.devices || []
}

export async function transferPlaybackToDevice(deviceId: string, play = false): Promise<void> {
  const token = await getFreshToken()
  const res = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [deviceId], play }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to transfer playback: ${res.status} ${text}`)
  }
}

export async function setShuffle(state: boolean): Promise<void> {
  const token = await getFreshToken()
  const res = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${state}` , {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error('Failed to set shuffle')
  }
}

export async function setRepeat(mode: 'off' | 'track' | 'context'): Promise<void> {
  const token = await getFreshToken()
  const res = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${mode}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error('Failed to set repeat')
  }
}

export function getDeviceId(): string | null {
  return playerDeviceId
}

export function disconnectPlayer(): void {
  if (player) {
    player.disconnect()
    player = null
  }
}
