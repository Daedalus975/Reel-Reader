/**
 * Main Metadata Service Facade
 * 
 * Central entry point for all metadata operations.
 * Integrates with existing stores and provides high-level API.
 */

import { ProviderRegistry, FetchResult } from './core/registry'
import { SQLiteCacheService } from './storage/sqlite-cache'
import { RateLimiterService } from './core/rate-limiter'
import { MatchingService } from './core/matching'
import { JobProcessor, JobScheduler } from './jobs/processor'
import { TMDBProvider, TMDBMovieNormalizer, TMDBTVNormalizer } from './providers/tmdb-provider'
import { JAVLibraryProvider, R18Provider, JAVNormalizer } from './providers/jav-provider'
import { ProviderContext, SearchQuery, ProviderConfig } from './core/provider'
import { CanonicalMedia, MediaType } from './core/models'

/**
 * Metadata service singleton
 */
export class MetadataService {
  private static instance: MetadataService | null = null

  private registry: ProviderRegistry
  private cacheService: SQLiteCacheService
  private rateLimiter: RateLimiterService
  private matcher: MatchingService
  private jobProcessor: JobProcessor
  private jobScheduler: JobScheduler
  private initialized = false

  private constructor() {
    this.cacheService = new SQLiteCacheService()
    this.rateLimiter = new RateLimiterService()
    this.matcher = new MatchingService()
    this.registry = new ProviderRegistry(
      this.cacheService,
      this.rateLimiter,
      this.matcher
    )

    // Job processor will be initialized after context is available
    this.jobProcessor = null as any
    this.jobScheduler = null as any
  }

  static getInstance(): MetadataService {
    if (!MetadataService.instance) {
      MetadataService.instance = new MetadataService()
    }
    return MetadataService.instance
  }

  /**
   * Initialize the service with user context
   * Call this once on app startup after profile is loaded
   */
  async initialize(context: ProviderContext): Promise<void> {
    if (this.initialized) {
      console.log('[Metadata] Already initialized')
      return
    }

    // Initialize SQLite database
    await this.cacheService.initialize()

    // Register TMDB provider (enabled by default)
    this.registerTMDB(context.config.apiKey)

    // Register JAV providers
    this.registerJAVProviders(context)

    // Configure rate limiters
    this.rateLimiter.configure('tmdb', 40) // 40 req/min
    this.rateLimiter.configure('javlibrary', 30) // 30 req/min
    this.rateLimiter.configure('r18', 20) // 20 req/min

    // Initialize job system
    this.jobProcessor = new JobProcessor(this.cacheService, this.registry, context)
    this.jobScheduler = new JobScheduler(this.jobProcessor)

    // Start background processing
    await this.jobProcessor.start()

    // Schedule daily refresh (if enabled in settings)
    if (context.librarySettings.autoFetchMetadata) {
      this.jobScheduler.startDailyRefresh()
    }

    this.initialized = true
    console.log('[Metadata] Service initialized')
  }

  /**
   * Shutdown the service gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return

    this.jobScheduler.stopAll()
    await this.jobProcessor.stop()

    this.initialized = false
    console.log('[Metadata] Service shutdown')
  }

  /**
   * Register TMDB provider with normalizers
   */
  private registerTMDB(apiKey?: string): void {
    const provider = new TMDBProvider()
    const normalizers = [new TMDBMovieNormalizer(), new TMDBTVNormalizer()]

    const config: ProviderConfig = {
      id: 'tmdb',
      name: 'The Movie Database',
      supportedTypes: ['movie', 'tv_series', 'tv_episode'],
      requiresApiKey: true,
      apiKey,
      enabled: !!apiKey,
      rateLimitPerMinute: 40,
      priority: 1
    }

    this.registry.registerProvider(provider, normalizers, config)
  }

  /**
   * Register JAV providers
   */
  private registerJAVProviders(context: ProviderContext): void {
    // JAVLibrary (no API key required, always enabled in adult profiles)
    const javLibraryProvider = new JAVLibraryProvider()
    const javLibraryNormalizer = new JAVNormalizer('javlibrary')

    const javLibraryConfig: ProviderConfig = {
      id: 'javlibrary',
      name: 'JAVLibrary',
      supportedTypes: ['jav'],
      requiresApiKey: false,
      enabled: context.profile.adultContentEnabled,
      rateLimitPerMinute: 30,
      priority: 2,
      isAdultProvider: true
    }

    this.registry.registerProvider(javLibraryProvider, [javLibraryNormalizer], javLibraryConfig)

    // R18/DMM (requires API key)
    const r18ApiKey = localStorage.getItem('r18_api_key')
    const r18Provider = new R18Provider()
    const r18Normalizer = new JAVNormalizer('r18')

    const r18Config: ProviderConfig = {
      id: 'r18',
      name: 'R18 / DMM',
      supportedTypes: ['jav'],
      requiresApiKey: true,
      apiKey: r18ApiKey ?? undefined,
      enabled: !!r18ApiKey && context.profile.adultContentEnabled,
      rateLimitPerMinute: 20,
      priority: 3,
      isAdultProvider: true
    }

    this.registry.registerProvider(r18Provider, [r18Normalizer], r18Config)
  }

