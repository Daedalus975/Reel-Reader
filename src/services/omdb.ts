/**
 * OMDb API Service
 * 
 * To use:
 * 1. Get free API key at http://www.omdbapi.com/apikey.aspx
 * 2. Add to .env.local: VITE_OMDB_API_KEY=your_key
 */

// @ts-ignore - Vite env types
const API_KEY: string | undefined = import.meta.env.VITE_OMDB_API_KEY
const BASE_URL = 'https://www.omdbapi.com'

export interface OMDbResult {
  imdbID: string
  Title: string
  Year: string
  Type: 'movie' | 'series' | 'episode'
  Poster: string
  Plot: string
  imdbRating: string
  Runtime: string
  Director: string
  Genre: string
  Actors: string
}

export interface OMDbSearchResponse {
  Search: OMDbResult[]
  totalResults: string
  Response: string
  Error?: string
}

/**
 * Search OMDb for movies and TV shows
 */
export async function searchOMDb(query: string, type?: 'movie' | 'series'): Promise<OMDbResult[]> {
  if (!API_KEY) {
    console.warn('OMDb API key not configured. Add VITE_OMDB_API_KEY to .env.local')
    return []
  }

  try {
    const typeParam = type ? `&type=${type}` : ''
    const res = await fetch(
      `${BASE_URL}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}${typeParam}&page=1`,
    )
    const data: OMDbSearchResponse = await res.json()

    if (data.Response === 'True' && data.Search) {
      return data.Search
    }

    if (data.Error) {
      console.error('OMDb error:', data.Error)
    }

    return []
  } catch (error) {
    console.error('OMDb search error:', error)
    return []
  }
}

/**
 * Get full details for a single title by IMDb ID
 */
export async function getOMDbDetails(imdbId: string): Promise<OMDbResult | null> {
  if (!API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/?apikey=${API_KEY}&i=${imdbId}&type=full`)
    const data = await res.json()

    if (data.Response === 'True') {
      return data
    }

    return null
  } catch (error) {
    console.error('OMDb details error:', error)
    return null
  }
}

/**
 * Format poster URL (handle "N/A" response from OMDb)
 */
export function getPosterUrl(poster: string | undefined): string | undefined {
  if (!poster || poster === 'N/A') return undefined
  return poster
}

/**
 * Parse IMDb rating to 0-10 scale
 */
export function parseRating(ratingStr: string | undefined): number | undefined {
  if (!ratingStr || ratingStr === 'N/A') return undefined
  const rating = parseFloat(ratingStr)
  return isNaN(rating) ? undefined : rating
}

/**
 * Parse genre string to array
 */
export function parseGenres(genreStr: string | undefined): string[] {
  if (!genreStr || genreStr === 'N/A') return []
  return genreStr.split(',').map(g => g.trim()).filter(Boolean)
}

/**
 * Parse year from format "2010" or "2010-2015"
 */
export function parseYear(yearStr: string | undefined): number | undefined {
  if (!yearStr || yearStr === 'N/A') return undefined
  const year = parseInt(yearStr.split('-')[0], 10)
  return isNaN(year) ? undefined : year
}
