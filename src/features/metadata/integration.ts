/**
 * Integration with Existing Stores
 * 
 * Hooks to connect metadata service with libraryStore and sourceFoldersStore.
 */

import { metadataService } from './index'
import { ProviderContext } from './core/provider'
import { MediaType } from './core/models'

/**
 * Build provider context from current store state
 */
export function buildProviderContext(
  profileStore: any,
  settingsStore: any
): ProviderContext {
  const profile = profileStore.getCurrentProfile ? profileStore.getCurrentProfile() : profileStore.profiles?.find((p: any) => p.id === profileStore.currentProfileId)
  
  if (!profile) {
    throw new Error('No active profile found. Please select a profile first.')
  }

  return {
    profile: {
      id: profile.id,
      adultContentEnabled: profile.type === 'adult', // Adult profiles only
      vaultUnlocked: profile.vaultUnlocked ?? false
    },
    librarySettings: {
      autoFetchMetadata: profile.autoFetchMetadata ?? false,
      parseFilenames: profile.parseFilenames ?? true,
      scanForNfo: profile.scanForNfo ?? true,
      fetchAdultMetadata: profile.fetchAdultMetadata ?? false
    },
    config: {
      id: 'tmdb',
      name: 'The Movie Database',
      supportedTypes: ['movie', 'tv_series', 'tv_episode'],
      requiresApiKey: true,
      apiKey: settingsStore.tmdbApiKey,
      enabled: !!settingsStore.tmdbApiKey,
      priority: 1
    }
  }
}

/**
 * Hook for scanning source folders with metadata fetching
 */
export async function scanWithMetadata(
  filePath: string,
  mediaType: MediaType,
  context: ProviderContext
): Promise<{
  success: boolean
  canonical?: any
  error?: string
}> {
  try {
    // Check if metadata fetching is enabled
    if (!context.librarySettings.autoFetchMetadata) {
      return { success: false, error: 'Auto-fetch disabled' }
    }

    // Fetch metadata
    const result = await metadataService.fetchForImport(filePath, mediaType, context)

    if (!result.success) {
      console.warn(`[Metadata] Failed to fetch for ${filePath}:`, result.errors)
      return {
        success: false,
        error: result.errors.map(e => e.error).join(', ')
      }
    }

    return {
      success: true,
      canonical: result.canonical
    }
  } catch (error) {
    console.error('[Metadata] Scan error:', error)
    return {
      success: false,
      error: String(error)
    }
  }
}

/**
 * Enhance media item with metadata
 */
export function enhanceMediaWithMetadata(
  mediaItem: any,
  canonical: any
): any {
  return {
    ...mediaItem,
    // Enhance with canonical data
    title: canonical.title ?? mediaItem.title,
    description: canonical.description ?? mediaItem.description,
    year: canonical.year ?? mediaItem.year,
    genres: canonical.genres ?? mediaItem.genres,
    thumbnailUrl: canonical.images?.find((img: any) => img.kind === 'poster')?.url ?? mediaItem.thumbnailUrl,
    backdropUrl: canonical.images?.find((img: any) => img.kind === 'backdrop')?.url ?? mediaItem.backdropUrl,
    
    // Add metadata tracking
    metadataSource: 'provider',
    canonicalId: canonical.id,
    externalRefs: canonical.externalRefs,
    lastMetadataUpdate: new Date().toISOString()
  }
}

/**
 * Batch fetch metadata for multiple items
 */
export async function batchFetchMetadata(
  items: Array<{ filePath: string; mediaType: MediaType }>,
  context: ProviderContext,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, any>> {
  const results = new Map<string, any>()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const result = await scanWithMetadata(item.filePath, item.mediaType, context)

    if (result.success && result.canonical) {
      results.set(item.filePath, result.canonical)
    }

    onProgress?.(i + 1, items.length)

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

/**
 * Check if media needs metadata refresh
 */
export function needsMetadataRefresh(mediaItem: any): boolean {
  if (!mediaItem.lastMetadataUpdate) return true

  const lastUpdate = new Date(mediaItem.lastMetadataUpdate)
  const now = new Date()
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

  // Refresh if older than 30 days
  return daysSinceUpdate > 30
}

/**
 * Adult content policy check
 * 
 * Adult content is isolated to Adult profiles only.
 * Non-adult profiles cannot access adult content metadata.
 */
export function canFetchAdultMetadata(
  mediaType: MediaType,
  context: ProviderContext
): boolean {
  const isAdultType = mediaType === 'adult_video' || mediaType === 'doujin'

  if (!isAdultType) return true // Non-adult content always allowed

  // Adult content requires Adult profile type + vault unlocked + metadata fetch enabled
  return (
    context.profile.adultContentEnabled && // Only true for Adult profiles
    context.profile.vaultUnlocked &&
    context.librarySettings.fetchAdultMetadata
  )
}
