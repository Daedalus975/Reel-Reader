import type { Source } from './sourceModel'
import { isDesktop } from '@/utils/runtime'

const VIDEO_EXT = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v']
const AUDIO_EXT = ['mp3', 'flac', 'm4a', 'wav', 'ogg', 'aac', 'wma']
const BOOK_EXT = ['epub', 'pdf', 'mobi', 'azw3', 'cbz', 'cbr']

function looksLikeMedia(path: string) {
  const parts = path.split('.')
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : ''
  return VIDEO_EXT.includes(ext) || AUDIO_EXT.includes(ext) || BOOK_EXT.includes(ext)
}

/**
 * Parse filename to extract title and year
 * Examples:
 *   "Movie Title (2020).mp4" -> { title: "Movie Title", year: 2020 }
 *   "Show.S01E05.Episode.Title.mkv" -> { title: "Show", season: 1, episode: 5 }
 */
export function parseFilename(filename: string) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  
  // Try to extract year in parentheses or brackets
  const yearMatch = nameWithoutExt.match(/[(\[](\d{4})[)\]]/)
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined
  
  // Try to extract season/episode (e.g., S01E05, s1e5, 1x05)
  const episodeMatch = nameWithoutExt.match(/[Ss](\d{1,2})[Ee](\d{1,2})/)
  const season = episodeMatch ? parseInt(episodeMatch[1]) : undefined
  const episode = episodeMatch ? parseInt(episodeMatch[2]) : undefined
  
  // Extract title (remove year, season/episode info, and common separators)
  let title = nameWithoutExt
    .replace(/[(\[](\d{4})[)\]]/, '') // Remove year
    .replace(/[Ss]\d{1,2}[Ee]\d{1,2}/, '') // Remove S01E05
    .replace(/\d{1,2}x\d{1,2}/, '') // Remove 1x05
    .replace(/[._]/g, ' ') // Replace dots and underscores with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  return { title, year, season, episode }
}

// Desktop-aware scanner: use Tauri fs when available, otherwise fallback to a small stub
export const scanSource = async (source: Source): Promise<string[]> => {
  if (!isDesktop()) {
    // Web fallback: return a small stub so UI can be exercised
    return new Promise((resolve) => {
      setTimeout(() => resolve([`${source.path}/dummy-media-1.mp4`, `${source.path}/dummy-media-2.mp3`]), 30)
    })
  }

  try {
    const fs = await import('@tauri-apps/api/fs') as any
    // readDir supports recursive option in Tauri; use it if available
    const opts = { recursive: true }
    const entries = await (fs.readDir ? fs.readDir(source.path, opts) : fs.readDir(source.path))

    const files: string[] = []
    const collect = (items: any[]) => {
      for (const it of items || []) {
        if (it.children && it.children.length) collect(it.children)
        if (it.path && !it.children) {
          if (looksLikeMedia(it.path)) files.push(it.path)
        }
      }
    }

    collect(entries)
    return files
  } catch (err) {
    console.warn('scanSource failed', err)
    return []
  }
}

export default scanSource
