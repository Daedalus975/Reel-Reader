import { create } from 'zustand'
import type { Media, MediaType } from '../types'
import { useProfileStore } from './profileStore'
import { useProfileMediaStore } from './profileMediaStore'
import { useLibraryStore } from './libraryStore'

interface BulkUpdateOptions {
  type?: MediaType
  ids?: string[]
  updates: Partial<Media>
}

interface BulkUpdateState {
  isRunning: boolean
  progress: number // 0..1
  message?: string
  total: number
  processed: number
  runBulkUpdate: (options: BulkUpdateOptions) => Promise<void>
  reset: () => void
}

function mergeMedia(m: Media, updates: Partial<Media>): Media {
  const cleaned: Partial<Media> = {}
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      // @ts-ignore
      cleaned[key] = value
    }
  })
  return { ...m, ...cleaned }
}

function shouldUpdate(m: Media, options: BulkUpdateOptions) {
  if (options.type && m.type !== options.type) return false
  if (options.ids && options.ids.length > 0 && !options.ids.includes(m.id)) return false
  return true
}

export const useBulkUpdateStore = create<BulkUpdateState>((set) => ({
  isRunning: false,
  progress: 0,
  message: undefined,
  total: 0,
  processed: 0,

  reset: () => set({ isRunning: false, progress: 0, message: undefined, total: 0, processed: 0 }),

  runBulkUpdate: async (options) => {
    set({ isRunning: true, progress: 0, message: 'Starting...', total: 0, processed: 0 })

    const profileStore = useProfileStore.getState()
    const mediaStore = useProfileMediaStore.getState()
    const libraryStore = useLibraryStore.getState()

    const profiles = profileStore.profiles
    const updates = options.updates

    // Count targets first
    let totalTargets = 0
    profiles.forEach((p) => {
      const list = mediaStore.getMediaForProfile(p.id)
      list.forEach((m) => {
        if (shouldUpdate(m, options)) totalTargets += 1
      })
    })

    if (totalTargets === 0) {
      set({ isRunning: false, progress: 0, message: 'No matching items found', total: 0, processed: 0 })
      return
    }

    let processed = 0

    for (const profile of profiles) {
      const list = mediaStore.getMediaForProfile(profile.id)
      for (const item of list) {
        if (!shouldUpdate(item, options)) continue
        const merged = mergeMedia(item, updates)
        mediaStore.updateMediaInProfile(profile.id, item.id, merged)
        processed += 1
        const progress = processed / totalTargets
        set({ processed, total: totalTargets, progress, message: `Updated ${processed} / ${totalTargets}` })
      }

      // If this is the current profile, sync library store view
      if (profile.id === profileStore.currentProfileId) {
        const refreshed = mediaStore.getMediaForProfile(profile.id)
        libraryStore.setMedia(refreshed)
      }
    }

    set({ isRunning: false, message: 'Bulk update completed', progress: 1, total: totalTargets, processed })
  },
}))
