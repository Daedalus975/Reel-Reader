/**
 * JAV metadata sources
 * Supports: R18.com scraping and JAVLibrary
 */

import type { Media } from '@/types'
import type { MetadataSource } from './metadataService'

/**
 * R18 (DMM) - Official JAV distributor
 * Note: Requires web scraping as they don't have a public API
 */
export class R18MetadataSource implements MetadataSource {
  name = 'R18'
  priority = 1
  enabled = true
  supportedTypes = ['jav' as const]
  
  async fetch(media: Partial<Media>): Promise<Partial<Media> | null> {
    if (!media.productCode && !media.title) return null
    
    try {
      // Search by product code (more reliable)
      const searchQuery = media.productCode || media.title
      const searchUrl = `https://www.r18.com/common/search/searchword=${encodeURIComponent(searchQuery!)}/`
      
      // Note: This requires CORS proxy or backend implementation
      // For now, return null - will need backend service
      console.log('R18 fetch requires backend proxy:', searchUrl)
      return null
    } catch (error) {
      console.error('R18 fetch failed:', error)
      return null
    }
  }
}

/**
 * JAVLibrary - Community database
 * Note: Requires web scraping
 */
export class JAVLibraryMetadataSource implements MetadataSource {
  name = 'JAVLibrary'
  priority = 2
  enabled = true
  supportedTypes = ['jav' as const]
  
  async fetch(media: Partial<Media>): Promise<Partial<Media> | null> {
    if (!media.productCode && !media.title) return null
    
    try {
      // Search by product code
      const searchQuery = media.productCode || media.title
      const searchUrl = `https://www.javlibrary.com/en/vl_searchbyid.php?keyword=${encodeURIComponent(searchQuery!)}`
      
      // Note: This requires CORS proxy or backend implementation
      console.log('JAVLibrary fetch requires backend proxy:', searchUrl)
      return null
    } catch (error) {
      console.error('JAVLibrary fetch failed:', error)
      return null
    }
  }
}

/**
 * Fallback: Parse from product code pattern
 * JAV codes follow patterns like: STUDIO-NUMBER
 * Examples: IPX-123, SSIS-456, MIDE-789
 */
export class JAVCodeParser {
  private static studioNames: Record<string, string> = {
    'IPX': 'IdeaPocket',
    'SSIS': 'S1 NO.1 STYLE',
    'MIDE': 'MOODYZ',
    'SSNI': 'S1 NO.1 STYLE',
    'STARS': 'SOD Create',
    'FSDSS': 'Faleno',
    'CAWD': 'kawaii',
    'MIDV': 'MOODYZ',
    'SONE': 'S-ONE',
  }
  
  static parseProductCode(code: string): Partial<Media> {
    const match = code.match(/([A-Z]{2,5})-(\d{3,5})/i)
    if (!match) return {}
    
    const [fullCode, studio, number] = match
    const metadata: Partial<Media> = {
      productCode: fullCode.toUpperCase(),
      series: studio.toUpperCase(),
    }
    
    // Try to get studio name
    const studioName = this.studioNames[studio.toUpperCase()]
    if (studioName) {
      metadata.studio = studioName
    }
    
    return metadata
  }
}

/**
 * Enhanced JAV filename parser
 * Examples:
 *   "IPX-123 Actress Name.mp4"
 *   "[Studio] SSIS-456 Title Here (1080p).mkv"
 */
export function parseJAVFilename(filename: string): Partial<Media> {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  const metadata: Partial<Media> = {}
  
  // Extract product code
  const codeMatch = nameWithoutExt.match(/([A-Z]{2,5})-(\d{3,5})/i)
  if (codeMatch) {
    const codeData = JAVCodeParser.parseProductCode(codeMatch[0])
    Object.assign(metadata, codeData)
    
    // Try to extract actress name (usually comes after code)
    const afterCode = nameWithoutExt.split(codeMatch[0])[1]
    if (afterCode) {
      const actressMatch = afterCode.match(/^\s*([^\(\[]+)/)
      if (actressMatch) {
        const actress = actressMatch[1].trim()
        if (actress && actress.length < 50) { // Sanity check
          metadata.cast = [actress]
        }
      }
    }
  }
  
  // Extract studio from brackets
  const studioMatch = nameWithoutExt.match(/^\[([^\]]+)\]/)
  if (studioMatch) {
    metadata.studio = studioMatch[1]
  }
  
  // Extract resolution/quality
  const qualityMatch = nameWithoutExt.match(/(4K|2160p|1080p|720p|480p)/i)
  if (qualityMatch) {
    metadata.quality = qualityMatch[1].toUpperCase()
  }
  
  return metadata
}
