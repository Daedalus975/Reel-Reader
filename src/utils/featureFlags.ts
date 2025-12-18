// Simple feature flag manager
// Flags persisted in localStorage and readable at runtime. Feature flags should be defined in `src/features/flags.ts`.

export type FeatureKey =
  | 'feature_external_sources'
  | 'feature_metadata_artwork'
  | 'feature_offline_downloads'
  | 'feature_profiles_security'
  | 'feature_queue_ux'
  | 'feature_casting_dlna'
  | 'feature_backup_restore'
  | 'feature_global_hotkeys'
  | 'feature_lyrics_visualizer'
  | 'feature_cloud_sync'
  // add others here as needed

const STORAGE_KEY = 'reel_reader_feature_flags'

export const getFlags = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export const isFeatureEnabled = (key: FeatureKey, defaultValue = false): boolean => {
  const flags = getFlags()
  if (key in flags) return Boolean(flags[key])
  return defaultValue
}

export const setFeatureFlag = (key: FeatureKey, value: boolean) => {
  const flags = getFlags()
  flags[key] = value
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
}

export default {
  getFlags,
  isFeatureEnabled,
  setFeatureFlag,
}
