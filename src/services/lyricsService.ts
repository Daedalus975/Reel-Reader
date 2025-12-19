/**
 * Lyrics Service
 * Fetches song lyrics from multiple sources
 */

export interface LyricsLine {
  time: number // seconds
  text: string
}

export interface Lyrics {
  plain?: string // Plain text lyrics
  synced?: LyricsLine[] // Time-synced lyrics
  source: string
  artist?: string
  title?: string
}

/**
 * Fetch lyrics from local metadata (if available)
 */
const fetchLocalLyrics = async (_filePath: string): Promise<Lyrics | null> => {
  // In a real implementation, this would use Tauri to read embedded lyrics from audio files
  // For now, return null
  return null
}

/**
 * Parse LRC format (synced lyrics)
 * Example: [00:12.00]Line of lyrics
 */
const parseLRC = (lrc: string): LyricsLine[] => {
  const lines: LyricsLine[] = []
  const lrcLines = lrc.split('\n')

  for (const line of lrcLines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const hundredths = parseInt(match[3])
      const time = minutes * 60 + seconds + hundredths / 100
      const text = match[4].trim()
      if (text) {
        lines.push({ time, text })
      }
    }
  }

  return lines
}

/**
 * Fetch lyrics from LRCLIB (open-source lyrics database)
 * https://lrclib.net/
 */
const fetchFromLRCLIB = async (artist: string, title: string, album?: string, duration?: number): Promise<Lyrics | null> => {
  try {
    const params = new URLSearchParams({
      artist_name: artist,
      track_name: title,
    })
    if (album) params.append('album_name', album)
    if (duration) params.append('duration', Math.round(duration).toString())

    const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`)
    if (!response.ok) return null

    const data = await response.json()
    
    const lyrics: Lyrics = {
      source: 'LRCLIB',
      artist: data.artistName,
      title: data.trackName,
    }

    if (data.syncedLyrics) {
      lyrics.synced = parseLRC(data.syncedLyrics)
    }
    if (data.plainLyrics) {
      lyrics.plain = data.plainLyrics
    }

    return lyrics
  } catch (error) {
    console.error('LRCLIB fetch error:', error)
    return null
  }
}

/**
 * Fetch lyrics from Genius (requires API key - optional)
 * This is a placeholder for future implementation
 */
const fetchFromGenius = async (_artist: string, _title: string): Promise<Lyrics | null> => {
  // Would require Genius API key and proper implementation
  // For now, return null
  return null
}

/**
 * Main lyrics fetching function
 * Tries multiple sources in order
 */
export const fetchLyrics = async (
  artist: string,
  title: string,
  options?: {
    filePath?: string
    album?: string
    duration?: number
  }
): Promise<Lyrics | null> => {
  // Try local metadata first
  if (options?.filePath) {
    const local = await fetchLocalLyrics(options.filePath)
    if (local) return local
  }

  // Try LRCLIB (open-source, no API key needed)
  const lrclib = await fetchFromLRCLIB(artist, title, options?.album, options?.duration)
  if (lrclib) return lrclib

  // Try Genius (if API key is configured in future)
  const genius = await fetchFromGenius(artist, title)
  if (genius) return genius

  return null
}

/**
 * Get the current line for synced lyrics
 */
export const getCurrentLyricsLine = (lyrics: LyricsLine[], currentTime: number): number => {
  if (!lyrics.length) return -1

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i
    }
  }

  return -1
}
