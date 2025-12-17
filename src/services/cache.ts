// Simple persistent cache with optional Tauri AppCache fallback
import type { MediaType } from '../types'

type Entry<T> = { expiresAt: number; value: T }
const MEM: Record<string, Entry<any>> = {}

const TAURI = (() => {
  try {
    // @ts-ignore
    return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
  } catch {
    return false
  }
})()

async function readTauriFile(): Promise<Record<string, Entry<any>>> {
  try {
    const { readTextFile } = await import('@tauri-apps/api/fs')
    const { BaseDirectory } = await import('@tauri-apps/api/fs')
    const text = await readTextFile('metadata-cache.json', { dir: BaseDirectory.AppCache })
    return JSON.parse(text)
  } catch {
    return {}
  }
}

async function writeTauriFile(data: Record<string, Entry<any>>): Promise<void> {
  try {
    const { writeTextFile, createDir } = await import('@tauri-apps/api/fs')
    const { BaseDirectory } = await import('@tauri-apps/api/fs')
    // Ensure AppCache dir exists (no-op if present)
    try { await createDir('', { dir: BaseDirectory.AppCache }) } catch {}
    await writeTextFile('metadata-cache.json', JSON.stringify(data), { dir: BaseDirectory.AppCache })
  } catch {}
}

let loaded = false
async function ensureLoaded() {
  if (loaded) return
  // Load from Tauri if available; else from localStorage
  let disk: Record<string, Entry<any>> = {}
  if (TAURI) {
    disk = await readTauriFile()
  } else if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('metadata-cache')
      disk = raw ? JSON.parse(raw) : {}
    } catch { disk = {} }
  }
  Object.assign(MEM, disk)
  loaded = true
}

export async function getCached<T = any>(type: MediaType, query: string): Promise<T[] | null> {
  await ensureLoaded()
  const key = `${type}::${query.trim().toLowerCase()}`
  const entry = MEM[key]
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    delete MEM[key]
    return null
  }
  return entry.value as T[]
}

export async function setCached<T = any>(type: MediaType, query: string, value: T[], ttlMs = 12 * 60 * 60 * 1000) {
  await ensureLoaded()
  const key = `${type}::${query.trim().toLowerCase()}`
  MEM[key] = { value, expiresAt: Date.now() + ttlMs }
  if (TAURI) {
    await writeTauriFile(MEM)
  } else if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem('metadata-cache', JSON.stringify(MEM)) } catch {}
  }
}
