/**
 * TMDB Provider Implementation (Section 6 of METADATA_PROVIDERS_SPEC.md)
 * 
 * Adapter for The Movie Database API with movie/TV normalizers.
 */

import {
  MetadataProvider,
  Normalizer,
  ProviderContext,
  SearchQuery,
  SearchResult,
  NormalizationResult,
  ProviderError,
  AuthenticationError
} from '../core/provider'
import {
  MediaType,
  CanonicalMovie,
  CanonicalTVSeries,
  ImageAsset,
  PersonCredit
} from '../core/models'

const TMDB_API_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

interface TMDBSearchResult {
  id: number
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string
  overview?: string
  vote_average?: number
  media_type?: string
}

interface TMDBMovie {
  id: number
  title: string
  original_title: string
  tagline?: string
  overview?: string
  release_date?: string
  runtime?: number
  genres?: Array<{ id: number; name: string }>
  production_companies?: Array<{ id: number; name: string; logo_path?: string }>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  spoken_languages?: Array<{ iso_639_1: string; name: string }>
  poster_path?: string
  backdrop_path?: string
  budget?: number
  revenue?: number
  imdb_id?: string
  adult?: boolean
  credits?: {
    cast?: Array<{
      name: string
      character?: string
      order?: number
      profile_path?: string
    }>
    crew?: Array<{
      name: string
      job: string
      department: string
    }>
  }
}

interface TMDBTVSeries {
  id: number
  name: string
  original_name: string
  overview?: string
  first_air_date?: string
  last_air_date?: string
  number_of_seasons?: number
  number_of_episodes?: number
  genres?: Array<{ id: number; name: string }>
  networks?: Array<{ id: number; name: string; logo_path?: string }>
  production_companies?: Array<{ id: number; name: string }>
  spoken_languages?: Array<{ iso_639_1: string; name: string }>
  poster_path?: string
  backdrop_path?: string
  status?: string
  credits?: {
    cast?: Array<{ name: string; character?: string; order?: number }>
    crew?: Array<{ name: string; job: string }>
  }
}

export class TMDBProvider implements MetadataProvider {
  readonly id = 'tmdb'
  readonly name = 'The Movie Database'
  readonly supportedTypes: MediaType[] = ['movie', 'tv_series', 'tv_episode']

  async search(query: SearchQuery, context: ProviderContext): Promise<SearchResult[]> {
    const apiKey = context.config.apiKey
    if (!apiKey) {
      throw new AuthenticationError(this.id)
    }

    let endpoint: string
    let params: Record<string, string> = {
      api_key: apiKey,
      query: query.title,
      language: query.language ?? 'en-US'
    }

    if (query.year) {
      if (query.mediaType === 'movie') {
        params.primary_release_year = String(query.year)
      } else if (query.mediaType === 'tv_series') {
        params.first_air_date_year = String(query.year)
      }
    }

    switch (query.mediaType) {
      case 'movie':
        endpoint = '/search/movie'
        break
      case 'tv_series':
      case 'tv_episode':
        endpoint = '/search/tv'
        break
      default:
        throw new ProviderError(this.id, `Unsupported media type: ${query.mediaType}`)
    }

    const url = `${TMDB_API_BASE}${endpoint}?${new URLSearchParams(params)}`
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError(this.id)
      }
      throw new ProviderError(this.id, `TMDB API error: ${response.statusText}`)
    }

    const data = await response.json()
    const results: TMDBSearchResult[] = data.results ?? []

    return results.slice(0, 10).map(item => ({
      externalId: String(item.id),
      providerId: this.id,
      title: item.title ?? item.name ?? '',
      year: this.extractYear(item.release_date ?? item.first_air_date),
      thumbnail: item.poster_path
        ? `${TMDB_IMAGE_BASE}/w185${item.poster_path}`
        : undefined,
      description: item.overview,
      matchScore: this.calculateSearchScore(item),
      rawData: item
    }))
  }

  async fetchById(
    externalId: string,
    mediaType: MediaType,
    context: ProviderContext
  ): Promise<TMDBMovie | TMDBTVSeries> {
    const apiKey = context.config.apiKey
    if (!apiKey) {
      throw new AuthenticationError(this.id)
    }

    const endpoint =
      mediaType === 'movie'
        ? `/movie/${externalId}`
        : `/tv/${externalId}`

    const params = new URLSearchParams({
      api_key: apiKey,
      append_to_response: 'credits',
      language: 'en-US'
    })

    const url = `${TMDB_API_BASE}${endpoint}?${params}`
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError(this.id)
      }
      if (response.status === 404) {
        throw new ProviderError(this.id, 'Not found', undefined, false)
      }
      throw new ProviderError(this.id, `TMDB API error: ${response.statusText}`)
    }

    return response.json()
  }

  async testConnection(context: ProviderContext): Promise<boolean> {
    const apiKey = context.config.apiKey
    if (!apiKey) return false

    try {
      const url = `${TMDB_API_BASE}/configuration?api_key=${apiKey}`
      const response = await fetch(url)
      return response.ok
    } catch {
      return false
    }
  }

  private extractYear(dateStr?: string): number | undefined {
    if (!dateStr) return undefined
    const year = parseInt(dateStr.substring(0, 4))
    return isNaN(year) ? undefined : year
  }

  private calculateSearchScore(item: TMDBSearchResult): number {
    let score = 0.5 // base score

    // Higher vote average = higher score
    if (item.vote_average) {
      score += (item.vote_average / 10) * 0.3
    }

    // Has poster = bonus
    if (item.poster_path) {
      score += 0.1
    }

    // Has overview = bonus
    if (item.overview) {
      score += 0.1
    }

    return Math.min(score, 1.0)
  }
}

