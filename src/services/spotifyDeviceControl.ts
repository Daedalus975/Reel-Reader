// Helper to transfer playback to Reel Reader device

import { getStoredToken, refreshSpotifyToken } from './spotify'

const API_BASE = 'https://api.spotify.com/v1'

async function getValidToken(): Promise<string> {
  const token = getStoredToken()
  if (!token?.accessToken) throw new Error('Not authenticated with Spotify')

  // Check if expired and refresh if needed
  if (token.expiresAt && Date.now() >= token.expiresAt) {
    const refreshed = await refreshSpotifyToken()
    if (!refreshed) throw new Error('Failed to refresh Spotify token')
  }

  const freshToken = getStoredToken()
  if (!freshToken?.accessToken) throw new Error('No access token available')
  return freshToken.accessToken
}

async function spotifyFetch(endpoint: string, method = 'GET', body?: any): Promise<any> {
  const token = await getValidToken()
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Spotify API error: ${err.error?.message || res.statusText}`)
  }
  return res.json()
}

export async function getAvailableDevices() {
  try {
    const data = await spotifyFetch('/me/player/devices')
    console.log('Available Spotify devices:', data.devices)
    return data.devices
  } catch (err) {
    console.error('Failed to get Spotify devices:', err)
    return []
  }
}

export async function transferPlaybackToDevice(deviceId: string, play = false): Promise<boolean> {
  try {
    await spotifyFetch('/me/player', 'PUT', {
      device_ids: [deviceId],
      play,
    })
    console.log('Playback transferred to device', deviceId)
    return true
  } catch (err) {
    console.error('Failed to transfer playback:', err)
    return false
  }
}

export async function transferPlaybackToReelReader(): Promise<boolean> {
  try {
    const devices = await getAvailableDevices()

    // Look for Reel Reader device
    const reelReaderDevice = devices.find((d: any) => d.name === 'Reel Reader')

    if (!reelReaderDevice) {
      console.warn('Reel Reader device not found in available devices')
      return false
    }

    return await transferPlaybackToDevice(reelReaderDevice.id, false)
  } catch (err) {
    console.error('Failed to transfer playback:', err)
    return false
  }
}
