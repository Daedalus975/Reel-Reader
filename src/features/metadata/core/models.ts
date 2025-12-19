/**
 * Canonical Data Models (Section 3 of METADATA_PROVIDERS_SPEC.md)
 * 
 * Provider-agnostic models that represent media entities in Reel Reader.
 * All metadata from providers is normalized into these models.
 */

export type MediaType =
  | 'movie'
  | 'tv_series'
  | 'tv_episode'
  | 'music_track'
  | 'music_album'
  | 'music_artist'
  | 'book'
  | 'comic'
  | 'game'
  | 'podcast'
  | 'podcast_episode'
  | 'jav'
  | 'adult_video'
  | 'doujin'

export type RatingSource = 'user' | 'provider' | 'system'

export interface ExternalRef {
  providerId: string        // e.g., "tmdb", "musicbrainz", "openlibrary", "dmm"
  externalId: string        // provider-specific unique identifier
  url?: string
  isPrimary?: boolean       // the primary reference for this entity
}

export interface ImageAsset {
  url: string
  kind: 'poster' | 'backdrop' | 'cover' | 'thumbnail' | 'logo'
  width?: number
  height?: number
  language?: string
  score?: number            // internal ranking
  isUserOverride?: boolean  // locked by user
}

export interface PersonCredit {
  name: string
  role: 'actor' | 'director' | 'author' | 'artist' | 'developer' | 'publisher' | 'composer' | 'other'
  characterName?: string
  order?: number
  externalRefs?: ExternalRef[]
}

export interface CanonicalMediaBase {
  id: string                // Reel Reader canonical ID (UUID)
  mediaType: MediaType
  title: string
  altTitles?: string[]
  originalTitle?: string
  description?: string
  language?: string
  genres?: string[]
  tags?: string[]           // Reel Reader tags (user-defined)
  releaseDate?: string      // ISO date
  year?: number
  runtimeMinutes?: number
  images?: ImageAsset[]
  people?: PersonCredit[]
  externalRefs: ExternalRef[]
  providerAttribution?: string[] // for UI display (optional)

  // Adult controls (see section 10)
  isAdult?: boolean
  privacyLabel?: 'default' | 'private' | 'hidden'
  
  // User override tracking
  lockedFields?: string[]   // field paths that user has locked
  
  // Match tracking
  matchConfidence?: number  // 0-1 score
  matchMethod?: 'auto' | 'manual' | 'filename'
  needsReview?: boolean     // flagged for manual review
}

// Extended models for specific media types

export interface CanonicalMovie extends CanonicalMediaBase {
  mediaType: 'movie' | 'adult_video'
  studio?: string
  boxOffice?: number
  budget?: number
  country?: string
}

export interface CanonicalTVSeries extends CanonicalMediaBase {
  mediaType: 'tv_series'
  network?: string
  status?: 'returning' | 'ended' | 'canceled'
  numberOfSeasons?: number
  numberOfEpisodes?: number
}

export interface CanonicalTVEpisode extends CanonicalMediaBase {
  mediaType: 'tv_episode'
  seriesId: string          // reference to parent series
  seriesTitle: string
  seasonNumber: number
  episodeNumber: number
  airDate?: string
}

export interface CanonicalMusicTrack extends CanonicalMediaBase {
  mediaType: 'music_track'
  albumId?: string
  albumTitle?: string
  artistNames: string[]
  trackNumber?: number
  discNumber?: number
  durationSeconds?: number
  isrc?: string             // International Standard Recording Code
  lyrics?: string
}

export interface CanonicalMusicAlbum extends CanonicalMediaBase {
  mediaType: 'music_album'
  artistNames: string[]
  recordLabel?: string
  totalTracks?: number
  totalDiscs?: number
  upc?: string              // Universal Product Code
}

export interface CanonicalMusicArtist extends CanonicalMediaBase {
  mediaType: 'music_artist'
  bio?: string
  website?: string
  socialLinks?: Record<string, string>
}

export interface CanonicalBook extends CanonicalMediaBase {
  mediaType: 'book'
  authors: string[]
  publisher?: string
  isbn?: string
  isbn13?: string
  pageCount?: number
  seriesName?: string
  seriesOrder?: number
}

export interface CanonicalComic extends CanonicalMediaBase {
  mediaType: 'comic'
  publisher?: string
  issueNumber?: number
  seriesName?: string
  writers?: string[]
  artists?: string[]
  colorists?: string[]
  pageCount?: number
}

export interface CanonicalDoujin extends CanonicalMediaBase {
  mediaType: 'doujin'
  circle?: string           // doujin circle/studio
  event?: string            // e.g., "Comiket 99", "COMIC1"
  conventionId?: string
  parody?: string[]         // source works
  pageCount?: number
  galleryId?: string        // external gallery identifier
}

export interface CanonicalGame extends CanonicalMediaBase {
  mediaType: 'game'
  developers?: string[]
  publishers?: string[]
  platforms?: string[]
  esrbRating?: string
  multiplayer?: boolean
  metacriticScore?: number
}

export interface CanonicalPodcast extends CanonicalMediaBase {
  mediaType: 'podcast'
  feedUrl?: string
  website?: string
  hosts?: string[]
  frequency?: string        // e.g., "weekly", "daily"
  totalEpisodes?: number
}

export interface CanonicalPodcastEpisode extends CanonicalMediaBase {
  mediaType: 'podcast_episode'
  podcastId: string
  podcastTitle: string
  episodeNumber?: number
  seasonNumber?: number
  audioUrl?: string
  durationSeconds?: number
  explicit?: boolean
}

export interface CanonicalJAV extends CanonicalMediaBase {
  mediaType: 'jav'
  productCode?: string      // e.g., "IPX-123", "SSIS-456"
  studio?: string
  series?: string           // Series prefix (e.g., "IPX", "SSIS")
  explicit: true            // Always explicit content
}

// Union type for all canonical media
export type CanonicalMedia =
  | CanonicalMovie
  | CanonicalTVSeries
  | CanonicalTVEpisode
  | CanonicalMusicTrack
  | CanonicalMusicAlbum
  | CanonicalMusicArtist
  | CanonicalBook
  | CanonicalComic
  | CanonicalDoujin
  | CanonicalGame
  | CanonicalPodcast
  | CanonicalPodcastEpisode
  | CanonicalJAV
