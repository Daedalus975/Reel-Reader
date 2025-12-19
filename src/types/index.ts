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

// Import extended types from features
import type { MediaVersion, SceneTag } from './features'

export interface Media {
  id: string
  title: string
  type: MediaType
  year?: number
  genres: string[]
  rating?: number
  myRating?: number
  language: string
  poster?: string
  backdrop?: string
  description?: string
  isAdult: boolean
  tags: string[]
  tagColors?: Record<string, string>
  watched?: boolean
  progress?: number
  dateAdded: Date
  isFavorite: boolean
  customFields?: Record<string, string>
  
  // Local file linking
  filePath?: string
  fileHash?: string // SHA256 hash for duplicate detection
  
  // Preview/Trailer links
  trailerUrl?: string // YouTube trailer for movies/TV, music video for music
  previewUrl?: string // Google Books preview, audio sample clip, etc.
  
  // Extracted metadata
  duration?: number // seconds (video/audio)
  fileSize?: number // bytes
  codec?: string // video codec
  audioCodec?: string // audio codec (AAC, MP3, DTS, etc.)
  videoCodec?: string // video codec (H.264, H.265, VP9, AV1, etc.)
  resolution?: string // e.g., "1920x1080"
  aspectRatio?: string // e.g., "16:9", "2.39:1"
  frameRate?: number // fps (23.976, 24, 25, 29.97, 30, 60, etc.)
  bitrate?: number // overall bitrate kbps
  videoBitrate?: number // video bitrate kbps
  audioBitrate?: number // audio bitrate kbps
  audioChannels?: string // e.g., "2.0", "5.1", "7.1", "Atmos"
  hdr?: string // HDR format: "HDR10", "HDR10+", "Dolby Vision", "HLG"
  colorSpace?: string // "BT.709", "BT.2020", etc.
  bitDepth?: number // 8, 10, 12 bit
  subtitleTracks?: string[] // Available subtitle languages
  audioTracks?: string[] // Available audio languages
  
  // Movies & TV Shows - Core metadata
  originalTitle?: string // Original language title
  sortTitle?: string // Title for sorting (e.g., "Matrix, The")
  tagline?: string // Movie tagline/slogan
  directors?: string[] // Director(s)
  writers?: string[] // Writer(s), screenwriter(s)
  producers?: string[] // Producer(s)
  cast?: CastMember[] // Actor/character list
  studios?: string[] // Production studios
  networks?: string[] // TV networks
  productionCompanies?: string[]
  distributors?: string[]
  countries?: string[] // Production countries
  spokenLanguages?: string[] // All spoken languages in content
  releaseDate?: string // ISO date string
  premiereDate?: string // First air date for TV
  endDate?: string // Series end date for TV
  budget?: number // Production budget in USD
  revenue?: number // Box office revenue in USD
  runtime?: number // Runtime in minutes (redundant with duration but commonly used)
  
  // Movies & TV Shows - Ratings & Certifications
  imdbId?: string
  tmdbId?: string
  tvdbId?: string
  rottenTomatoesId?: string
  metacriticId?: string
  imdbRating?: number
  tmdbRating?: number
  rottenTomatoesRating?: number // Tomatometer score
  rottenTomatoesAudienceScore?: number
  metacriticScore?: number
  certification?: string // MPAA rating: "G", "PG", "PG-13", "R", "NC-17", etc.
  contentRating?: string // TV rating: "TV-Y", "TV-PG", "TV-14", "TV-MA", etc.
  advisories?: string[] // Content warnings: "violence", "nudity", "language", etc.
  
  // Movies & TV Shows - Series information
  seasonNumber?: number // TV season number
  episodeNumber?: number // TV episode number
  episodeCount?: number // Total episodes in season/series
  seasonCount?: number // Total seasons
  seriesId?: string // Parent series ID for episodes
  nextEpisodeId?: string // Next episode in series
  previousEpisodeId?: string // Previous episode
  status?: 'returning' | 'ended' | 'canceled' | 'in-production' | 'planned'
  
