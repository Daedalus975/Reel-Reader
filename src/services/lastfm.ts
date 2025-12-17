/**
 * Last.fm API - Music metadata
 * Free API: https://www.last.fm/api
 * Get API key: https://www.last.fm/api/account/create
 */

// @ts-ignore
const API_KEY: string | undefined = import.meta.env.VITE_LASTFM_API_KEY
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

export interface LastFmTrack {
  name: string
  artist: string
  url: string
  image?: Array<{ '#text': string; size: string }>
  mbid?: string
  listeners?: string
  playcount?: string
}

export interface LastFmAlbum {
  name: string
  artist: string
  url: string
  image?: Array<{ '#text': string; size: string }>
  mbid?: string
  playcount?: string
}

export interface LastFmArtist {
  name: string
  url: string
  image?: Array<{ '#text': string; size: string }>
  mbid?: string
  listeners?: string
}

export interface LastFmSearchResponse {
  results: {
    trackmatches?: { track: LastFmTrack[] }
    albummatches?: { album: LastFmAlbum[] }
    artistmatches?: { artist: LastFmArtist[] }
  }
}

// Map to iTunes-like shape for UI compatibility
function mapLastFmTrackToITunes(track: LastFmTrack) {
  const artworkUrl100 = track.image?.find((img) => img.size === 'large' || img.size === 'extralarge')?.[
    '#text'
  ]
  return {
    collectionId: undefined,
    trackId: undefined,
    artistName: track.artist,
    collectionName: undefined,
    trackName: track.name,
    artworkUrl100,
    primaryGenreName: undefined,
    releaseDate: undefined,
    // Extra Last.fm fields
    listeners: track.listeners ? parseInt(track.listeners) : undefined,
    playcount: track.playcount ? parseInt(track.playcount) : undefined,
    url: track.url,
  }
}

function mapLastFmAlbumToITunes(album: LastFmAlbum) {
  const artworkUrl100 = album.image?.find((img) => img.size === 'large' || img.size === 'extralarge')?.[
    '#text'
  ]
  return {
    collectionId: undefined,
    trackId: undefined,
    artistName: album.artist,
    collectionName: album.name,
    trackName: undefined,
    artworkUrl100,
    primaryGenreName: undefined,
    releaseDate: undefined,
    playcount: album.playcount ? parseInt(album.playcount) : undefined,
    url: album.url,
  }
}

export async function searchLastFmTracks(query: string): Promise<any[]> {
  if (!API_KEY) {
    console.warn('Last.fm API key not configured. Add VITE_LASTFM_API_KEY to .env.local')
    return []
  }

  try {
    const url = `${BASE_URL}?method=track.search&track=${encodeURIComponent(
      query,
    )}&api_key=${API_KEY}&format=json&limit=20`
    const res = await fetch(url)
    const data: LastFmSearchResponse = await res.json()
    const tracks = data.results?.trackmatches?.track || []
    return tracks.map(mapLastFmTrackToITunes)
  } catch (err) {
    console.error('Last.fm track search error', err)
    return []
  }
}

export async function searchLastFmAlbums(query: string): Promise<any[]> {
  if (!API_KEY) return []

  try {
    const url = `${BASE_URL}?method=album.search&album=${encodeURIComponent(
      query,
    )}&api_key=${API_KEY}&format=json&limit=20`
    const res = await fetch(url)
    const data: LastFmSearchResponse = await res.json()
    const albums = data.results?.albummatches?.album || []
    return albums.map(mapLastFmAlbumToITunes)
  } catch (err) {
    console.error('Last.fm album search error', err)
    return []
  }
}

export async function searchLastFm(query: string): Promise<any[]> {
  // Combine album and track search, prioritize albums
  const [albums, tracks] = await Promise.all([searchLastFmAlbums(query), searchLastFmTracks(query)])
  
  // Dedupe by (artist + name) and merge, sort by playcount/listeners
  const combined = [...albums, ...tracks]
  const seen = new Set<string>()
  const unique = combined.filter((item) => {
    const key = `${item.artistName}::${item.collectionName || item.trackName || ''}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  // Sort by playcount/listeners descending
  unique.sort((a, b) => {
    const scoreA = (a.playcount || 0) + (a.listeners || 0) * 10
    const scoreB = (b.playcount || 0) + (b.listeners || 0) * 10
    return scoreB - scoreA
  })
  
  return unique
}
