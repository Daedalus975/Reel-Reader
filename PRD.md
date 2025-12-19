# PRD: Reel Reader - Unified Media Library

## Product Vision
Reel Reader is a comprehensive, privacy-focused media library application that unifies all your digital media in one elegant interface. Whether it's movies, TV shows, music, books, podcasts, or photos, Reel Reader provides intelligent organization, rich metadata, and seamless playback/reading experiences across all formats.

## Core Value Proposition
- **One Library, All Media**: Manage movies, TV shows, music, books, podcasts, and photos in a single application
- **Smart Organization**: Collections, smart filters, tags, and franchise grouping keep massive libraries organized
- **Privacy First**: Adult content vaults, profile PINs, and local-first storage protect sensitive media
- **Rich Metadata**: Automatic metadata fetching from TMDB, OMDB, Spotify, Google Books, and more
- **Cross-Device**: Sync your library and progress across all your devices
- **Offline Ready**: Download media for offline access with intelligent queue management

---

## Primary User Personas

### Media Collector (Primary)
- Large local media collection (500+ GB)
- Values organization and metadata completeness
- Wants unified access without switching apps
- Needs adult content separation with privacy controls

### Streaming Augmenter (Secondary)
- Uses streaming services but has local media too
- Wants to track what they've watched across platforms
- Values reading progress sync for books
- Wants podcast subscriptions alongside music

### Power User (Tertiary)
- Advanced features: smart collections, automation, plugins
- Wants casting to TV/speakers
- Uses global hotkeys and keyboard shortcuts
- Needs multi-profile support for family sharing

---

## Feature Overview by Media Type

### 📽️ Movies & TV Shows
**Core Features**:
- Video player with playback controls, subtitles, audio tracks
- Watch progress tracking and resume
- Metadata from TMDB/OMDB (cast, crew, ratings, artwork)
- Collections and franchises (Marvel Cinematic Universe, Star Wars, etc.)
- Season/episode grouping for TV shows
- Continue Watching carousel

**Advanced Features**:
- DLNA/Chromecast casting
- Chapter markers and bookmarks
- Trivia overlays during playback
- Intro/credits skip detection
- Multiple video quality versions (SD/HD/4K)

### 🎵 Music & Audio
**Core Features**:
- Music player with queue management
- Playlists (manual and smart/rule-based)
- Album/artist library views
- Metadata from Spotify, MusicBrainz, Last.fm
- Spotify integration for streaming
- Audio visualizer with multiple modes
- Lyrics display (synced and unsynced)

**Advanced Features**:
- Crossfade and gapless playback
- ReplayGain normalization
- Equalizer presets
- Sleep timer
- M3U/M3U8 playlist import/export
- Global media key support

### 🎙️ Podcasts
**Core Features**:
- RSS feed subscriptions
- Automatic episode downloads
- Podcast player with chapter support
- Show notes and links display
- Playback speed control (0.5x-3x)
- Episode artwork and metadata

**Advanced Features**:
- Smart speed (silence removal)
- OPML import/export
- Auto-download new episodes
- Episode queue management
- Sleep timer

### 📚 Books & Reading
**Core Features**:
- EPUB/PDF/MOBI reader
- Reading progress tracking
- Font size, theme, and layout controls
- Page bookmarks
- Text highlights with colors
- Annotations and notes

**Advanced Features**:
- Dictionary lookup
- Text-to-speech (audiobook mode)
- Reading statistics
- Series detection and grouping
- Reading lists (to-read, currently-reading, finished)
- Goodreads integration (planned)

**Audiobooks**:
- Dedicated audiobook player
- Chapter navigation
- Narration speed control
- Sleep timer
- Bookmark timestamps

**Comics & Manga**:
- CBZ/CBR reader
- Page-by-page image viewer
- Reading direction (LTR/RTL for manga)
- Double-page spread mode
- Zoom and pan controls

### 📷 Photos & Albums
**Core Features** (Planned):
- Photo gallery with grid/timeline views
- Album creation and organization
- EXIF metadata display (camera, location, settings)
- Slideshow mode
- Photo import from folders/cameras

