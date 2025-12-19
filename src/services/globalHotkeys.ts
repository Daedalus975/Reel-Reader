/**
 * Global hotkey manager using Tauri's globalShortcut API
 * Provides system-wide keyboard shortcuts for media playback
 */

import { isDesktop } from '@/utils/runtime'

type HotkeyAction = 'play-pause' | 'next' | 'previous' | 'volume-up' | 'volume-down' | 'mute' | 'stop'

interface HotkeyBinding {
  keys: string
  action: HotkeyAction
  description: string
}

// Default hotkey bindings
const DEFAULT_HOTKEYS: HotkeyBinding[] = [
  { keys: 'MediaPlayPause', action: 'play-pause', description: 'Play/Pause' },
  { keys: 'MediaNextTrack', action: 'next', description: 'Next Track' },
  { keys: 'MediaPrevTrack', action: 'previous', description: 'Previous Track' },
  { keys: 'MediaStop', action: 'stop', description: 'Stop Playback' },
  { keys: 'CommandOrControl+Alt+P', action: 'play-pause', description: 'Play/Pause (Custom)' },
  { keys: 'CommandOrControl+Alt+Right', action: 'next', description: 'Next (Custom)' },
  { keys: 'CommandOrControl+Alt+Left', action: 'previous', description: 'Previous (Custom)' },
]

type HotkeyCallback = (action: HotkeyAction) => void

let hotkeyCallback: HotkeyCallback | null = null
let registeredHotkeys: string[] = []
let globalShortcut: any = null

/**
 * Initialize the global hotkey manager
 */
export async function initializeHotkeys(callback: HotkeyCallback): Promise<boolean> {
  if (!isDesktop()) {
    console.log('[Hotkeys] Not available in web environment')
    return false
  }

  try {
    const gs = await import('@tauri-apps/api/globalShortcut')
    globalShortcut = gs
    hotkeyCallback = callback

    // Register all default hotkeys
    for (const hotkey of DEFAULT_HOTKEYS) {
      try {
        await globalShortcut.register(hotkey.keys, () => {
          console.log(`[Hotkeys] Triggered: ${hotkey.action}`)
          if (hotkeyCallback) {
            hotkeyCallback(hotkey.action)
          }
        })
        registeredHotkeys.push(hotkey.keys)
        console.log(`[Hotkeys] Registered: ${hotkey.keys} → ${hotkey.action}`)
      } catch (error) {
        // Some hotkeys might not be available on certain platforms
        console.warn(`[Hotkeys] Failed to register ${hotkey.keys}:`, error)
      }
    }

    console.log(`[Hotkeys] Initialized with ${registeredHotkeys.length} hotkeys`)
    return true
  } catch (error) {
    console.error('[Hotkeys] Failed to initialize:', error)
    return false
  }
}

/**
 * Unregister all hotkeys
 */
export async function cleanupHotkeys(): Promise<void> {
  if (!globalShortcut || registeredHotkeys.length === 0) {
    return
  }

  try {
    for (const keys of registeredHotkeys) {
      try {
        await globalShortcut.unregister(keys)
      } catch (error) {
        console.warn(`[Hotkeys] Failed to unregister ${keys}:`, error)
      }
    }

    registeredHotkeys = []
    hotkeyCallback = null
    console.log('[Hotkeys] Cleaned up all hotkeys')
  } catch (error) {
    console.error('[Hotkeys] Cleanup error:', error)
  }
}

/**
 * Check if a specific hotkey is registered
 */
export async function isHotkeyRegistered(keys: string): Promise<boolean> {
  if (!globalShortcut) {
    return false
  }

  try {
    return await globalShortcut.isRegistered(keys)
  } catch {
    return false
  }
}

/**
 * Get all available hotkey bindings
 */
export function getAvailableHotkeys(): HotkeyBinding[] {
  return DEFAULT_HOTKEYS
}

/**
 * Register a custom hotkey
 */
export async function registerCustomHotkey(
  keys: string,
  action: HotkeyAction
): Promise<boolean> {
  if (!globalShortcut || !hotkeyCallback) {
    console.warn('[Hotkeys] Manager not initialized')
    return false
  }

  try {
    await globalShortcut.register(keys, () => {
      console.log(`[Hotkeys] Custom trigger: ${action}`)
      if (hotkeyCallback) {
        hotkeyCallback(action)
      }
    })
    
    registeredHotkeys.push(keys)
    console.log(`[Hotkeys] Registered custom: ${keys} → ${action}`)
    return true
  } catch (error) {
    console.error(`[Hotkeys] Failed to register custom hotkey ${keys}:`, error)
    return false
  }
}

/**
 * Unregister a specific hotkey
 */
export async function unregisterHotkey(keys: string): Promise<boolean> {
  if (!globalShortcut) {
    return false
  }

  try {
    await globalShortcut.unregister(keys)
    registeredHotkeys = registeredHotkeys.filter((k) => k !== keys)
    console.log(`[Hotkeys] Unregistered: ${keys}`)
    return true
  } catch (error) {
    console.error(`[Hotkeys] Failed to unregister ${keys}:`, error)
    return false
  }
}
