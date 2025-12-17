// Minimal Spotify Web API PKCE helper (client-side)
// Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

const CLIENT_ID = (import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID as string | undefined
const ENV_REDIRECT = (import.meta as any).env?.VITE_SPOTIFY_REDIRECT_URI as string | undefined

const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'

// Scopes for metadata, playlists, and playback
export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function randomString(length = 64): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'
  let result = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < array.length; i++) result += chars[array[i] % chars.length]
  return result
}

async function sha256(input: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  return crypto.subtle.digest('SHA-256', data)
}

function getRedirectUri(): string {
  // Use the configured env redirect URI if available, otherwise use current origin
  // This ensures consistency with what's registered in Spotify dashboard
  if (ENV_REDIRECT) return ENV_REDIRECT
  return `${window.location.origin}/auth/spotify/callback`
}

export async function startSpotifyAuth(): Promise<void> {
  console.log('CLIENT_ID:', CLIENT_ID)
  console.log('ENV_REDIRECT:', ENV_REDIRECT)
  if (!CLIENT_ID) {
    console.warn('Spotify CLIENT_ID is not set in env')
    return
  }
  const redirectUri = getRedirectUri()
  console.log('Final redirect URI:', redirectUri)
  const verifier = randomString(64)
  const challenge = base64UrlEncode(await sha256(verifier))
  // Persist in both sessionStorage and localStorage so a hard reload doesn't lose it
  sessionStorage.setItem('spotify_code_verifier', verifier)
  sessionStorage.setItem('spotify_redirect_uri_used', redirectUri)
  localStorage.setItem('spotify_code_verifier', verifier)
  localStorage.setItem('spotify_redirect_uri_used', redirectUri)

  // Encode fallback state with verifier + redirect (simple base64, no double-encoding)
  const statePayload = {
    v: verifier,
    r: redirectUri,
    t: Date.now(),
    n: randomString(12),
  }
  const state = btoa(JSON.stringify(statePayload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SPOTIFY_SCOPES,
    state,
  })
  const fullUrl = `${AUTH_URL}?${params.toString()}`
  console.log('Redirecting to:', fullUrl)
  window.location.href = fullUrl
}

export async function exchangeCodeForToken(code: string): Promise<void> {
  if (!CLIENT_ID) throw new Error('Spotify env not configured')
  const params = new URLSearchParams(window.location.search)
  const stateRaw = params.get('state')

  let verifier =
    sessionStorage.getItem('spotify_code_verifier') ||
    localStorage.getItem('spotify_code_verifier') ||
    null

  let redirectFromState: string | null = null
  if (stateRaw) {
    try {
      // Decode base64url back to base64
      const base64 = stateRaw.replace(/-/g, '+').replace(/_/g, '/')
      const decoded = atob(base64)
      const parsed = JSON.parse(decoded)
      if (parsed?.v) verifier = verifier || parsed.v
      if (parsed?.r) redirectFromState = parsed.r
    } catch (err) {
      console.warn('Failed to parse spotify state', err)
    }
  }

  if (!verifier) throw new Error('Missing PKCE code_verifier (state and storage empty; try Connect again)')

  const storedRedirect =
    sessionStorage.getItem('spotify_redirect_uri_used') ||
    localStorage.getItem('spotify_redirect_uri_used') ||
    redirectFromState ||
    getRedirectUri()

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: storedRedirect,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  })

  console.log('Exchanging Spotify code', { redirect_uri: storedRedirect, hasVerifier: Boolean(verifier) })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('Spotify token exchange failed', {
      status: res.status,
      body: text,
      redirect_uri: storedRedirect,
      had_verifier: Boolean(verifier),
    })
    throw new Error(`Token exchange failed: ${res.status}`)
  }

  // Clear stored verifier once used
  sessionStorage.removeItem('spotify_code_verifier')
  sessionStorage.removeItem('spotify_redirect_uri_used')
  localStorage.removeItem('spotify_code_verifier')
  localStorage.removeItem('spotify_redirect_uri_used')

  const data = await res.json()
  const now = Math.floor(Date.now() / 1000)
  localStorage.setItem('spotify_access_token', data.access_token)
  if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token)
  localStorage.setItem('spotify_expires_at', String(now + (data.expires_in || 3600)))
}

export function getStoredToken(): { accessToken: string | null; expiresAt: number; refreshToken: string | null } {
  const accessToken = localStorage.getItem('spotify_access_token')
  const refreshToken = localStorage.getItem('spotify_refresh_token')
  const expiresAt = parseInt(localStorage.getItem('spotify_expires_at') || '0', 10)
  return { accessToken, expiresAt: isNaN(expiresAt) ? 0 : expiresAt, refreshToken }
}

export async function refreshSpotifyToken(): Promise<boolean> {
  if (!CLIENT_ID) return false
  const refreshToken = localStorage.getItem('spotify_refresh_token')
  if (!refreshToken) return false

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return false
  const data = await res.json()
  const now = Math.floor(Date.now() / 1000)
  if (data.access_token) localStorage.setItem('spotify_access_token', data.access_token)
  if (data.expires_in) localStorage.setItem('spotify_expires_at', String(now + data.expires_in))
  // Some refreshes return a new refresh_token
  if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token)
  return true
}

export function isSpotifyConnected(): boolean {
  const { accessToken, expiresAt } = getStoredToken()
  if (!accessToken) return false
  const now = Math.floor(Date.now() / 1000)
  return expiresAt > now + 30
}

export function disconnectSpotify(): void {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_refresh_token')
  localStorage.removeItem('spotify_expires_at')
}
