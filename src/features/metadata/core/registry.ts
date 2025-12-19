/**
 * Provider Registry (Section 11 of METADATA_PROVIDERS_SPEC.md)
 * 
 * Centralized registry for all metadata providers with configuration management.
 */

import {
  MetadataProvider,
  Normalizer,
  EnrichmentProvider,
  ProviderConfig,
  ProviderContext,
  SearchQuery,
  SearchResult,
  ProviderError
} from './provider'
import { MediaType, CanonicalMedia } from './models'
import { MatchingService, MatchResult } from './matching'
import { CacheService, CacheKeyBuilder, CACHE_TTL, isCacheExpired } from './cache'
import { RateLimiterService } from './rate-limiter'

/**
 * Fetch pipeline result
 */
export interface FetchResult {
  success: boolean
  canonical?: CanonicalMedia
  matchResult?: MatchResult
  errors: Array<{
    providerId: string
    error: string
    retryable: boolean
  }>
  fromCache: boolean
  timestamp: string
}

/**
 * Central registry for all metadata providers
 */
export class ProviderRegistry {
  private providers = new Map<string, MetadataProvider>()
  private normalizers = new Map<string, Map<MediaType, Normalizer>>()
  private enrichers = new Map<string, EnrichmentProvider>()
  private configs = new Map<string, ProviderConfig>()

  constructor(
    private cacheService: CacheService,
    private rateLimiter: RateLimiterService,
    private matcher: MatchingService
  ) {}

  /**
   * Register a metadata provider with its normalizers
   */
  registerProvider(
    provider: MetadataProvider,
    normalizers: Normalizer[],
    config: ProviderConfig
  ): void {
    this.providers.set(provider.id, provider)
    this.configs.set(provider.id, config)

    // Index normalizers by media type
    const normalizerMap = new Map<MediaType, Normalizer>()
    for (const normalizer of normalizers) {
      normalizerMap.set(normalizer.mediaType, normalizer)
    }
    this.normalizers.set(provider.id, normalizerMap)

    console.log(`[Registry] Registered provider: ${provider.name}`)
  }

  /**
   * Register an enrichment provider
   */
  registerEnricher(enricher: EnrichmentProvider): void {
    this.enrichers.set(enricher.id, enricher)
    console.log(`[Registry] Registered enricher: ${enricher.name}`)
  }

  /**
   * Get enabled providers for a media type, sorted by priority
   */
  getProvidersForType(mediaType: MediaType, context: ProviderContext): MetadataProvider[] {
    const candidates: Array<{ provider: MetadataProvider; config: ProviderConfig }> = []

    for (const [id, provider] of this.providers) {
      const config = this.configs.get(id)
      if (!config || !config.enabled) continue
      if (!provider.supportedTypes.includes(mediaType)) continue

      // Check adult content policy
      if (config.isAdultProvider && !context.profile.adultContentEnabled) {
        continue
      }
      if (config.requiresVaultUnlock && !context.profile.vaultUnlocked) {
        continue
      }

      candidates.push({ provider, config })
    }

    // Sort by priority (lower number = higher priority)
    candidates.sort((a, b) => (a.config.priority ?? 100) - (b.config.priority ?? 100))

    return candidates.map(c => c.provider)
  }

  /**
   * Search with fallback across multiple providers
   */
  async searchWithFallback(
    query: SearchQuery,
    context: ProviderContext
  ): Promise<SearchResult[]> {
    const providers = this.getProvidersForType(query.mediaType, context)
    const allResults: SearchResult[] = []
    const errors: ProviderError[] = []

    for (const provider of providers) {
      try {
        // Check cache first
        const cacheKey = CacheKeyBuilder.forSearch(provider.id, query)
        const cached = await this.cacheService.getCached(cacheKey)

        if (cached && !isCacheExpired(cached)) {
          console.log(`[Registry] Cache hit for ${provider.id}`)
          allResults.push(...(cached.response as SearchResult[]))
          continue
        }

        // Rate limit
        await this.rateLimiter.throttle(provider.id)

        // Search
        const results = await provider.search(query, context)
        allResults.push(...results)

        // Cache results
        await this.cacheService.setCached({
          cacheKey,
          providerId: provider.id,
          mediaType: query.mediaType,
          response: results,
          fetchedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + CACHE_TTL.SEARCH_RESULTS).toISOString(),
          requestHash: cacheKey
        })

        // If we got good results, don't continue to fallback providers
        if (results.length > 0) {
          console.log(`[Registry] Found ${results.length} results from ${provider.name}`)
          break
        }
      } catch (error) {
        console.error(`[Registry] Provider ${provider.id} failed:`, error)
        errors.push(
          error instanceof ProviderError
            ? error
            : new ProviderError(provider.id, String(error))
        )
        // Continue to next provider (fallback)
      }
    }

    if (allResults.length === 0 && errors.length > 0) {
      throw new ProviderError(
        'registry',
        `All providers failed: ${errors.map(e => e.message).join(', ')}`
      )
    }

