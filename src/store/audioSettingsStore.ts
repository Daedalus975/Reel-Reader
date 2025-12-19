import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AudioSettings {
  // Crossfade
  crossfadeEnabled: boolean
  crossfadeDuration: number // seconds (0-12)
  
  // Gapless playback
  gaplessEnabled: boolean
  
  // Volume normalization
  normalizationEnabled: boolean
  targetVolume: number // 0-1
  
  // ReplayGain
  replayGainEnabled: boolean
  replayGainMode: 'track' | 'album'
  replayGainPreamp: number // dB (-15 to 15)
  
  // EQ presets
  eqEnabled: boolean
  eqPreset: 'flat' | 'rock' | 'pop' | 'jazz' | 'classical' | 'electronic' | 'bass-boost' | 'custom'
  customEq: number[] // 10-band EQ values
  
  // Sleep timer
  sleepTimerEnabled: boolean
  sleepTimerMinutes: number
  sleepTimerEndTime: number | null // timestamp
  
  // Actions
  setCrossfade: (enabled: boolean, duration?: number) => void
  setGapless: (enabled: boolean) => void
  setNormalization: (enabled: boolean, targetVolume?: number) => void
  setReplayGain: (enabled: boolean, mode?: 'track' | 'album', preamp?: number) => void
  setEq: (enabled: boolean, preset?: string) => void
  setCustomEq: (values: number[]) => void
  setSleepTimer: (minutes: number) => void
  clearSleepTimer: () => void
  reset: () => void
}

const defaultSettings = {
  crossfadeEnabled: false,
  crossfadeDuration: 3,
  gaplessEnabled: true,
  normalizationEnabled: false,
  targetVolume: 0.7,
  replayGainEnabled: false,
  replayGainMode: 'track' as const,
  replayGainPreamp: 0,
  eqEnabled: false,
  eqPreset: 'flat' as const,
  customEq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  sleepTimerEnabled: false,
  sleepTimerMinutes: 30,
  sleepTimerEndTime: null,
}

export const useAudioSettingsStore = create<AudioSettings>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setCrossfade: (enabled, duration) =>
        set((state) => ({
          crossfadeEnabled: enabled,
          crossfadeDuration: duration !== undefined ? duration : state.crossfadeDuration,
        })),

      setGapless: (enabled) => set({ gaplessEnabled: enabled }),

      setNormalization: (enabled, targetVolume) =>
        set((state) => ({
          normalizationEnabled: enabled,
          targetVolume: targetVolume !== undefined ? targetVolume : state.targetVolume,
        })),

      setReplayGain: (enabled, mode, preamp) =>
        set((state) => ({
          replayGainEnabled: enabled,
          replayGainMode: mode !== undefined ? mode : state.replayGainMode,
          replayGainPreamp: preamp !== undefined ? preamp : state.replayGainPreamp,
        })),

      setEq: (enabled, preset) =>
        set((state) => ({
          eqEnabled: enabled,
          eqPreset: (preset || state.eqPreset) as any,
        })),

      setCustomEq: (values) => set({ customEq: values, eqPreset: 'custom' }),

      setSleepTimer: (minutes) => {
        const endTime = Date.now() + minutes * 60 * 1000
        set({
          sleepTimerEnabled: true,
          sleepTimerMinutes: minutes,
          sleepTimerEndTime: endTime,
        })
      },

      clearSleepTimer: () =>
        set({
          sleepTimerEnabled: false,
          sleepTimerEndTime: null,
        }),

      reset: () => set(defaultSettings),
    }),
    {
      name: 'audio-settings',
    }
  )
)