  /**
   * Search and fetch metadata for a media item
   */
  async fetchMetadata(
    query: SearchQuery,
    context: ProviderContext
  ): Promise<FetchResult> {
    return this.registry.fetchMetadata(query, context)
  }

  /**
   * Fetch metadata for newly imported files
   */
  async fetchForImport(
    filePath: string,
    mediaType: MediaType,
    context: ProviderContext
  ): Promise<FetchResult> {
    // Parse filename to extract metadata
    const parsed = await this.parseFilename(filePath)

    const query: SearchQuery = {
      title: parsed.title,
      year: parsed.year,
      mediaType
    }

    return this.fetchMetadata(query, context)
  }

  /**
   * Parse filename to extract basic metadata
   */
  private async parseFilename(
    filePath: string
  ): Promise<{ title: string; year?: number }> {
    const filename = filePath.split(/[\\/]/).pop() ?? ''
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '')

    // Extract year (1900-2099)
    const yearMatch = nameWithoutExt.match(/\b(19|20)\d{2}\b/)
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined

    // Extract title (everything before year or file info)
    let title = nameWithoutExt
      .replace(/\b(19|20)\d{2}\b/, '')
      .replace(/\.(720p|1080p|2160p|4K|BluRay|WEB-?DL|HDTV|x264|x265|HEVC).*/i, '')
      .replace(/[\[\(].*?[\]\)]/g, '')
      .replace(/[._-]/g, ' ')
      .trim()

    return { title, year }
  }

  /**
   * Manual refresh for a specific media item
   */
  async refreshMetadata(
    mediaId: string,
    providerId: string,
    context: ProviderContext
  ): Promise<string> {
    return this.jobProcessor.scheduleRefresh(mediaId, providerId, {
      priority: 'high',
      maxAttempts: 3
    })
  }

  /**
   * Bulk refresh for multiple items
   */
  async refreshBulk(
    mediaIds: string[],
    providerId: string,
    context: ProviderContext
  ): Promise<string[]> {
    return this.jobProcessor.scheduleBulkRefresh(mediaIds, providerId, {
      priority: 'normal',
      maxAttempts: 3
    })
  }

  /**
   * Lock a field to prevent metadata overwriting
   */
  async lockField(
    mediaId: string,
    fieldPath: string,
    value: any,
    reason?: string
  ): Promise<void> {
    await this.cacheService.setOverride({
      mediaId,
      fieldPath,
      overrideValue: value,
      overrideAt: new Date().toISOString(),
      reason
    })
  }

  /**
   * Unlock a field to allow metadata updates
   */
  async unlockField(mediaId: string, fieldPath: string): Promise<void> {
    await this.cacheService.removeOverride(mediaId, fieldPath)
  }

  /**
   * Set custom artwork (locks the image)
   */
  async setCustomArtwork(
    mediaId: string,
    imageKind: 'poster' | 'backdrop' | 'cover',
    url: string,
    dimensions?: { width: number; height: number }
  ): Promise<void> {
    await this.cacheService.setArtworkOverride({
      mediaId,
      imageKind,
      url,
      width: dimensions?.width,
      height: dimensions?.height,
      lockedAt: new Date().toISOString()
    })
  }

  /**
   * Get canonical metadata by ID
   */
  async getCanonicalById(mediaId: string): Promise<CanonicalMedia | null> {
    return this.cacheService.getCanonicalById(mediaId)
  }

  /**
   * Test provider connections
   */
  async testConnections(context: ProviderContext): Promise<
    Array<{ providerId: string; name: string; success: boolean; error?: string }>
  > {
    return this.registry.testAllConnections(context)
  }

  /**
   * Update provider API key
   */
  updateApiKey(providerId: string, apiKey: string): void {
    this.registry.updateProviderConfig(providerId, { apiKey, enabled: true })

    // Reconfigure rate limiter if needed
    const config = this.registry.getProviderConfig(providerId)
    if (config?.rateLimitPerMinute) {
      this.rateLimiter.configure(providerId, config.rateLimitPerMinute)
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanCache(): Promise<number> {
    return this.cacheService.cleanExpired()
  }
}

// Export singleton instance
export const metadataService = MetadataService.getInstance()
