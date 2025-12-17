// Media Types
// Added 'jav' and 'doujinshi' for specialized adult and fan-made publications
export type MediaType =
  | 'movie'
  | 'tv'
  | 'music'
  | 'book'
  | 'photo'
  | 'podcast'
  | 'adult'
  | 'jav'
  | 'doujinshi'

export interface Media {
  id: string
  title: string
  type: MediaType
  year?: number
  genres: string[]
  rating?: number
  language: string
  poster?: string
  backdrop?: string
  description?: string
  isAdult: boolean
  tags: string[]
  watched?: boolean
  progress?: number
  dateAdded: Date
  isFavorite: boolean
  customFields?: Record<string, string>
  
  // Local file linking
  filePath?: string
  
  // Preview/Trailer links
  trailerUrl?: string // YouTube trailer for movies/TV, music video for music
  previewUrl?: string // Google Books preview, sample clip, etc.
  
  // Extracted metadata
  duration?: number // seconds (video/audio)
  fileSize?: number // bytes
  codec?: string // video codec
  resolution?: string // e.g., "1920x1080"
  bitrate?: number // audio bitrate kbps
  isbn?: string // books
}

export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  adultContentEnabled: boolean
  profiles: Profile[]
  createdAt: Date
}

export interface Profile {
  id: string
  name: string
  avatar?: string
  adultContentEnabled: boolean
  isDefault: boolean
}

export interface FilterOptions {
  genre?: string
  language?: string
  rating?: number
  type?: MediaType
  watched?: boolean
  isFavorite?: boolean
  searchQuery?: string
  isAdult?: boolean
}

export interface LibraryState {
  media: Media[]
  filteredMedia: Media[]
  filters: FilterOptions
  isLoading: boolean
  error?: string
}

export interface UIState {
  sidebarOpen: boolean
  darkMode: boolean
  selectedMediaId?: string
  currentPage: string
}