  // Movies & TV Shows - Enhanced metadata
  movieAwards?: Award[] // Awards and nominations (renamed to avoid conflict)
  keywords?: string[] // Plot keywords/themes
  trivia?: string[] // Fun facts
  goofs?: string[] // Mistakes/continuity errors
  quotes?: string[] // Memorable quotes
  soundtrack?: string[] // Featured music
  filmingLocations?: string[]
  cinematographer?: string
  videoEditor?: string // Renamed to avoid conflict with book editor
  composer?: string // Music composer
  productionDesigner?: string
  costumeDesigner?: string
  
  // Music-specific metadata
  artist?: string // main artist/performer
  artists?: string[] // All artists (for collaborations)
  albumArtist?: string // album artist (may differ from track artist)
  album?: string // album name
  trackNumber?: number // track position in album
  trackCount?: number // total tracks in album
  discNumber?: number // disc number for multi-disc albums
  discCount?: number // total discs in album
  compilation?: boolean // Is this a compilation album?
  playCount?: number // number of times played
  skipCount?: number // number of times skipped
  lastPlayed?: Date
  releaseYear?: number
  originalReleaseYear?: number
  recordLabel?: string // Record label
  publisher?: string // Music publisher
  bpm?: number // tempo in beats per minute
  key?: string // Musical key (C Major, A Minor, etc.)
  timeSignature?: string // e.g., "4/4", "3/4", "6/8"
  isrc?: string // International Standard Recording Code
  upc?: string // Universal Product Code (album)
  catalogNumber?: string
  audioFormat?: string // e.g., "mp3", "flac", "aac", "alac", "wav"
  sampleRate?: number // Hz (44100, 48000, 96000, 192000, etc.)
  channels?: number // 1 (mono), 2 (stereo), 6 (5.1), etc.
  mood?: string // e.g., "energetic", "calm", "sad"
  style?: string // Music style/subgenre
  lyrics?: string // Full lyrics text
  lyricist?: string // Lyrics writer
  arranger?: string
  conductor?: string
  engineer?: string // Recording engineer
  mixer?: string // Mixing engineer
  masterer?: string // Mastering engineer
  recordingDate?: string
  recordingLocation?: string
  chartPeak?: number // Highest chart position
  chartPeakCountry?: string
  goldCertification?: boolean
  platinumCertification?: boolean
  spotifyTrackId?: string
  spotifyAlbumId?: string
  appleMusicId?: string
  youtubeVideoId?: string
  soundcloudUrl?: string
  
  // Books - Core metadata
  isbn?: string // ISBN-10
  isbn13?: string // ISBN-13
  asin?: string // Amazon ASIN
  authors?: string[] // Author(s)
  illustrators?: string[]
  translator?: string
  bookEditor?: string // Renamed to avoid conflict with video editor
  narrator?: string // For audiobooks
  bookPublisher?: string
  publicationDate?: string
  edition?: string
  pageCount?: number
  wordCount?: number
  chapterCount?: number
  bookFormat?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook' | 'comic' | 'manga'
  dimensions?: string // Physical dimensions
  weight?: number // grams
  seriesName?: string // Book series name
  seriesPosition?: number // Position in series
  volumeNumber?: number // Volume number
  deweyDecimal?: string // Dewey Decimal Classification
  lcc?: string // Library of Congress Classification
  lexileScore?: number // Lexile reading level
  ageRange?: string // Target age range
  readingLevel?: string // Grade level
  bookLanguage?: string // Original language
  translatedFrom?: string // Original language if translated
  printLength?: number // Number of pages
  listenLength?: number // Audiobook duration in minutes
  subjects?: string[] // Subject categories
  bookAwards?: Award[] // Renamed to avoid conflict with movie awards
  
  // Comics & Manga specific
  comicIssue?: number
  comicVolume?: number
  comicSeries?: string
  comicPublisher?: string
  penciller?: string
  inker?: string
  colorist?: string
  letterer?: string
  coverArtist?: string
  
  // Podcasts - Core metadata
  podcastShow?: string // Podcast show name
  podcastEpisode?: string // Episode title
  podcastSeason?: number
  podcastEpisodeNumber?: number
  podcastHost?: string[]
  podcastGuests?: string[]
  podcastNetwork?: string
  podcastCategory?: string[]
  explicit?: boolean
  rssUrl?: string
  websiteUrl?: string
  
