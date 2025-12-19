/**
 * Cache & Storage Layer (Section 7 of METADATA_PROVIDERS_SPEC.md)
 * 
 * SQLite-backed cache for provider responses and canonical entities.
 * Uses Tauri SQL plugin or sql.js for persistence.
 */

import { CanonicalMedia, ExternalRef } from './models'

/**
 * Provider response cache entry
 */
export interface CacheEntry {
  cacheKey: string          // hash of query or "providerId:externalId"
  providerId: string
  mediaType: string
  response: any             // JSON payload from provider
  fetchedAt: string         // ISO timestamp
  expiresAt: string         // ISO timestamp
  requestHash: string       // for deduplication
}

/**
 * User override for locked fields
 */
export interface UserOverride {
  mediaId: string           // canonical media ID
  fieldPath: string         // e.g., "title", "images[0].url"
  overrideValue: any        // user's value (JSON)
  overrideAt: string        // ISO timestamp
  reason?: string           // optional user note
}

/**
 * Artwork override (separate table for easier queries)
 */
export interface ArtworkOverride {
  mediaId: string
  imageKind: 'poster' | 'backdrop' | 'cover' | 'thumbnail' | 'logo'
  url: string
  width?: number
  height?: number
  lockedAt: string
}

/**
 * Background refresh job
 */
export interface RefreshJob {
  jobId: string             // UUID
  mediaId: string
  providerId: string
  priority: 'high' | 'normal' | 'low'
  status: 'pending' | 'running' | 'completed' | 'failed'
  attempts: number
  maxAttempts: number
  scheduledAt: string
  startedAt?: string
  completedAt?: string
  error?: string
  nextRetryAt?: string
}

/**
 * Cache service interface - implementation can use SQLite or in-memory
 */
export interface CacheService {
  // Provider cache
  getCached(cacheKey: string): Promise<CacheEntry | null>
  setCached(entry: CacheEntry): Promise<void>
  invalidate(cacheKey: string): Promise<void>
  invalidateProvider(providerId: string): Promise<void>
  cleanExpired(): Promise<number> // returns count of deleted entries

  // Canonical media store
  getCanonicalById(mediaId: string): Promise<CanonicalMedia | null>
  saveCanonical(media: CanonicalMedia): Promise<void>
  deleteCanonical(mediaId: string): Promise<void>
  findByExternalRef(ref: ExternalRef): Promise<CanonicalMedia | null>

  // External refs
  getExternalRefs(mediaId: string): Promise<ExternalRef[]>
  addExternalRef(mediaId: string, ref: ExternalRef): Promise<void>
  removeExternalRef(mediaId: string, providerId: string): Promise<void>

  // User overrides
  getOverrides(mediaId: string): Promise<UserOverride[]>
  setOverride(override: UserOverride): Promise<void>
  removeOverride(mediaId: string, fieldPath: string): Promise<void>
  isFieldLocked(mediaId: string, fieldPath: string): Promise<boolean>

  // Artwork overrides
  getArtworkOverrides(mediaId: string): Promise<ArtworkOverride[]>
  setArtworkOverride(override: ArtworkOverride): Promise<void>
  removeArtworkOverride(mediaId: string, imageKind: string): Promise<void>

  // Refresh jobs
  enqueueRefresh(job: Omit<RefreshJob, 'jobId' | 'status' | 'attempts'>): Promise<string>
  getNextJob(): Promise<RefreshJob | null>
  updateJobStatus(jobId: string, update: Partial<RefreshJob>): Promise<void>
  deleteJob(jobId: string): Promise<void>
  getJobsByMediaId(mediaId: string): Promise<RefreshJob[]>
}

/**
 * Cache key builder
 */
export class CacheKeyBuilder {
  static forSearch(providerId: string, query: {
    title: string
    year?: number
    mediaType: string
    [key: string]: any
  }): string {
    const normalized = {
      providerId,
      title: query.title.toLowerCase().trim(),
      year: query.year,
      type: query.mediaType
    }
    return `search:${this.hashObject(normalized)}`
  }

  static forFetchById(providerId: string, externalId: string, mediaType: string): string {
    return `fetch:${providerId}:${mediaType}:${externalId}`
  }

  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0 // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
}

/**
 * TTL (time-to-live) configuration for cache entries
 */
export const CACHE_TTL = {
  SEARCH_RESULTS: 24 * 60 * 60 * 1000,      // 24 hours
  FULL_METADATA: 7 * 24 * 60 * 60 * 1000,   // 7 days
  CANONICAL_MEDIA: 30 * 24 * 60 * 60 * 1000 // 30 days
}

/**
 * Helper to check if cache entry is expired
 */
export function isCacheExpired(entry: CacheEntry): boolean {
  return new Date(entry.expiresAt).getTime() < Date.now()
}
