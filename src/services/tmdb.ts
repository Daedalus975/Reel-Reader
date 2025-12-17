/**
 * TMDB API Service with Mock Fallback
 * 
 * For development/testing without a TMDB API key, the service will use mock data.
 * For production with real data:
 * 1. Sign up free at https://www.themoviedb.org/settings/api
 * 2. Add to .env.local: VITE_TMDB_API_KEY=your_key
 */

// @ts-ignore - Vite env types
const API_KEY: string | undefined = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

// Mock data for development/testing
const MOCK_RESULTS: Record<string, TMDBSearchResult[]> = {
  'inception': [
    {
      id: 27205,
      title: 'Inception',
      poster_path: '/9gk7adHYeDMNNGmelZ9hKYODO4D.jpg',
      backdrop_path: '/s3TBrRGB1iC7II9duо4OkLsTrG.jpg',
      overview:
        'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible.',
      release_date: '2010-07-16',
      vote_average: 8.4,
      genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }],
    },
  ],
  'the expanse': [
    {
      id: 63639,
      name: 'The Expanse',
      poster_path: '/xrVo2xJlqcNK83X9wWzPPv5Zlpr.jpg',
      backdrop_path: '/z0T7AGtkvEDdRPTsrT3lXKLMH5d.jpg',
      overview:
        'In the 23rd century, mankind has colonized the solar system. When a missing woman investigation coincides with a rogue ship and a distance probe, it opens up a vast conspiracy.',
      first_air_date: '2015-12-14',
      vote_average: 8.4,
      genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 18, name: 'Drama' }],
    },
  ],
  'dune': [
    {
      id: 438631,
      title: 'Dune',
      poster_path: '/74xPMyUnvWEKCLmT33sSrTH2dQl.jpg',
      backdrop_path: '/z8Ub2eI2 GZjygetMyMVDFl2D5J.jpg',
      overview:
        'Paul Atreides, a brilliant young man, must travel to the dangerous planet Dune to ensure the future of his family and people.',
      release_date: '2021-10-22',
      vote_average: 7.9,
      genres: [{ id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }],
    },
  ],
}

export interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  vote_average: number
  genres?: Array<{ id: number; name: string }>
}

export interface TMDBShow {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  first_air_date: string
  vote_average: number
  genres?: Array<{ id: number; name: string }>
}

export type TMDBSearchResult = TMDBMovie | TMDBShow

/**
 * Search for movies and TV shows
 */
export async function searchTMDB(query: string, type: 'movie' | 'tv' | 'both' = 'both'): Promise<TMDBSearchResult[]> {
  // Use mock data if no API key is configured (development mode)
  if (!API_KEY) {
    console.info('Using mock TMDB data (no API key configured). See TMDB_SETUP.md for real API setup.')
    const mockKey = query.toLowerCase()
    if (MOCK_RESULTS[mockKey]) {
      return MOCK_RESULTS[mockKey]
    }
    // Return empty array if no mock matches (real API would search)
    return []
  }

  try {
    const results: TMDBSearchResult[] = []

    if (type === 'movie' || type === 'both') {
      const movieRes = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`,
      )
      const movieData = await movieRes.json()
      results.push(...(movieData.results || []))
    }

    if (type === 'tv' || type === 'both') {
      const tvRes = await fetch(
        `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`,
      )
      const tvData = await tvRes.json()
      results.push(...(tvData.results || []))
    }

    return results.sort((a, b) => {
      const ratingA = ('vote_average' in a ? a.vote_average : 0) || 0
      const ratingB = ('vote_average' in b ? b.vote_average : 0) || 0
      return ratingB - ratingA
    })
  } catch (error) {
    console.error('TMDB search error:', error)
    return []
  }
}

/**
 * Get full details for a movie
 */
export async function getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
  if (!API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to fetch movie details:', error)
    return null
  }
}

/**
 * Get full details for a TV show
 */
export async function getShowDetails(showId: number): Promise<TMDBShow | null> {
  if (!API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/tv/${showId}?api_key=${API_KEY}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to fetch show details:', error)
    return null
  }
}

/**
 * Format poster URL
 */
export function getPosterUrl(posterPath: string | null | undefined): string | undefined {
  if (!posterPath) return undefined
  return `${IMAGE_BASE_URL}${posterPath}`
}

/**
 * Format backdrop URL
 */
export function getBackdropUrl(backdropPath: string | null | undefined): string | undefined {
  if (!backdropPath) return undefined
  return `${IMAGE_BASE_URL}${backdropPath}`
}

/**
 * Check if result is a movie
 */
export function isMovie(result: TMDBSearchResult): result is TMDBMovie {
  return 'title' in result
}

/**
 * Check if result is a TV show
 */
export function isShow(result: TMDBSearchResult): result is TMDBShow {
  return 'name' in result
}
/**
 * Get YouTube trailer URL for a movie
 */
export async function getMovieTrailer(movieId: number): Promise<string | null> {
  if (!API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`)
    const data = await res.json()
    const videos = data.results || []
    // Find official trailer, prefer YouTube
    const trailer = videos.find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube' && v.official,
    ) || videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
    
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
  } catch (error) {
    console.error('Failed to fetch movie trailer:', error)
    return null
  }
}

/**
 * Get YouTube trailer URL for a TV show
 */
export async function getShowTrailer(showId: number): Promise<string | null> {
  if (!API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/tv/${showId}/videos?api_key=${API_KEY}`)
    const data = await res.json()
    const videos = data.results || []
    const trailer = videos.find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube' && v.official,
    ) || videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
    
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
  } catch (error) {
    console.error('Failed to fetch show trailer:', error)
    return null
  }
}