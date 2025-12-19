/**
 * M3U Playlist Service
 * Import and export M3U/M3U8 playlists
 */

import type { Media } from '@/types'

export interface M3UEntry {
  duration: number
  title: string
  artist?: string
  path: string
}

/**
 * Parse M3U/M3U8 playlist content
 */
export const parseM3U = (content: string): M3UEntry[] => {
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean)
  const entries: M3UEntry[] = []

  let currentEntry: Partial<M3UEntry> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Extended M3U directive
    if (line.startsWith('#EXTM3U')) {
      continue
    }

    // Track info: #EXTINF:duration,artist - title
    if (line.startsWith('#EXTINF:')) {
      const match = line.match(/#EXTINF:(-?\d+),(.*)/)
      if (match) {
        const duration = parseInt(match[1])
        const info = match[2]

        currentEntry.duration = duration >= 0 ? duration : 0

        // Try to parse "Artist - Title" format
        const artistTitle = info.split(' - ')
        if (artistTitle.length === 2) {
          currentEntry.artist = artistTitle[0].trim()
          currentEntry.title = artistTitle[1].trim()
        } else {
          currentEntry.title = info.trim()
        }
      }
      continue
    }

    // Comment
    if (line.startsWith('#')) {
      continue
    }

    // Path (track URL or file path)
    if (line) {
      currentEntry.path = line
      if (currentEntry.title && currentEntry.path) {
        entries.push({
          duration: currentEntry.duration || 0,
          title: currentEntry.title,
          artist: currentEntry.artist,
          path: currentEntry.path,
        })
      }
      currentEntry = {}
    }
  }

  return entries
}

/**
 * Generate M3U playlist content from media items
 */
export const generateM3U = (items: Media[]): string => {
  let content = '#EXTM3U\n\n'

  for (const item of items) {
    const duration = Math.round(item.duration || 0)
    const artist = item.description || item.genres?.[0] || ''
    const title = item.title || 'Unknown'
    const path = item.filePath || item.previewUrl || item.trailerUrl || ''

    if (!path) continue

    // Write extended info
    if (artist) {
      content += `#EXTINF:${duration},${artist} - ${title}\n`
    } else {
      content += `#EXTINF:${duration},${title}\n`
    }

    // Write path
    content += `${path}\n\n`
  }

  return content
}

/**
 * Export M3U playlist to file (desktop only)
 */
export const exportM3UPlaylist = async (items: Media[], filename: string): Promise<void> => {
  const content = generateM3U(items)
  const blob = new Blob([content], { type: 'audio/x-mpegurl' })

  // Create download link
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.m3u') ? filename : `${filename}.m3u`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import M3U playlist from file
 */
export const importM3UPlaylist = async (file: File): Promise<M3UEntry[]> => {
  const content = await file.text()
  return parseM3U(content)
}

/**
 * Match M3U entries with existing library items
 */
export const matchM3UWithLibrary = (
  entries: M3UEntry[],
  library: Media[]
): Array<{ entry: M3UEntry; match: Media | null }> => {
  return entries.map((entry) => {
    // Try to find exact file path match
    let match = library.find((media) => media.filePath === entry.path)

    // Try to match by title
    if (!match) {
      const normalizedTitle = entry.title.toLowerCase()
      match = library.find((media) => media.title.toLowerCase() === normalizedTitle)
    }

    // Try to match by title and artist
    if (!match && entry.artist) {
      const normalizedTitle = entry.title.toLowerCase()
      const normalizedArtist = entry.artist.toLowerCase()
      match = library.find(
        (media) =>
          media.title.toLowerCase() === normalizedTitle &&
          (media.description?.toLowerCase().includes(normalizedArtist) ||
            media.genres?.some((g) => g.toLowerCase().includes(normalizedArtist)))
      )
    }

    return { entry, match: match || null }
  })
}
