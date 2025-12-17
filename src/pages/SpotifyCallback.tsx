import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { exchangeCodeForToken, getStoredToken } from '@/services/spotify'
import { initSpotifyPlayback } from '@/services/spotifyPlayback'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'

export function SpotifyCallback() {
  const nav = useNavigate()
  const loc = useLocation()
  const [error, setError] = useState<string | null>(null)
  const hasRunRef = useRef(false)
  const initPlayback = useSpotifyPlaybackStore((s) => s.initializePlayback)

  useEffect(() => {
    // Prevent duplicate exchange attempts (React Strict Mode runs effects twice)
    if (hasRunRef.current) {
      console.log('SpotifyCallback: already processed, skipping')
      return
    }

    const params = new URLSearchParams(loc.search)
    const code = params.get('code')
    const err = params.get('error')
    
    console.log('SpotifyCallback: processing', { hasCode: !!code, hasError: !!err })
    
    if (err) {
      setError(err)
      return
    }
    if (!code) {
      setError('Missing authorization code')
      return
    }

    hasRunRef.current = true

    ;(async () => {
      try {
        console.log('SpotifyCallback: exchanging code...')
        await exchangeCodeForToken(code)
        console.log('SpotifyCallback: token exchange complete')
        
        // Initialize Spotify playback
        const token = getStoredToken()
        if (token?.accessToken) {
          try {
            console.log('SpotifyCallback: initializing playback...')
            await initSpotifyPlayback()
            await initPlayback()
            console.log('Spotify playback initialized')
          } catch (playbackErr) {
            console.error('Failed to initialize playback:', playbackErr)
            // Don't fail auth if playback fails
          }
        }
        
        console.log('SpotifyCallback: navigating to settings')
        nav('/settings?spotify=connected', { replace: true })
      } catch (e: any) {
        console.error('SpotifyCallback: error', e)
        setError(e?.message || 'Failed to complete Spotify auth')
        hasRunRef.current = false
      }
    })()
  }, [loc.search, nav, initPlayback])

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-light mb-4">Connecting to Spotify…</h1>
      {error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="text-gray-400">Please wait, finalizing authentication.</div>
      )}
    </main>
  )
}

