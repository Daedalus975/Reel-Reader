/**
 * Centralized metadata service supporting multiple sources with fallback
 */

import type { Media, MediaType } from '@/types'

export interface MetadataSource {
  name: string
  priority: number
  enabled: boolean
  supportedTypes: MediaType[]
  fetch: (media: Partial<Media>) => Promise<Partial<Media> | null>
}

export interface MetadataConfig {
  autoFetch: boolean
  sources: {
    tmdb?: { apiKey: string; enabled: boolean }
    omdb?: { apiKey: string; enabled: boolean }
    tvdb?: { apiKey: string; enabled: boolean }
    musicbrainz?: { enabled: boolean }
    lastfm?: { apiKey: string; enabled: boolean }
    googleBooks?: { apiKey: string; enabled: boolean }
    openLibrary?: { enabled: boolean }
    r18?: { enabled: boolean }
    javlibrary?: { enabled: boolean }
  }
}

/**
 * Merge metadata from multiple sources
 * Priority: local data > source 1 > source 2 > ...
 */
export function mergeMetadata(base: Partial<Media>, ...sources: Array<Partial<Media> | null>): Partial<Media> {
  const merged = { ...base }
  
  for (const source of sources) {
    if (!source) continue
    
    // Merge arrays (genres, tags, cast, etc.)
    if (source.genres?.length) {
      merged.genres = [...new Set([...(merged.genres || []), ...source.genres])]
    }
    if (source.tags?.length) {
      merged.tags = [...new Set([...(merged.tags || []), ...source.tags])]
    }
    if (source.cast?.length) {
      merged.cast = [...new Set([...(merged.cast || []), ...source.cast])]
    }
    
    // Fill in missing fields
    if (!merged.description && source.description) merged.description = source.description
    if (!merged.posterUrl && source.posterUrl) merged.posterUrl = source.posterUrl
    if (!merged.backdropUrl && source.backdropUrl) merged.backdropUrl = source.backdropUrl
    if (!merged.releaseDate && source.releaseDate) merged.releaseDate = source.releaseDate
    if (!merged.runtime && source.runtime) merged.runtime = source.runtime
    if (!merged.rating && source.rating) merged.rating = source.rating
    if (!merged.director && source.director) merged.director = source.director
    if (!merged.studio && source.studio) merged.studio = source.studio
    if (!merged.language && source.language) merged.language = source.language
    if (!merged.country && source.country) merged.country = source.country
    
    // Adult content specific
    if (!merged.series && source.series) merged.series = source.series
    if (!merged.productCode && source.productCode) merged.productCode = source.productCode
  }
  
  return merged
}

/**
 * Parse metadata from .nfo files (Kodi/Plex format)
 */
export async function parseNfoFile(nfoPath: string): Promise<Partial<Media> | null> {
  try {
    const fs = await import('@tauri-apps/api/fs')
    const content = await fs.readTextFile(nfoPath)
    
    // Parse XML-like .nfo format
    const metadata: Partial<Media> = {}
    
    const extract = (tag: string): string | undefined => {
      const match = content.match(new RegExp(`<${tag}>(.+?)</${tag}>`, 's'))
      return match?.[1]?.trim()
    }
    
    const extractMultiple = (tag: string): string[] => {
      const matches = content.matchAll(new RegExp(`<${tag}>(.+?)</${tag}>`, 'gs'))
      return Array.from(matches).map(m => m[1].trim()).filter(Boolean)
    }
    
    metadata.title = extract('title')
    metadata.description = extract('plot') || extract('overview')
    metadata.releaseDate = extract('premiered') || extract('releasedate')
    metadata.rating = extract('rating') ? parseFloat(extract('rating')!) : undefined
    metadata.director = extract('director')
    metadata.studio = extract('studio')
    metadata.runtime = extract('runtime') ? parseInt(extract('runtime')!) : undefined
    
    const genres = extractMultiple('genre')
    if (genres.length) metadata.genres = genres
    
    const actors = extractMultiple('name') // Within <actor><name>
    if (actors.length) metadata.cast = actors
    
    // Poster/artwork
    const thumb = extract('thumb')
    if (thumb) metadata.posterUrl = thumb
    
    return metadata
  } catch (error) {
    console.warn('Failed to parse .nfo file:', error)
    return null
  }
}

/**
 * Enhanced filename parser with more patterns
 */