  // Adult content - Additional metadata
  adultStudio?: string // Production studio
  adultSeries?: string // Series name
  adultCode?: string // Product code (e.g., JAV codes)
  adultPerformers?: string[] // Performers/actors
  adultDirector?: string
  adultCategories?: string[] // Specific categories
  adultRuntime?: number // minutes
  adultReleaseDate?: string
  adultMaker?: string // Maker/brand
  adultLabel?: string
  
  // Doujinshi-specific metadata (nhentai/hitomi/dlsite style)
  galleryId?: string // Gallery/work ID from source site
  parodies?: string[] // Parodied series/franchises
  characters?: string[] // Character names
  groups?: string[] // Circle/group names
  doujinLanguages?: string[] // Available languages (translated, english, japanese, etc.)
  doujinCategories?: string[] // Categories (doujinshi, manga, artist cg, etc.)
  pageCount?: number // Number of pages
  favoriteCount?: number // Favorites on source site
  uploadedAt?: Date // Upload date from source
  scanlator?: string // Translation/scanning group
  
  // Enhanced Features
  altTitles?: AlternativeTitle[] // Alternative/AKA titles
  franchiseId?: string // Franchise grouping
  collectionIds?: string[] // Collection memberships
  viewCount?: number // View count tracking
  lastViewedAt?: Date // Last watch timestamp
  vaultId?: string // Vault encryption
  isHidden?: boolean // Hidden/archived items
  privacyLabel?: 'private' | 'hidden' | 'public'
  versions?: MediaVersion[] // Multi-resolution versions
  externalIds?: Record<string, string> // External IDs (TMDB, IMDB, etc.)
  metadataLocked?: boolean // Prevent metadata overwrites
  lockedFields?: string[] // Specific fields locked by user edits
  notes?: string // Personal annotations
  userRating?: number // Custom rating per profile
  sceneTags?: SceneTag[] // Scene-based tags with timestamps
  is3D?: boolean // 3D video support
  
  // Artwork & Media
  posterUrl?: string // High-res poster URL
  backdropUrl?: string // High-res backdrop URL
  thumbnails?: string[] // Additional thumbnails
  fanart?: string[] // Fan art URLs
  banner?: string
  logo?: string
  clearart?: string
  characterArt?: string[]
  screenshots?: string[]
  
  // User tracking & stats
  addedBy?: string // User who added this
  lastModified?: Date
  modifiedBy?: string
  timesWatched?: number
  totalWatchTime?: number // Total seconds watched (for partial views)
  averageRating?: number // Average from all profiles
  popularityScore?: number // Calculated popularity metric
  trendingScore?: number
  
  // Import & Source tracking
  importSource?: string // Where it was imported from
  importDate?: Date
  sourceUrl?: string // Original source URL
  sourceMetadata?: Record<string, any> // Raw metadata from source
  
  // Quality & Technical flags
  hasSubtitles?: boolean
  hasClosedCaptions?: boolean
  hasDolbyAtmos?: boolean
  hasDolbyVision?: boolean
  hasHDR10Plus?: boolean
  hasIMAXEnhanced?: boolean
  has4K?: boolean
  hasHDR?: boolean
  losslessAudio?: boolean
  remuxSource?: boolean
  
  // Accessibility
  hasAudioDescription?: boolean
  hasSignLanguage?: boolean
  accessibilityFeatures?: string[]
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
  pinHash?: string // For profile PIN lock (Feature #41)
  sessionTimeout?: number // Minutes before auto-logout (Feature #42)
  restrictions?: ProfileRestrictions // Parental controls (Feature #46)
}

export interface ProfileRestrictions {
  maxRating?: number
  allowedTypes?: MediaType[]
  timeLimit?: number // Daily minutes limit (Feature #38)
  timeUsed?: number // Today's usage
}

