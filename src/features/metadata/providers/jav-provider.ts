/**
 * JAV Metadata Provider
 * 
 * Supports JAVLibrary (scraping) and R18/DMM (unofficial API)
 */

import {
  MetadataProvider,
  Normalizer,
  ProviderContext,
  SearchQuery,
  SearchResult,
  NormalizationResult
} from '../core/provider'
import { CanonicalMedia, MediaType } from '../core/models'

// Raw JAV result from providers
export interface JAVRaw {
  id: string
  title: string
  poster?: string
  releaseDate?: string
  genres: string[]
  studio?: string
  actors: string[]
  description?: string
  productCode?: string
  source: 'javlibrary' | 'r18'
}

/**
 * JAVLibrary Provider (web scraping)
 */
export class JAVLibraryProvider implements MetadataProvider {
  readonly id = 'javlibrary'
  readonly name = 'JAVLibrary'
  readonly supportedTypes: MediaType[] = ['jav']

  async search(query: SearchQuery, context: ProviderContext): Promise<SearchResult[]> {
    if (!query.title) return []

    try {
      const url = `https://www.javlibrary.com/en/vl_searchbyid.php?list&keyword=${encodeURIComponent(query.title)}`
      const res = await fetch(url, { 
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
        signal: AbortSignal.timeout(10000)
      })
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()

      const results: SearchResult[] = []
      const itemRegex = /<div class="video">([\s\S]*?)<\/div>\s*<\/div>/g
      let match: RegExpExecArray | null

      while ((match = itemRegex.exec(html)) !== null) {
        const block = match[1]
        const titleMatch = block.match(/title="([^"]+)"/)
        const imgMatch = block.match(/src="([^"]+)"/)
        const idMatch = block.match(/\?v=(\w+)/)
        const codeMatch = block.match(/([A-Z]{2,5})-?(\d{3,5})/i)

        if (titleMatch && idMatch) {
          results.push({
            externalId: idMatch[1],
            title: titleMatch[1],
            year: undefined,
            posterUrl: imgMatch?.[1],
            matchScore: this.calculateMatchScore(titleMatch[1], query.title)
          })
        }
      }

      return results
    } catch (error) {
      console.error('[JAVLibrary] Search failed:', error)
      return []
    }
  }

  async fetchById(externalId: string, mediaType: MediaType, context: ProviderContext): Promise<JAVRaw | null> {
    try {
      const url = `https://www.javlibrary.com/en/?v=${externalId}`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()

      // Parse title
      const titleMatch = html.match(/<title>([^-]+)-/i)
      const title = titleMatch?.[1]?.trim() || 'Unknown'

      // Parse poster
      const posterMatch = html.match(/<img[^>]+id="video_jacket_img"[^>]+src="([^"]+)"/i)
      const poster = posterMatch?.[1]

      // Parse product code
      const codeMatch = html.match(/<div[^>]+id="video_id"[^>]*>([^<]+)<\/div>/i)
      const productCode = codeMatch?.[1]?.trim()

      // Parse release date
      const dateMatch = html.match(/<div[^>]+id="video_date"[^>]*>([^<]+)<\/div>/i)
      const releaseDate = dateMatch?.[1]?.trim()

      // Parse genres
      const genres: string[] = []
      const genreRegex = /<a[^>]+rel="category tag"[^>]*>([^<]+)<\/a>/gi
      let genreMatch: RegExpExecArray | null
      while ((genreMatch = genreRegex.exec(html)) !== null) {
        genres.push(genreMatch[1].trim())
      }

      // Parse studio
      const studioMatch = html.match(/<a[^>]+rel="tag"[^>]*>([^<]+)<\/a>/i)
      const studio = studioMatch?.[1]?.trim()

      // Parse actors
      const actors: string[] = []
      const actorRegex = /<a[^>]+class="[^"]*cast[^"]*"[^>]*>([^<]+)<\/a>/gi
      let actorMatch: RegExpExecArray | null
      while ((actorMatch = actorRegex.exec(html)) !== null) {
        actors.push(actorMatch[1].trim())
      }

      return {
        id: externalId,
        title,
        poster,
        releaseDate,
        genres,
        studio,
        actors,
        productCode,
        source: 'javlibrary'
      }
    } catch (error) {
      console.error('[JAVLibrary] Fetch failed:', error)
      return null
    }
  }

  async testConnection(context: ProviderContext): Promise<boolean> {
    try {
      const res = await fetch('https://www.javlibrary.com/en/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      return res.ok
    } catch {
      return false
    }
  }

  private calculateMatchScore(resultTitle: string, queryTitle: string): number {
    const result = resultTitle.toLowerCase()
    const query = queryTitle.toLowerCase()
    
    if (result === query) return 1.0
    if (result.includes(query)) return 0.8
    if (query.includes(result)) return 0.7
    
    // Check for product code match
    const codeMatch = result.match(/([A-Z]{2,5})-?(\d{3,5})/i)
    const queryCodeMatch = query.match(/([A-Z]{2,5})-?(\d{3,5})/i)
    if (codeMatch && queryCodeMatch && codeMatch[0].toLowerCase() === queryCodeMatch[0].toLowerCase()) {
      return 0.95
    }
    
    return 0.5
  }
}

/**
 * R18 Provider (unofficial API)
 */
export class R18Provider implements MetadataProvider {
  readonly id = 'r18'
  readonly name = 'R18 / DMM'
  readonly supportedTypes: MediaType[] = ['jav']
  
