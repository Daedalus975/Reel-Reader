// Download Manager Store - Handle offline downloads queue
// Features: #61-63, #67-70

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Download } from '../types'

interface DownloadManagerStore {
  downloads: Download[]
  maxConcurrent: number
  bandwidthLimit?: number // bytes/sec, undefined = unlimited
  storageQuota?: number // bytes, undefined = unlimited
  
  // Queue management
  addDownload: (mediaId: string, url: string, scheduledFor?: Date) => string
  removeDownload: (id: string) => void
  startDownload: (id: string) => void
  pauseDownload: (id: string) => void
  resumeDownload: (id: string) => void
  cancelDownload: (id: string) => void
  retryDownload: (id: string) => void
  
  // Progress tracking
  updateDownloadProgress: (id: string, progress: number, bytesDownloaded: number, speed?: number) => void
  setDownloadCompleted: (id: string, filePath: string) => void
  setDownloadFailed: (id: string, error: string) => void
  
  // Settings
  setMaxConcurrent: (max: number) => void
  setBandwidthLimit: (bytesPerSec?: number) => void
  setStorageQuota: (bytes?: number) => void
  
  // Queries
  getDownload: (id: string) => Download | undefined
  getDownloadsByMediaId: (mediaId: string) => Download[]
  getActiveDownloads: () => Download[]
  getQueuedDownloads: () => Download[]
  getTotalDownloadedBytes: () => number
  getEstimatedTimeRemaining: () => number | undefined
  
  // Cleanup
  clearCompleted: () => void
  clearFailed: () => void
}

export const useDownloadManagerStore = create<DownloadManagerStore>()(
  persist(
    (set, get) => ({
      downloads: [],
      maxConcurrent: 3,
      bandwidthLimit: undefined,
      storageQuota: undefined,
      
      addDownload: (mediaId, url, scheduledFor) => {
        const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const download: Download = {
          id,
          mediaId,
          url,
          status: scheduledFor ? 'queued' : 'queued',
          progress: 0,
          bytesDownloaded: 0,
          bytesTotal: 0,
          scheduledFor,
          createdAt: new Date(),
        }
        set((state) => ({ downloads: [...state.downloads, download] }))
        return id
      },
      
      removeDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.filter((d) => d.id !== id),
        }))
      },
      
      startDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, status: 'downloading' as const } : d
          ),
        }))
      },
      
      pauseDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, status: 'paused' as const } : d
          ),
        }))
      },
      
      resumeDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id && d.status === 'paused' ? { ...d, status: 'downloading' as const } : d
          ),
        }))
      },
      
      cancelDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, status: 'cancelled' as const } : d
          ),
        }))
      },
      
      retryDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id && d.status === 'failed'
              ? { ...d, status: 'queued' as const, error: undefined, progress: 0, bytesDownloaded: 0 }
              : d
          ),
        }))
      },
      
      updateDownloadProgress: (id, progress, bytesDownloaded, speed) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, progress, bytesDownloaded, speed } : d
          ),
        }))
      },
      
      setDownloadCompleted: (id, filePath) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id
              ? { ...d, status: 'completed' as const, filePath, progress: 100, completedAt: new Date() }
              : d
          ),
        }))
      },
      
      setDownloadFailed: (id, error) => {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, status: 'failed' as const, error } : d
          ),
        }))
      },
      
      setMaxConcurrent: (max) => {
        set({ maxConcurrent: max })
      },
      
      setBandwidthLimit: (bytesPerSec) => {
        set({ bandwidthLimit: bytesPerSec })
      },
      
      setStorageQuota: (bytes) => {
        set({ storageQuota: bytes })
      },
      
      getDownload: (id) => {
        return get().downloads.find((d) => d.id === id)
      },
      
      getDownloadsByMediaId: (mediaId) => {
        return get().downloads.filter((d) => d.mediaId === mediaId)
      },
      
      getActiveDownloads: () => {
        return get().downloads.filter((d) => d.status === 'downloading')
      },
      
      getQueuedDownloads: () => {
        return get().downloads.filter((d) => d.status === 'queued')
      },
      
      getTotalDownloadedBytes: () => {
        return get().downloads
          .filter((d) => d.status === 'completed')
          .reduce((sum, d) => sum + d.bytesDownloaded, 0)
      },
      
      getEstimatedTimeRemaining: () => {
        const active = get().getActiveDownloads()
        if (active.length === 0) return undefined
        
        const totalRemaining = active.reduce((sum, d) => {
          const remaining = d.bytesTotal - d.bytesDownloaded
          return sum + (remaining > 0 ? remaining : 0)
        }, 0)
        
        const avgSpeed = active.reduce((sum, d) => sum + (d.speed || 0), 0) / active.length
        
        return avgSpeed > 0 ? totalRemaining / avgSpeed : undefined
      },
      
      clearCompleted: () => {
        set((state) => ({
          downloads: state.downloads.filter((d) => d.status !== 'completed'),
        }))
      },
      
      clearFailed: () => {
        set((state) => ({
          downloads: state.downloads.filter((d) => d.status !== 'failed'),
        }))
      },
    }),
    {
      name: 'reel-reader-downloads',
      partialize: (state) => ({
        downloads: state.downloads.filter((d) => d.status !== 'downloading'), // Don't persist active downloads
        maxConcurrent: state.maxConcurrent,
        bandwidthLimit: state.bandwidthLimit,
        storageQuota: state.storageQuota,
      }),
    }
  )
)