export function parseFilenameAdvanced(filename: string, mediaType: MediaType): Partial<Media> {
  const metadata: Partial<Media> = {}
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  
  // Year extraction (2020) or [2020]
  const yearMatch = nameWithoutExt.match(/[(\[](\d{4})[)\]]/)
  if (yearMatch) {
    metadata.releaseDate = `${yearMatch[1]}-01-01`
  }
  
  // TV Show: S01E05 or s1e5 or 1x05
  const episodeMatch = nameWithoutExt.match(/[Ss](\d{1,2})[Ee](\d{1,2})/)
  if (episodeMatch && mediaType === 'tv') {
    metadata.seasonNumber = parseInt(episodeMatch[1])
    metadata.episodeNumber = parseInt(episodeMatch[2])
  }
  
  // Resolution: 1080p, 720p, 4K, 2160p
  const resolutionMatch = nameWithoutExt.match(/(4K|2160p|1080p|720p|480p)/i)
  if (resolutionMatch) {
    metadata.quality = resolutionMatch[1].toUpperCase()
  }
  
  // Codec: x264, x265, HEVC, AVC
  const codecMatch = nameWithoutExt.match(/(x264|x265|HEVC|H\.264|H\.265|AVC)/i)
  if (codecMatch) {
    metadata.videoCodec = codecMatch[1].toUpperCase()
  }
  
  // Audio: AAC, AC3, DTS, Atmos
  const audioMatch = nameWithoutExt.match(/(AAC|AC3|DTS|Atmos|TrueHD)/i)
  if (audioMatch) {
    metadata.audioCodec = audioMatch[1].toUpperCase()
  }
  
  // JAV specific: Product code (e.g., IPX-123, SSIS-456)
  if (mediaType === 'jav') {
    const javCodeMatch = nameWithoutExt.match(/([A-Z]{2,5})-(\d{3,5})/i)
    if (javCodeMatch) {
      metadata.productCode = javCodeMatch[0].toUpperCase()
      metadata.series = javCodeMatch[1].toUpperCase()
    }
  }
  
  // Doujinshi: Circle name, event, language
  if (mediaType === 'doujinshi') {
    // [Circle Name] Title (Event) [Language]
    const circleMatch = nameWithoutExt.match(/^\[([^\]]+)\]/)
    if (circleMatch) {
      metadata.studio = circleMatch[1] // Use studio field for circle
    }
    
    const eventMatch = nameWithoutExt.match(/\(([^)]+)\)/)
    if (eventMatch && !yearMatch) { // If not a year
      metadata.tags = [eventMatch[1]]
    }
    
    const langMatch = nameWithoutExt.match(/\[([A-Z]{2})\]/i)
    if (langMatch) {
      metadata.language = langMatch[1].toLowerCase()
    }
  }
  
  // Music: Artist - Title or Artist - Album - Track
  if (mediaType === 'music') {
    const musicMatch = nameWithoutExt.match(/^(.+?)\s*-\s*(.+?)(?:\s*-\s*(.+))?$/)
    if (musicMatch) {
      metadata.artist = musicMatch[1].trim()
      if (musicMatch[3]) {
        metadata.album = musicMatch[2].trim()
        metadata.title = musicMatch[3].trim()
      } else {
        metadata.title = musicMatch[2].trim()
      }
    }
  }
  
  // Clean title: remove all metadata tags
  let title = nameWithoutExt
    .replace(/[(\[](\d{4})[)\]]/, '') // Year
    .replace(/[Ss]\d{1,2}[Ee]\d{1,2}/, '') // Episode
    .replace(/\d{1,2}x\d{1,2}/, '') // 1x05
    .replace(/(4K|2160p|1080p|720p|480p)/gi, '') // Resolution
    .replace(/(x264|x265|HEVC|H\.264|H\.265|AVC)/gi, '') // Codec
    .replace(/(AAC|AC3|DTS|Atmos|TrueHD)/gi, '') // Audio
    .replace(/\[([^\]]+)\]/g, '') // Tags in brackets
    .replace(/\(([^)]+)\)/g, '') // Tags in parentheses
    .replace(/[._]/g, ' ') // Dots and underscores
    .replace(/\s+/g, ' ') // Multiple spaces
    .trim()
  
  if (!metadata.title) {
    metadata.title = title
  }
  
  return metadata
}

/**
 * Check for metadata sidecar files
 */
export async function findMetadataSidecars(mediaPath: string): Promise<Partial<Media> | null> {
  try {
    const fs = await import('@tauri-apps/api/fs')
    const path = await import('@tauri-apps/api/path')
    
    const basePath = mediaPath.replace(/\.[^/.]+$/, '') // Remove extension
    const possibleSidecars = [
      `${basePath}.nfo`,
      `${basePath}-info.json`,
      `${basePath}.xml`,
      `${basePath}.json`,
    ]
    
    for (const sidecarPath of possibleSidecars) {
      try {
        const exists = await fs.exists(sidecarPath)
        if (!exists) continue
        
        if (sidecarPath.endsWith('.nfo') || sidecarPath.endsWith('.xml')) {
          return await parseNfoFile(sidecarPath)
        }
        
        if (sidecarPath.endsWith('.json')) {
          const content = await fs.readTextFile(sidecarPath)
          return JSON.parse(content)
        }
      } catch (error) {
        continue
      }
    }
    
    return null
  } catch (error) {
    console.warn('Error checking for sidecar files:', error)
    return null
  }
}

/**
 * Main metadata fetching pipeline
 */
export async function fetchMetadataWithFallback(
  media: Partial<Media>,
  config: MetadataConfig,
  sources: MetadataSource[]
): Promise<Partial<Media>> {
  // Start with existing data
  let enriched = { ...media }
  
  // Step 1: Parse filename if we have a file path
  if (media.filePath) {
    const filename = media.filePath.split(/[/\\]/).pop() || ''
    const filenameData = parseFilenameAdvanced(filename, media.type!)
    enriched = mergeMetadata(enriched, filenameData)
    
    // Step 2: Check for sidecar files (.nfo, .json, etc.)
    const sidecarData = await findMetadataSidecars(media.filePath)
    enriched = mergeMetadata(enriched, sidecarData)
  }
  
  // Step 3: Fetch from APIs if auto-fetch is enabled
  if (config.autoFetch) {
    const sortedSources = sources
      .filter(s => s.enabled && s.supportedTypes.includes(media.type!))
      .sort((a, b) => a.priority - b.priority)
    
    for (const source of sortedSources) {
      try {
        const apiData = await source.fetch(enriched)
        enriched = mergeMetadata(enriched, apiData)
      } catch (error) {
        console.warn(`Failed to fetch from ${source.name}:`, error)
      }
    }
  }
  
  return enriched
}
