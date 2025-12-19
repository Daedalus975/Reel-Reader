export type SourceType = 'folder' | 'external-drive' | 'smb' | 'ftp' | 'sftp' | 'cloud-mount'

export interface Source {
  id: string
  name: string
  type: SourceType
  path: string
  enabled: boolean
  createdAt: string
  updatedAt?: string
  
  // Network credentials (Features #1-2)
  credentials?: {
    username?: string
    password?: string // Should be encrypted in production
    domain?: string // For SMB
    privateKey?: string // For SFTP
  }
  
  // Watch settings (Feature #2)
  watchEnabled?: boolean
  watchInterval?: number // Minutes between scans
  
  // Scheduling (Feature #2)
  scanSchedule?: string // Cron expression
  lastScan?: string
  nextScan?: string
  
  // Filters & rules (Feature #51-60)
  ignorePatterns?: string[] // Glob patterns to ignore
  includePatterns?: string[] // Only scan matching patterns
  
  // Profile association
  profileId?: string // Optional: restrict source to specific profile
}

// Persistence layer placeholder. Implement persistence via DB in next iteration.
export const SourceStore = {
  key: 'reel_reader_sources',
  getAll: (): Source[] => {
    try {
      const raw = localStorage.getItem(SourceStore.key)
      if (!raw) return []
      return JSON.parse(raw) as Source[]
    } catch {
      return []
    }
  },
  saveAll: (sources: Source[]) => {
    localStorage.setItem(SourceStore.key, JSON.stringify(sources))
  },
  add: (s: Source) => {
    const all = SourceStore.getAll()
    all.push(s)
    SourceStore.saveAll(all)
  },
}