    return allResults
  }

  /**
   * Fetch detailed metadata by external ID with normalization
   */
  async fetchAndNormalize(
    providerId: string,
    externalId: string,
    mediaType: MediaType,
    context: ProviderContext
  ): Promise<CanonicalMedia> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new ProviderError(providerId, 'Provider not found')
    }

    const normalizerMap = this.normalizers.get(providerId)
    const normalizer = normalizerMap?.get(mediaType)
    if (!normalizer) {
      throw new ProviderError(providerId, `No normalizer for ${mediaType}`)
    }

    // Check cache
    const cacheKey = CacheKeyBuilder.forFetchById(providerId, externalId, mediaType)
    const cached = await this.cacheService.getCached(cacheKey)

    let rawData: any
    if (cached && !isCacheExpired(cached)) {
      console.log(`[Registry] Cache hit for ${providerId}:${externalId}`)
      rawData = cached.response
    } else {
      // Rate limit
      await this.rateLimiter.throttle(providerId)

      // Fetch from provider
      rawData = await provider.fetchById(externalId, mediaType, context)

      // Cache response
      await this.cacheService.setCached({
        cacheKey,
        providerId,
        mediaType,
        response: rawData,
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CACHE_TTL.FULL_METADATA).toISOString(),
        requestHash: cacheKey
      })
    }

    // Normalize to canonical model
    const result = normalizer.normalize(rawData, context)

    if (result.warnings.length > 0) {
      console.warn(`[Registry] Normalization warnings for ${externalId}:`, result.warnings)
    }

    return result.canonical
  }

  /**
   * Full pipeline: search → match → fetch → normalize
   */
  async fetchMetadata(
    query: SearchQuery,
    context: ProviderContext
  ): Promise<FetchResult> {
    const errors: FetchResult['errors'] = []

    try {
      // Step 1: Search
      const searchResults = await this.searchWithFallback(query, context)

      if (searchResults.length === 0) {
        return {
          success: false,
          errors: [{ providerId: 'registry', error: 'No results found', retryable: false }],
          fromCache: false,
          timestamp: new Date().toISOString()
        }
      }

      // Step 2: Match
      const matchResult = this.matcher.matchQuery(query, searchResults)

      if (!matchResult.matched || !matchResult.bestMatch) {
        return {
          success: false,
          matchResult,
          errors: [
            { providerId: 'matching', error: 'No confident match found', retryable: false }
          ],
          fromCache: false,
          timestamp: new Date().toISOString()
        }
      }

      // Step 3: Fetch & normalize best match
      const bestResult = matchResult.bestMatch.searchResult
      const canonical = await this.fetchAndNormalize(
        bestResult.providerId,
        bestResult.externalId,
        query.mediaType,
        context
      )

      // Step 4: Apply user overrides
      await this.applyUserOverrides(canonical)

      // Step 5: Save to canonical store
      await this.cacheService.saveCanonical(canonical)

      return {
        success: true,
        canonical,
        matchResult,
        errors: [],
        fromCache: false,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      const providerError =
        error instanceof ProviderError
          ? error
          : new ProviderError('unknown', String(error))

      errors.push({
        providerId: providerError.providerId,
        error: providerError.message,
        retryable: providerError.retryable
      })

      return {
        success: false,
        errors,
        fromCache: false,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Apply user overrides to canonical entity (respects locked fields)
   */
  private async applyUserOverrides(canonical: CanonicalMedia): Promise<void> {
    const overrides = await this.cacheService.getOverrides(canonical.id)

    for (const override of overrides) {
      this.applyOverride(canonical, override.fieldPath, override.overrideValue)
    }

    // Apply artwork overrides
    const artworkOverrides = await this.cacheService.getArtworkOverrides(canonical.id)
    if (artworkOverrides.length > 0 && canonical.images) {
      for (const artOverride of artworkOverrides) {
        // Replace or add user-locked artwork
        const existingIndex = canonical.images.findIndex(
          img => img.kind === artOverride.imageKind && img.isUserOverride
        )

        const userImage = {
          url: artOverride.url,
          kind: artOverride.imageKind,
          width: artOverride.width,
          height: artOverride.height,
          isUserOverride: true
        }

        if (existingIndex >= 0) {
          canonical.images[existingIndex] = userImage
        } else {
          canonical.images.unshift(userImage)
        }
      }
    }

    // Track locked fields
    canonical.lockedFields = overrides.map(o => o.fieldPath)
  }

  private applyOverride(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) return
      current = current[keys[i]]
    }

    const finalKey = keys[keys.length - 1]
    current[finalKey] = value
  }

  /**
   * Test connection for all enabled providers
   */
  async testAllConnections(context: ProviderContext): Promise<
    Array<{ providerId: string; name: string; success: boolean; error?: string }>
  > {
    const results: Array<any> = []

    for (const [id, provider] of this.providers) {
      const config = this.configs.get(id)
      if (!config?.enabled) continue

      try {
        const success = await provider.testConnection(context)
        results.push({ providerId: id, name: provider.name, success })
      } catch (error) {
        results.push({
          providerId: id,
          name: provider.name,
          success: false,
          error: String(error)
        })
      }
    }

    return results
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerId: string): ProviderConfig | undefined {
    return this.configs.get(providerId)
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(providerId: string, updates: Partial<ProviderConfig>): void {
    const existing = this.configs.get(providerId)
    if (!existing) throw new Error(`Provider ${providerId} not found`)

    this.configs.set(providerId, { ...existing, ...updates })
  }
}
