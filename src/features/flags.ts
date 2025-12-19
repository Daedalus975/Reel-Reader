// Default feature flag configuration. Flip these during development or via settings UI.
export const DEFAULT_FEATURE_FLAGS = {
  // Core infrastructure (now available)
  feature_external_sources: true, // Feature #1-2: External sources & watchers
  feature_metadata_artwork: true, // Feature #3-4: Metadata & artwork
  feature_collections: true, // Feature #3, #6, #8: Collections, box sets, franchises
  feature_offline_downloads: true, // Feature #61-63: Download manager
  feature_playlists: true, // Feature #71-80: Music playlists
  feature_casting_dlna: true, // Feature #64-66: DLNA casting
  feature_vaults: true, // Feature #49: Encrypted vaults
  feature_bookmarks_chapters: true, // Feature #28, #34: Bookmarks & chapters
  
  // Existing features
  feature_profiles_security: false, // Feature #41-50: Profiles with PIN
  feature_queue_ux: true,
  feature_backup_restore: true, // Already implemented
  feature_global_hotkeys: true, // Already implemented
  feature_notifications_jobs: true, // Already implemented
  
  // Advanced features (require more implementation)
  feature_lyrics_visualizer: false, // Feature #156-160
  feature_cloud_sync: false, // Feature #67-70, #177-180
  feature_video_player: true,
  feature_music_player_enhancements: false, // Feature #71-80 advanced
  feature_watch_party: false, // Feature #127-130
  feature_chromecast: false, // Requires Cast SDK
  feature_ai_automation: false, // Feature #101-110
  feature_plugin_system: false, // Feature #111-120
  feature_3d_video: false, // Feature #10
  feature_gesture_controls: false, // Feature #22
  feature_pip: false, // Picture-in-picture
  feature_trivia_popups: false, // Feature #29
  feature_multi_resolution: false, // Feature #15
  feature_alternate_titles: true, // Feature #4
  feature_franchise_grouping: true, // Feature #3
  feature_scene_tags: false, // Feature #40
  feature_reading_progress: false, // Feature #81-110 books
  feature_podcast_support: false, // Feature #81-90
  feature_social_sharing: false, // Feature #91-130
  feature_smart_collections: true, // Feature #6 (included with collections)
  feature_multi_device_sync: false, // Feature #171-177
  feature_biometric_unlock: false, // Feature #43
  feature_device_authorization: false, // Feature #50
}

export default DEFAULT_FEATURE_FLAGS

const STORAGE_KEY = 'reel_reader_feature_flags'

// Load flags from localStorage
function loadFlags(): typeof DEFAULT_FEATURE_FLAGS {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to load feature flags:', error)
  }
  return DEFAULT_FEATURE_FLAGS
}

// Save flags to localStorage
function saveFlags(flags: typeof DEFAULT_FEATURE_FLAGS): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  } catch (error) {
    console.error('Failed to save feature flags:', error)
  }
}

let currentFlags: typeof DEFAULT_FEATURE_FLAGS = loadFlags()

/**
 * Set a feature flag value at runtime
 */
export function setFeatureFlag(flag: keyof typeof DEFAULT_FEATURE_FLAGS, enabled: boolean): void {
  currentFlags = { ...currentFlags, [flag]: enabled }
  saveFlags(currentFlags)
}

/**
 * Get current feature flags
 */
export function getFeatureFlags(): typeof DEFAULT_FEATURE_FLAGS {
  return currentFlags
}
