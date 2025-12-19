/**
 * Adult books (doujinshi) metadata sources
 * Note: These require careful implementation due to content nature
 */

import type { Media } from '@/types'
import type { MetadataSource } from './metadataService'

/**
 * Enhanced doujinshi filename parser
 * Common patterns:
 *   "[Circle Name] Title (Event) [Language].cbz"
 *   "(Event) [Circle Name] Title [Tags].zip"
 *   "[Artist (Circle)] Title [Language].pdf"
 */
export function parseDoujinshiFilename(filename: string): Partial<Media> {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  const metadata: Partial<Media> = {
    genres: [],
    tags: [],
  }
  
  // Extract circle/artist from [Circle Name] or [Artist (Circle)]
  const circleMatch = nameWithoutExt.match(/^\[([^\]]+)\]/)
  if (circleMatch) {
    const circleText = circleMatch[1]
    // Check if it contains artist (circle) pattern
    const artistCircleMatch = circleText.match(/^(.+?)\s*\((.+?)\)$/)
    if (artistCircleMatch) {
      metadata.artist = artistCircleMatch[1].trim()
      metadata.studio = artistCircleMatch[2].trim() // Circle in studio field
    } else {
      metadata.studio = circleText
    }
  }
  
  // Extract event name from (Event)
  const eventMatch = nameWithoutExt.match(/\(([^)]+?)\s*(?:C\d+|Comiket|COMIC1)?\)/)
  if (eventMatch) {
    const event = eventMatch[1].trim()
    // Common events: Comiket, COMIC1, etc.
    if (event && !event.match(/^\d{4}$/)) { // Not a year
      metadata.tags = [event]
    }
  }
  
  // Extract language [EN], [JP], [CH], etc.
  const langMatch = nameWithoutExt.match(/\[([A-Z]{2}(?:-[A-Z]{2})?)\]/i)
  if (langMatch) {
    const langCode = langMatch[1].toUpperCase()
    const langMap: Record<string, string> = {
      'EN': 'en',
      'JP': 'ja',
      'JA': 'ja',
      'CH': 'zh',
      'ZH': 'zh',
      'KR': 'ko',
      'KO': 'ko',
    }
    metadata.language = langMap[langCode] || langCode.toLowerCase()
  }
  
  // Extract tags from final brackets [tag1][tag2]
  const tagsMatch = nameWithoutExt.matchAll(/\[([^\]]+)\]/g)
  for (const match of tagsMatch) {
    const tag = match[1].trim()
    // Skip if it's circle, language, or looks like resolution
    if (!circleMatch || match.index !== circleMatch.index) {
      if (!langMatch || match.index !== langMatch.index) {
        if (!tag.match(/^\d+p$/i) && !tag.match(/^[A-Z]{2}$/i)) {
          metadata.tags!.push(tag)
        }
      }
    }
  }
  
  // Extract title (everything not in brackets/parentheses)
  let title = nameWithoutExt
    .replace(/^\[([^\]]+)\]/, '') // Remove circle
    .replace(/\([^)]+\)/g, '') // Remove events
    .replace(/\[([^\]]+)\]/g, '') // Remove tags
    .replace(/[_-]/g, ' ') // Replace separators
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
  
  if (title) {
    metadata.title = title
  }
  
  // Extract page count if present
  const pageMatch = nameWithoutExt.match(/(\d+)\s*(?:pages?|p)/i)
  if (pageMatch) {
    metadata.pageCount = parseInt(pageMatch[1])
  }
  
  return metadata
}

/**
 * Parse from gallery ID in filename
 * Example: "(123456) [Circle] Title.cbz"
 */
export function extractGalleryId(filename: string): number | null {
  const match = filename.match(/^\((\d{5,7})\)/)
  return match ? parseInt(match[1]) : null
}

/**
 * Note: Public APIs for adult content require careful consideration
 * This is a placeholder for future implementation
 */
export class DoujinshiMetadataSource implements MetadataSource {
  name = 'Doujinshi Database'
  priority = 1
  enabled = false // Disabled by default for privacy
  supportedTypes = ['doujinshi' as const]
  
  async fetch(media: Partial<Media>): Promise<Partial<Media> | null> {
    // Extract gallery ID if present in filename
    if (media.filePath) {
      const filename = media.filePath.split(/[/\\]/).pop() || ''
      const galleryId = extractGalleryId(filename)
      
      if (galleryId) {
        console.log('Found gallery ID:', galleryId)
        // API implementation would go here
        // Note: Requires user consent and proper API setup
      }
    }
    
    return null
  }
}