**Advanced Features** (Planned):
- Map view (photos by location)
- Face detection and tagging
- Duplicate photo detection
- Photo editing (crop, rotate, filters)
- Cloud backup integration

---

## Cross-Cutting Features

### Organization & Discovery
- **Smart Collections**: Rule-based auto-updating collections (e.g., "Unwatched Action Movies from 2020s")
- **Tags & Custom Fields**: User-defined organization system
- **Search**: Full-text search across all metadata fields
- **Filters**: Genre, year, rating, language, media type, watched status, favorites
- **Saved Views**: Persistent filter combinations for quick access
- **Franchises**: Group related media with custom viewing order

### Import & Scanning
- **Folder Scanning**: Recursive scan of local drives and network shares
- **Watch Folders**: Automatic detection of new media
- **Metadata Extraction**: Technical info (codecs, resolution, bitrate)
- **Duplicate Detection**: File hash-based deduplication
- **Batch Import**: Import hundreds of files with progress tracking
- **Manual Entry**: Add media without files (streaming, wish list)

### Metadata Management
- **Auto-Fetch**: Automatic metadata from TMDB, OMDB, Spotify, Google Books
- **Manual Match**: Search and select correct metadata when auto-match fails
- **Custom Artwork**: Upload your own posters/covers
- **Alternate Titles**: Support for localized and AKA titles
- **Lock Fields**: Prevent auto-updates from overwriting manual edits
- **Bulk Update**: Edit multiple items at once

### Profiles & Security
- **Multi-Profile**: Separate libraries per family member
- **Profile PINs**: Secure adult profiles with numeric PIN
- **Adult Content Vaults**: Encrypted storage for sensitive media
- **Guest Mode**: Restricted access without full library visibility
- **Profile Restrictions**: Age-based content filtering
- **Session Timeouts**: Auto-lock after inactivity

### Sync & Backup
- **Cross-Device Sync**: Cloud sync of library and progress (Firebase/Supabase)
- **Conflict Resolution**: Smart merge of changes from multiple devices
- **Backup/Restore**: Full library export with encryption
- **Scheduled Backups**: Automatic backup on schedule
- **Progress Sync**: Resume watching/reading on any device

### Downloads & Offline
- **Download Manager**: Queue with pause/resume/cancel
- **Scheduled Downloads**: Download during off-peak hours
- **Bandwidth Limiting**: Control download speed
- **Storage Quota**: Prevent disk overfill
- **Auto-Cleanup**: Remove old downloads automatically

### Casting & Devices
- **DLNA Casting**: Stream to smart TVs and speakers
- **Chromecast**: Cast to Chromecast devices
- **AirPlay**: Cast to Apple devices (planned)
- **Device Control**: Play/pause/seek on remote devices
- **Queue Sync**: Control queue from multiple devices

### Automation & Jobs
- **Background Jobs**: Metadata refresh, thumbnail generation, backups
- **Job Queue**: Retry with exponential backoff
- **Notifications**: Success/failure alerts with job history
- **Scheduled Tasks**: Cron-based automation
- **Plugin System**: Extend functionality with custom scripts (advanced)

---

## User Stories

### Movies & TV
- As a user, I can scan my movie collection and automatically fetch metadata, posters, and cast information
- As a user, I can resume watching from where I left off on any device
- As a user, I can create a "Marvel Cinematic Universe" franchise with custom viewing order
- As a user, I can cast a movie to my TV via DLNA/Chromecast
- As a user, I can hide adult movies in a PIN-protected vault

### Music
- As a user, I can play music from my local library or Spotify in the same player
- As a user, I can create smart playlists that auto-update based on rules (e.g., "Added this month + Rock")
- As a user, I can view lyrics synchronized with playback
- As a user, I can enable crossfade between tracks for seamless listening
- As a user, I can control playback with global media keys (desktop)

### Books & Podcasts
- As a user, I can read EPUBs with customizable fonts and themes
- As a user, I can highlight passages and add notes while reading
- As a user, I can subscribe to podcast RSS feeds and auto-download new episodes
- As a user, I can sync my reading progress across devices
- As a user, I can listen to audiobooks with chapter navigation

