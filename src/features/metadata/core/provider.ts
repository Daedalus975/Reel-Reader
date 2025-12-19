/**
 * Provider Interfaces (Section 4 of METADATA_PROVIDERS_SPEC.md)
 * 
 * Adapter pattern for metadata sources with normalization pipeline.
 */

import { MediaType, CanonicalMedia } from './models'

export interface ProviderConfig {
  id: string                // unique provider identifier
  name: string              // display name
  supportedTypes: MediaType[]
  requiresApiKey: boolean
  apiKey?: string           // stored encrypted in settings
  enabled: boolean
  rateLimitPerMinute?: number
  priority?: number         // for fallback ordering (lower = higher priority)
  
  // Adult content policy
  isAdultProvider?: boolean // provider primarily for adult content
  requiresAdultMode?: boolean // requires profile.adultContentEnabled
  requiresVaultUnlock?: boolean // requires vault to be unlocked
}

export interface SearchQuery {
  title: string
  year?: number
  language?: string
  mediaType: MediaType
  
  // Type-specific hints
  episodeNumber?: number
  seasonNumber?: number
  artist?: string
  albumTitle?: string
  isbn?: string
  galleryId?: string
  productCode?: string      // JAV product code (e.g., IPX-123)
}

export interface SearchResult {
  externalId: string
  providerId: string
  title: string
  year?: number
  thumbnail?: string
  description?: string
  matchScore?: number       // provider's internal scoring (0-1)
  rawData?: any             // provider-specific payload (for caching)
}

export interface ProviderContext {
  profile: {
    id: string
    adultContentEnabled: boolean // Only true for profiles with type === 'adult'
    vaultUnlocked: boolean
  }
  librarySettings: {
    autoFetchMetadata: boolean
    parseFilenames: boolean
    scanForNfo: boolean
    fetchAdultMetadata: boolean // Only shown in Adult profiles
  }
  config: ProviderConfig
}

/**
 * Normalization result with warnings for low-confidence data
 */
export interface NormalizationResult {
  canonical: CanonicalMedia
  warnings: string[]        // e.g., "Missing release date", "Poster unavailable"
  confidence: number        // 0-1 score based on completeness
}

/**
 * Core provider interface - all providers must implement this
 */
export interface MetadataProvider {
  readonly id: string
  readonly name: string
  readonly supportedTypes: MediaType[]

  /**
   * Search for candidates based on query
   */
  search(query: SearchQuery, context: ProviderContext): Promise<SearchResult[]>

  /**
   * Fetch detailed metadata by external ID
   */
  fetchById(externalId: string, mediaType: MediaType, context: ProviderContext): Promise<any>

  /**
   * Test if provider is available (API key valid, service reachable)
   */
  testConnection(context: ProviderContext): Promise<boolean>
}

/**
 * Normalizer transforms provider-specific payloads into canonical models
 */
export interface Normalizer<TRaw = any> {
  readonly providerId: string
  readonly mediaType: MediaType

  /**
   * Convert raw provider payload to canonical model
   */
  normalize(raw: TRaw, context: ProviderContext): NormalizationResult

  /**
   * Validate that raw data has minimum required fields
   */
  validate(raw: TRaw): boolean
}

/**
 * Enrichment providers add extra data (reviews, ratings, recommendations)
 */
export interface EnrichmentProvider {
  readonly id: string
  readonly name: string

  /**
   * Enrich existing canonical entity with additional data
   */
  enrich(canonical: CanonicalMedia, context: ProviderContext): Promise<Partial<CanonicalMedia>>
}

/**
 * Rate limiting with token bucket algorithm
 */
export interface RateLimiter {
  /**
   * Check if request can proceed, waits if necessary
   */
  throttle(providerId: string): Promise<void>

  /**
   * Reset rate limit for provider (e.g., after quota reset)
   */
  reset(providerId: string): void
}

/**
 * Backoff strategy for failed requests
 */
export interface BackoffStrategy {
  /**
   * Calculate delay before retry (exponential backoff)
   */
  getDelay(attempt: number): number

  /**
   * Max attempts before giving up
   */
  maxAttempts: number
}

/**
 * Provider errors with proper typing
 */
export class ProviderError extends Error {
  constructor(
    public providerId: string,
    message: string,
    public cause?: Error,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

export class RateLimitError extends ProviderError {
  constructor(
    providerId: string,
    public retryAfter?: number // seconds to wait
  ) {
    super(providerId, 'Rate limit exceeded', undefined, true)
    this.name = 'RateLimitError'
  }
}

export class AuthenticationError extends ProviderError {
  constructor(providerId: string) {
    super(providerId, 'API key invalid or missing', undefined, false)
    this.name = 'AuthenticationError'
  }
}