  private readonly apiBase = 'https://r18.dev'

  async search(query: SearchQuery, context: ProviderContext): Promise<SearchResult[]> {
    if (!query.title) return []

    // Requires API key from context
    if (!context.config.apiKey) {
      console.warn('[R18] API key required')
      return []
    }

    try {
      const url = `${this.apiBase}/api/search?keyword=${encodeURIComponent(query.title)}&hits=20`
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${context.config.apiKey}` },
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      
      const items = data?.items || data?.result || []
      return items.map((item: any) => ({
        externalId: item.id || item.content_id || item.code,
        title: item.title || item.name || 'Unknown',
        year: item.release_date ? parseInt(item.release_date.substring(0, 4)) : undefined,
        posterUrl: item.image_url || item.cover || item.thumb,
        matchScore: this.calculateMatchScore(item.title || '', query.title)
      }))
    } catch (error) {
      console.error('[R18] Search failed:', error)
      return []
    }
  }

  async fetchById(externalId: string, mediaType: MediaType, context: ProviderContext): Promise<JAVRaw | null> {
    if (!context.config.apiKey) return null

    try {
      const url = `${this.apiBase}/api/detail/${externalId}`
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${context.config.apiKey}` },
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const item = await res.json()

      return {
        id: item.id || item.content_id,
        title: item.title || item.name,
        poster: item.image_url || item.cover,
        releaseDate: item.release_date || item.date,
        genres: (item.genres || item.genre || []).map((g: any) => g.name || g),
        studio: item.maker || item.studio,
        actors: (item.actresses || item.actress || []).map((a: any) => a.name || a),
        description: item.description || item.comment,
        productCode: item.code || item.dmm?.id,
        source: 'r18'
      }
    } catch (error) {
      console.error('[R18] Fetch failed:', error)
      return null
    }
  }

  async testConnection(context: ProviderContext): Promise<boolean> {
    if (!context.config.apiKey) return false

    try {
      const res = await fetch(`${this.apiBase}/api/health`, {
        headers: { 'Authorization': `Bearer ${context.config.apiKey}` },
        signal: AbortSignal.timeout(5000)
      })
      return res.ok
    } catch {
      return false
    }
  }

  private calculateMatchScore(resultTitle: string, queryTitle: string): number {
    const result = resultTitle.toLowerCase()
    const query = queryTitle.toLowerCase()
    
    if (result === query) return 1.0
    if (result.includes(query)) return 0.85
    
    const codeMatch = result.match(/([A-Z]{2,5})-?(\d{3,5})/i)
    const queryCodeMatch = query.match(/([A-Z]{2,5})-?(\d{3,5})/i)
    if (codeMatch && queryCodeMatch && codeMatch[0].toLowerCase() === queryCodeMatch[0].toLowerCase()) {
      return 0.95
    }
    
    return 0.5
  }
}

/**
 * JAV Normalizer
 */
export class JAVNormalizer implements Normalizer<JAVRaw> {
  readonly providerId: string
  readonly mediaType: MediaType = 'jav'

  constructor(providerId: string) {
    this.providerId = providerId
  }

  validate(raw: JAVRaw): boolean {
    return !!(raw.id && raw.title)
  }

  normalize(raw: JAVRaw, context: ProviderContext): NormalizationResult {
    const warnings: string[] = []
    
    if (!raw.poster) warnings.push('No poster available')
    if (!raw.releaseDate) warnings.push('Release date missing')
    if (raw.genres.length === 0) warnings.push('No genres provided')
    if (raw.actors.length === 0) warnings.push('No actors listed')

    const year = raw.releaseDate ? parseInt(raw.releaseDate.substring(0, 4)) : undefined

    const canonical: CanonicalMedia = {
      id: `jav-${raw.id}`,
      mediaType: 'jav',
      title: raw.title,
      altTitles: raw.productCode ? [raw.productCode] : [],
      originalTitle: raw.title,
      description: raw.description,
      language: 'ja',
      genres: raw.genres,
      releaseDate: raw.releaseDate,
      year,
      images: raw.poster ? [{ url: raw.poster, width: 800, height: 1200, language: 'ja', isUserOverride: false }] : [],
      people: [
        ...(raw.studio ? [{ name: raw.studio, role: 'publisher' as const, order: 0 }] : []),
        ...raw.actors.map((name, index) => ({
          name,
          role: 'actor' as const,
          order: index + 1
        }))
      ],
      externalRefs: [{
        providerId: this.providerId,
        externalId: raw.id,
        isPrimary: true
      }],
      providerAttribution: [this.providerId],
      isAdult: true,
      productCode: raw.productCode,
      studio: raw.studio,
      explicit: true,
      matchConfidence: this.calculateConfidence(raw, warnings),
      matchMethod: 'auto'
    }

    const confidence = this.calculateConfidence(raw, warnings)

    return { canonical, warnings, confidence }
  }

  private calculateConfidence(raw: JAVRaw, warnings: string[]): number {
    let score = 0.5 // Base score
    
    if (raw.poster) score += 0.15
    if (raw.releaseDate) score += 0.1
    if (raw.genres.length > 0) score += 0.1
    if (raw.actors.length > 0) score += 0.1
    if (raw.description) score += 0.05
    
    // Penalty for warnings
    score -= warnings.length * 0.02
    
    return Math.max(0, Math.min(1, score))
  }
}
