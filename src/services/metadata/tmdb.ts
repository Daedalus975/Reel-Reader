/**
 * TMDB (The Movie Database) API integration
 * Supports: Movies, TV Shows
 * Free tier: 1000 requests/day
 * Signup: https://www.themoviedb.org/settings/api
 */

import type { Media } from '@/types'
import type { MetadataSource } from './metadataService'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

interface TMDBSearchResult {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  genre_ids: number[]
}

interface TMDBDetails {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  runtime?: number
  episode_run_time?: number[]
  genres: Array<{ id: number; name: string }>
  production_companies: Array<{ name: string }>
  spoken_languages: Array<{ iso_639_1: string; name: string }>
  credits?: {
    cast: Array<{ name: string; character: string }>
    crew: Array<{ name: string; job: string }>
  }
}

export class TMDBMetadataSource implements MetadataSource {
  name = 'TMDB'
  priority = 1
  enabled = false
  supportedTypes = ['movie' as const, 'tv' as const]
  
  private apiKey: string = ''
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey
      this.enabled = true
    }
  }
  
  async fetch(media: Partial<Media>): Promise<Partial<Media> | null> {
    if (!this.apiKey || !media.title) return null
    
    try {
      const mediaType = media.type === 'tv' ? 'tv' : 'movie'
      
      // Search for the media
      const searchUrl = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${this.apiKey}&query=${encodeURIComponent(media.title)}`
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (!searchData.results?.length) return null
      
      // Get the first result (best match)
      const result: TMDBSearchResult = searchData.results[0]
      
      // Fetch detailed information
      const detailsUrl = `${TMDB_BASE_URL}/${mediaType}/${result.id}?api_key=${this.apiKey}&append_to_response=credits`
      const detailsResponse = await fetch(detailsUrl)
      const details: TMDBDetails = await detailsResponse.json()
      
      return this.mapToMedia(details, mediaType)
    } catch (error) {
      console.error('TMDB fetch failed:', error)
      return null
    }
  }
  
  private mapToMedia(details: TMDBDetails, mediaType: 'movie' | 'tv'): Partial<Media> {
    const metadata: Partial<Media> = {
      title: details.title || details.name,
      description: details.overview,
      releaseDate: details.release_date || details.first_air_date,
      rating: details.vote_average,
      genres: details.genres.map(g => g.name),
      studio: details.production_companies[0]?.name,
      language: details.spoken_languages[0]?.iso_639_1,
    }
    
    if (details.poster_path) {
      metadata.posterUrl = `${TMDB_IMAGE_BASE}/w500${details.poster_path}`
    }
    
    if (details.backdrop_path) {
      metadata.backdropUrl = `${TMDB_IMAGE_BASE}/original${details.backdrop_path}`
    }
    
    if (mediaType === 'movie' && details.runtime) {
      metadata.runtime = details.runtime
    }
    
    if (mediaType === 'tv' && details.episode_run_time?.length) {
      metadata.runtime = details.episode_run_time[0]
    }
    
    // Cast
    if (details.credits?.cast) {
      metadata.cast = details.credits.cast.slice(0, 10).map(c => c.name)
    }
    
    // Director
    if (details.credits?.crew) {
      const director = details.credits.crew.find(c => c.job === 'Director')
      if (director) metadata.director = director.name
    }
    
    return metadata
  }
}
