export type SourceType = 'folder' | 'external-drive' | 'smb' | 'ftp'

export interface Source {
  id: string
  name: string
  type: SourceType
  path: string
  enabled: boolean
  createdAt: string
  updatedAt?: string
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