/**
 * Movie normalizer
 */
export class TMDBMovieNormalizer implements Normalizer<TMDBMovie> {
  readonly providerId = 'tmdb'
  readonly mediaType: MediaType = 'movie'

  validate(raw: TMDBMovie): boolean {
    return !!(raw.id && raw.title)
  }

  normalize(raw: TMDBMovie, context: ProviderContext): NormalizationResult {
    const warnings: string[] = []

    if (!raw.overview) warnings.push('Missing description')
    if (!raw.poster_path) warnings.push('Missing poster')
    if (!raw.release_date) warnings.push('Missing release date')

    const canonical: CanonicalMovie = {
      id: crypto.randomUUID(),
      mediaType: 'movie',
      title: raw.title,
      originalTitle: raw.original_title !== raw.title ? raw.original_title : undefined,
      description: raw.overview,
      releaseDate: raw.release_date,
      year: raw.release_date ? parseInt(raw.release_date.substring(0, 4)) : undefined,
      runtimeMinutes: raw.runtime,
      genres: raw.genres?.map(g => g.name),
      language: raw.spoken_languages?.[0]?.iso_639_1,
      studio: raw.production_companies?.[0]?.name,
      country: raw.production_countries?.[0]?.iso_3166_1,
      budget: raw.budget,
      boxOffice: raw.revenue,
      isAdult: raw.adult,
      images: this.normalizeImages(raw),
      people: this.normalizePeople(raw),
      externalRefs: [
        {
          providerId: this.providerId,
          externalId: String(raw.id),
          url: `https://www.themoviedb.org/movie/${raw.id}`,
          isPrimary: true
        }
      ],
      providerAttribution: ['TMDB']
    }

    // Add IMDB reference if available
    if (raw.imdb_id) {
      canonical.externalRefs.push({
        providerId: 'imdb',
        externalId: raw.imdb_id,
        url: `https://www.imdb.com/title/${raw.imdb_id}`
      })
    }

    const confidence = this.calculateConfidence(raw, warnings)

    return { canonical, warnings, confidence }
  }

  private normalizeImages(raw: TMDBMovie): ImageAsset[] {
    const images: ImageAsset[] = []

    if (raw.poster_path) {
      images.push({
        url: `${TMDB_IMAGE_BASE}/original${raw.poster_path}`,
        kind: 'poster',
        width: 2000,
        height: 3000
      })
    }

    if (raw.backdrop_path) {
      images.push({
        url: `${TMDB_IMAGE_BASE}/original${raw.backdrop_path}`,
        kind: 'backdrop',
        width: 1920,
        height: 1080
      })
    }

    return images
  }