### Organization
- As a user, I can tag media and create collections to organize my library
- As a user, I can search across all my media by title, cast, genre, or tags
- As a user, I can see "Continue Watching" and "Recently Added" on my home page
- As a user, I can create smart collections that automatically include matching media
- As a user, I can bulk edit metadata for multiple items at once

---

## Technical Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand with persist middleware (11 stores)
- **Desktop**: Tauri (Rust backend for file system access)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Video**: Video.js
- **Audio**: HTML5 Audio + Web Audio API

### Key Stores
- `libraryStore` - Main media library state
- `profileStore` - User profiles and authentication
- `collectionsStore` - Collections and franchises
- `playlistsStore` - Music playlists
- `spotifyStore` / `spotifyPlaybackStore` - Spotify integration
- `downloadManagerStore` - Download queue
- `podcastStore` - Podcast feeds and episodes
- `bookStore` - Reading progress and e-reader state
- `castingStore` - DLNA/Chromecast sessions
- `vaultStore` - Encrypted vault management
- `cloudSyncStore` - Cross-device synchronization

### External APIs
- **TMDB**: Movie/TV metadata
- **OMDB**: Additional movie data
- **Spotify**: Music metadata and streaming
- **Google Books**: Book metadata
- **MusicBrainz**: Music metadata
- **Last.fm**: Artist info and album art
- **LRCLIB**: Synchronized lyrics

---

## Implementation Status

### ✅ Fully Implemented (Phase 1 Complete)
- Core library with 11 stores
- Movies & TV pages with metadata
- Music player with Spotify integration
- Playlists (manual & smart)
- Collections system
- Download manager
- Video player with controls
- Audio visualizer & lyrics
- E-reader (EPUB/PDF)
- Profile system
- Adult content vaults
- DLNA casting infrastructure
- Job queue with notifications
- Global hotkeys

### 🔄 Partially Implemented (Phase 2 In Progress)
- Podcast RSS parsing
- Metadata manual match UI
- Profile PIN enforcement
- Cloud sync backend
- Watch folders
- TV season/episode grouping
- Continue Watching UI

### 📋 Planned (Phase 3)
- Photo gallery
- Comic/manga reader
- Audiobook player
- Watch party (social viewing)
- Plugin system
- Intro/credits detection
- Thumbnail generation

**See `FEATURES_IMPLEMENTATION_STATUS.md` for detailed 200-feature tracking.**

---

## Metrics & Success Criteria

### Key Metrics
- **Library Size**: Total media items managed
- **Active Users**: Daily/weekly active profiles
- **Media Consumption**: Hours watched/listened/read
- **Import Success Rate**: % of scanned files with metadata matched
- **Sync Success**: % of cross-device syncs without conflicts
- **Feature Adoption**: Usage of collections, playlists, downloads, casting

### Success Criteria (6 Months)
- ✅ Support 10,000+ items in a single library without performance degradation
- ✅ 95%+ metadata match rate for common media formats
- ✅ Sub-second search across entire library
- ✅ Zero data loss during sync/backup operations
- ✅ Cross-device sync within 5 seconds of changes

---

## Rollout Plan

### Phase 1: Core Library (✅ Complete)
- Import and organize media
- Basic playback for all media types
- Collections and playlists
- Profile management

### Phase 2: Enhanced Experience (Current)
- Advanced metadata management
- Podcast integration
- Photo gallery
- Cloud sync

### Phase 3: Social & Advanced (Future)
- Watch party
- Plugin marketplace
- Advanced automation
- Mobile companion app

---

## See Also
- [FEATURES.md](FEATURES.md) - Feature list overview
- [OPTIONAL_FEATURES.md](OPTIONAL_FEATURES.md) - 200-feature catalog with Top 10 priorities
- [FEATURES_IMPLEMENTATION_STATUS.md](FEATURES_IMPLEMENTATION_STATUS.md) - Detailed implementation tracking
- [ROUTES.md](ROUTES.md) - Application routes and navigation
- [DB_SCHEMA.md](DB_SCHEMA.md) - Data models and storage
- [ROADMAP.md](ROADMAP.md) - Development phases
- [COMPONENTS.md](COMPONENTS.md) - Component architecture