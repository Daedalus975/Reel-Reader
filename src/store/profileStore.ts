import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '../types'

interface ProfileStore {
  profiles: Profile[]
  currentProfileId: string

  createProfile: (name: string, avatar?: string, adultContentEnabled?: boolean) => Profile
  switchProfile: (profileId: string) => void
  deleteProfile: (profileId: string) => void
  updateProfile: (profileId: string, updates: Partial<Profile>) => void
  getCurrentProfile: () => Profile | undefined
  verifyPin: (profileId: string, pin: string) => Promise<boolean>
  setProfilePin: (profileId: string, pin: string) => void
}

const DEFAULT_PROFILE: Profile = {
  id: '1',
  name: 'Default',
  avatar: undefined,
  adultContentEnabled: false,
  isDefault: true,
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      currentProfileId: '1',

      createProfile: (name, avatar, adultContentEnabled = false) => {
        let newProfile: Profile | null = null
        set((state) => {
          newProfile = {
            id: `${Date.now()}`,
            name,
            avatar,
            adultContentEnabled,
            isDefault: false,
          }
          return {
            profiles: [...state.profiles, newProfile],
            currentProfileId: newProfile.id,
          }
        })
        return newProfile!
      },

      switchProfile: (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId)
        if (profile) {
          set({ currentProfileId: profileId })
        }
      },

      deleteProfile: (profileId) => {
        set((state) => {
          const filtered = state.profiles.filter((p) => p.id !== profileId)
          if (filtered.length === 0) {
            return state
          }
          const newCurrent = state.currentProfileId === profileId ? filtered[0].id : state.currentProfileId
          return {
            profiles: filtered,
            currentProfileId: newCurrent,
          }
        })
      },

      updateProfile: (profileId, updates) => {
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === profileId ? { ...p, ...updates } : p)),
        }))
      },

      getCurrentProfile: () => {
        const state = get()
        return state.profiles.find((p) => p.id === state.currentProfileId)
      },

      verifyPin: async (profileId, pin) => {
        const profile = get().profiles.find((p) => p.id === profileId)
        if (!profile || !profile.pinHash) return true // No PIN set
        
        // Simple hash comparison (in production, use proper crypto)
        const hash = btoa(pin)
        return hash === profile.pinHash
      },

      setProfilePin: (profileId, pin) => {
        const hash = btoa(pin) // Simple hash (use bcrypt in production)
        get().updateProfile(profileId, { pinHash: hash })
      },

      removeProfilePin: (profileId) => {
        get().updateProfile(profileId, { pinHash: undefined })
      },
    }),
    {
      name: 'reel-reader-profiles',
      partialize: (state) => ({
        profiles: state.profiles,
        currentProfileId: state.currentProfileId,
      }),
    },
  ),
)