  private normalizePeople(raw: TMDBMovie): PersonCredit[] {
    const people: PersonCredit[] = []

    // Cast
    if (raw.credits?.cast) {
      for (const actor of raw.credits.cast.slice(0, 10)) {
        people.push({
          name: actor.name,
          role: 'actor',
          characterName: actor.character,
          order: actor.order
        })
      }
    }

    // Director
    const director = raw.credits?.crew?.find(c => c.job === 'Director')
    if (director) {
      people.push({
        name: director.name,
        role: 'director'
      })
    }

    return people
  }

  private calculateConfidence(raw: TMDBMovie, warnings: string[]): number {
    let confidence = 0.9 // TMDB is very reliable

    // Deduct for missing critical fields
    if (!raw.overview) confidence -= 0.05
    if (!raw.poster_path) confidence -= 0.05
    if (!raw.release_date) confidence -= 0.1

    return Math.max(confidence, 0)
  }
}

/**
 * TV Series normalizer
 */
export class TMDBTVNormalizer implements Normalizer<TMDBTVSeries> {
  readonly providerId = 'tmdb'
  readonly mediaType: MediaType = 'tv_series'

  validate(raw: TMDBTVSeries): boolean {
    return !!(raw.id && raw.name)
  }

  normalize(raw: TMDBTVSeries, context: ProviderContext): NormalizationResult {
    const warnings: string[] = []

    if (!raw.overview) warnings.push('Missing description')
    if (!raw.poster_path) warnings.push('Missing poster')

    const canonical: CanonicalTVSeries = {
      id: crypto.randomUUID(),
      mediaType: 'tv_series',
      title: raw.name,
      originalTitle: raw.original_name !== raw.name ? raw.original_name : undefined,
      description: raw.overview,
      releaseDate: raw.first_air_date,
      year: raw.first_air_date ? parseInt(raw.first_air_date.substring(0, 4)) : undefined,
      genres: raw.genres?.map(g => g.name),
      language: raw.spoken_languages?.[0]?.iso_639_1,
      network: raw.networks?.[0]?.name,
      status: this.mapStatus(raw.status),
      numberOfSeasons: raw.number_of_seasons,
      numberOfEpisodes: raw.number_of_episodes,
      images: this.normalizeImages(raw),
      people: this.normalizePeople(raw),
      externalRefs: [
        {
          providerId: this.providerId,
          externalId: String(raw.id),
          url: `https://www.themoviedb.org/tv/${raw.id}`,
          isPrimary: true
        }
      ],
      providerAttribution: ['TMDB']
    }

    const confidence = this.calculateConfidence(raw, warnings)

    return { canonical, warnings, confidence }
  }

  private normalizeImages(raw: TMDBTVSeries): ImageAsset[] {
    const images: ImageAsset[] = []

    if (raw.poster_path) {
      images.push({
        url: `${TMDB_IMAGE_BASE}/original${raw.poster_path}`,
        kind: 'poster'
      })
    }

    if (raw.backdrop_path) {
      images.push({
        url: `${TMDB_IMAGE_BASE}/original${raw.backdrop_path}`,
        kind: 'backdrop'
      })
    }

    return images
  }

  private normalizePeople(raw: TMDBTVSeries): PersonCredit[] {
    const people: PersonCredit[] = []

    if (raw.credits?.cast) {
      for (const actor of raw.credits.cast.slice(0, 10)) {
        people.push({
          name: actor.name,
          role: 'actor',
          characterName: actor.character,
          order: actor.order
        })
      }
    }

    return people
  }

  private mapStatus(status?: string): 'returning' | 'ended' | 'canceled' | undefined {
    if (!status) return undefined
    const lower = status.toLowerCase()
    if (lower.includes('return')) return 'returning'
    if (lower.includes('end')) return 'ended'
    if (lower.includes('cancel')) return 'canceled'
    return undefined
  }

  private calculateConfidence(raw: TMDBTVSeries, warnings: string[]): number {
    let confidence = 0.9

    if (!raw.overview) confidence -= 0.05
    if (!raw.poster_path) confidence -= 0.05

    return Math.max(confidence, 0)
  }
}
