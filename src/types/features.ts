// Extended types for optional features
// This file contains type definitions for features from the 200-feature catalog

import type { MediaType } from './index'

// Multi-resolution media (Feature #15)
export interface MediaVersion {
  id: string
  label: string // "SD", "HD", "4K", etc.
  resolution?: string
  filePath?: string
  fileSize?: number
  codec?: string
  isPreferred?: boolean
}

// Scene-based tags (Feature #40)
export interface SceneTag {
  id: string
  timestamp: number // seconds
  tags: string[]
  label?: string
  thumbnail?: string
}

// Metadata provider configuration (Feature #3-4)
export interface MetadataProvider {
  id: string
  name: string
  enabled: boolean
  priority: number // Lower = higher priority
  apiKey?: string
  baseUrl?: string
}

// Automation rules (Feature #101-110, #131-150)
export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  trigger: 'media.added' | 'media.updated' | 'scan.completed' | 'scheduled'
  conditions: RuleCondition[]
  actions: RuleAction[]
  schedule?: string // Cron expression for scheduled rules
  createdAt: Date
}

export interface RuleCondition {
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'matches'
  value: any
}

export interface RuleAction {
  type: 'tag' | 'move' | 'rename' | 'notify' | 'metadata' | 'collection'
  params: Record<string, any>
}

// Plugin system (Feature #111-120)
export interface Plugin {
  id: string
  name: string
  version: string
  enabled: boolean
  permissions: PluginPermission[]
  author?: string
  description?: string
  entryPoint: string // Script path
}

export interface PluginPermission {
  type: 'filesystem' | 'network' | 'database' | 'ui'
  scope: string
}

// Watch party (Feature #127-130)
export interface WatchParty {
  id: string
  hostId: string
  mediaId: string
  participants: string[]
  status: 'waiting' | 'playing' | 'paused' | 'ended'
  syncPosition: number
  createdAt: Date
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  userId: string
  text: string
  timestamp: Date
  reaction?: string
}

// Reading progress (Feature #81-110 - Books/Comics)
export interface ReadingProgress {
  mediaId: string
  location: string // Page number, EPUB location, etc.
  percent: number
  highlights?: Highlight[]
  annotations?: Annotation[]
  lastRead: Date
}

export interface Highlight {
  id: string
  text: string
  color?: string
  location: string
  createdAt: Date
}

export interface Annotation {
  id: string
  text: string
  location: string
  createdAt: Date
}

// Podcast-specific (Feature #81-90)
export interface PodcastFeed {
  id: string
  title: string
  feedUrl: string
  episodes: PodcastEpisode[]
  lastFetched: Date
  autoDownload?: boolean
}

export interface PodcastEpisode {
  id: string
  feedId: string
  title: string
  description?: string
  audioUrl: string
  duration?: number
  publishedAt: Date
  isPlayed?: boolean
  progress?: number
  downloadPath?: string
}

// Lyrics & Visualizer (Feature #156-160)
export interface Lyrics {
  mediaId: string
  source: string // 'genius', 'musixmatch', 'manual', etc.
  syncedLines?: LyricLine[]
  fullText?: string
}

export interface LyricLine {
  timestamp: number // milliseconds
  text: string
}

// Device authorization (Feature #50, #182-187)
export interface AuthorizedDevice {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet' | 'tv'
  lastSeen: Date
  isActive: boolean
  token: string
}

// Sync state (Feature #67-70, #177-180)
export interface SyncState {
  lastSyncAt: Date
  conflicts: SyncConflict[]
  pendingChanges: number
}

export interface SyncConflict {
  id: string
  type: 'media' | 'collection' | 'playlist' | 'progress'
  localVersion: any
  remoteVersion: any
  resolvedAt?: Date
}

// Storage analytics (Feature #67-70)
export interface StorageInfo {
  totalBytes: number
  usedBytes: number
  availableBytes: number
  mediaCount: number
  breakdown: Record<MediaType, number> // Bytes per media type
}

// Saved views & filters (Feature #14, #121-130)
export interface SavedView {
  id: string
  name: string
  filters: any // FilterOptions
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  layout?: 'grid' | 'list' | 'compact' | 'poster-wall'
  isDefault?: boolean
}

// Trivia & annotations (Feature #29)
export interface TriviaItem {
  id: string
  mediaId: string
  timestamp?: number // null for general trivia
  text: string
  source?: string
  createdAt: Date
}
