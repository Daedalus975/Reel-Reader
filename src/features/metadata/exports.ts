/**
 * Metadata System - Public API Exports
 * 
 * Central export point for all metadata functionality.
 */

// Core models and types
export * from './core/models'
export * from './core/provider'
export * from './core/matching'
export * from './core/cache'

// Main service (singleton)
export { metadataService, MetadataService } from './index'

// Integration helpers
export {
  buildProviderContext,
  scanWithMetadata,
  enhanceMediaWithMetadata,
  batchFetchMetadata,
  needsMetadataRefresh,
  canFetchAdultMetadata
} from './integration'

// Provider registry (for advanced usage)
export { ProviderRegistry } from './core/registry'

// Rate limiter (for custom providers)
export { RateLimiterService, ExponentialBackoff } from './core/rate-limiter'

// Storage (for custom implementations)
export { SQLiteCacheService } from './storage/sqlite-cache'

// Background jobs (for monitoring)
export { JobProcessor, JobScheduler } from './jobs/processor'
export type { JobType, JobProgress, JobScheduleOptions } from './jobs/processor'

// TMDB provider (reference implementation)
export { TMDBProvider, TMDBMovieNormalizer, TMDBTVNormalizer } from './providers/tmdb-provider'