// Download Manager (Feature #61-63)
export interface Download {
  id: string
  mediaId: string
  url: string
  filePath?: string
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  bytesDownloaded: number
  bytesTotal: number
  speed?: number // bytes/sec
  error?: string
  scheduledFor?: Date
  createdAt: Date
  completedAt?: Date
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

// Collections & Franchises (Features #3, #6, #8)
export interface Collection {
  id: string
  name: string
  type: 'manual' | 'smart' | 'boxset' | 'franchise'
  itemIds: string[]
  sortOrder?: string[] // Manual sort order of itemIds
  rules?: SmartCollectionRule[] // For smart collections
  poster?: string
  description?: string
  createdAt: Date
  updatedAt?: Date
}

export interface SmartCollectionRule {
  field: keyof Media
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in'
  value: any
}

export interface Franchise {
  id: string
  name: string
  itemIds: string[]
  customOrder?: string[] // Custom chronological/viewing order
  poster?: string
}

// Alternative titles (Feature #4)
export interface AlternativeTitle {
  title: string
  language?: string
  type?: 'original' | 'localized' | 'aka' | 'working' | 'festival' | 'dvd' | 'tv'
  country?: string
}

// Cast member with detailed info
export interface CastMember {
  name: string
  character?: string
  role?: 'actor' | 'voice' | 'guest' | 'host'
  order?: number // Billing order
  profileImage?: string
  tmdbId?: string
  imdbId?: string
}

// Award information
export interface Award {
  name: string // "Academy Award", "Grammy", etc.
  category: string // "Best Picture", "Best Actor", etc.
  year?: number
  result: 'won' | 'nominated' | 'honorable-mention'
  recipient?: string // Person who received the award
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
  sidebarEdgeOpenEnabled: boolean
  mediaViewMode?: 'grid' | 'list' | 'compact' | 'poster-wall' // Enhanced views (Feature #121-130)
  mediaCardSize?: 'xs' | 'sm' | 'md' | 'lg'

  // Player foldout state
  playerOpen?: boolean
  playerEdgeOpenEnabled?: boolean
  debugMode?: boolean // Debug mode toggle (existing)
}

// Casting (Feature #64-66)
export interface CastDevice {
  id: string
  name: string
  type: 'dlna' | 'chromecast' | 'airplay'
  status: 'available' | 'connected' | 'busy'
  ipAddress?: string
}

export interface CastSession {
  id: string
  deviceId: string
  mediaId: string
  status: 'connecting' | 'playing' | 'paused' | 'stopped'
  position: number
}

// Playlists (Feature #71-80)
export interface Playlist {
  id: string
  name: string
  type: 'manual' | 'smart'
  trackIds: string[]
  rules?: SmartCollectionRule[]
  createdAt: Date
  updatedAt?: Date
}

// Vault & Encryption (Feature #49)
export interface Vault {
  id: string
  name: string
  sourceIds: string[]
  isLocked: boolean
  keyRef: string // Reference to encryption key
  createdAt: Date
}

// Bookmarks & Chapters (Feature #28, #34)
export interface Bookmark {
  id: string
  mediaId: string
  timestamp: number // seconds
  label?: string
  createdAt: Date
}

export interface Chapter {
  id: string
  mediaId: string
  startTime: number // seconds
  endTime?: number
  title: string
  thumbnail?: string
  userGenerated?: boolean // Feature #34
}

// Social & Reviews (Feature #91-130)
export interface Review {
  id: string
  mediaId: string
  userId: string
  rating: number
  text: string
  spoiler?: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface ShareLink {
  id: string
  type: 'collection' | 'playlist' | 'media'
  targetId: string
  createdBy: string
  expiresAt?: Date
  createdAt: Date
}

// Playback State Extensions (Features #21-40)
export interface PlaybackState {
  mediaId?: string
  position: number // seconds
  duration: number
  isPlaying: boolean
  volume: number
  rate: number // playback speed
  audioTrack?: number
  subtitleTrack?: number
  subtitleOffset?: number // Feature #33
  loopMode?: 'none' | 'one' | 'all' | 'chapter' | 'segment' // Feature #23
  aspectRatio?: string // Feature #35
  bookmarks?: Bookmark[]
  chapters?: Chapter[]
}
