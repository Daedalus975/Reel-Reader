# 🎯 Reel Reader - Implementation TODO

**Last Updated**: December 18, 2025  
**Status**: 85% Complete - Core infrastructure solid, specific media type implementations needed

---

## 📊 Quick Overview

| Category | Status | Priority |
|----------|--------|----------|
| Photo Gallery | ❌ Not Started | 🔥 CRITICAL |
| Comic/Manga Reader | 🔄 Partial (30%) | 🔥 CRITICAL |
| Podcast RSS Parser | 🔄 Partial (20%) | ⭐ HIGH |
| Audiobook Player | 🔄 Partial (40%) | ⭐ HIGH |
| Metadata Integration | 🔄 Partial (60%) | ⭐ HIGH |
| Profile PIN UI | 🔄 Partial (70%) | ⭐ HIGH |
| TV Series Grouping | ❌ Not Started | ⭐ HIGH |
| Continue Watching | ❌ Not Started | ⭐ HIGH |
| Cloud Sync Backend | 🔄 Partial (10%) | 💎 MEDIUM |
| Watch Party | 🔄 Partial (30%) | 💎 MEDIUM |
| Plugin System | 🔄 Partial (20%) | 💎 MEDIUM |
| Photo Scanning | ❌ Not Started | 🔥 CRITICAL |
| Tag Management UI | ❌ Not Started | ⭐ HIGH |
| Library Statistics | ❌ Not Started | 💎 MEDIUM |
| Custom Libraries | ❌ Not Started | ⭐ HIGH |
| CSV Import/Export | ❌ Not Started | ⭐ HIGH |
| JAV/Hentai/Doujin Metadata | 🔄 Partial (40%) | 💎 MEDIUM |
| Dynamic Card Scaling Slider | ❌ Not Started | 💎 MEDIUM |
| Metadata Auto-Fetch + Update | 🔄 Partial (50%) | ⭐ HIGH |
| Ratings System | 🔄 Partial (60%) | 💎 MEDIUM |
| Transparent Menu Styling | ❌ Not Started | 🎨 LOW |

---

## 🔥 TIER 1: CRITICAL (Must Fix)

### 1. Photo Gallery - COMPLETELY MISSING ❌
**Status**: Type exists but ZERO implementation  
**Priority**: CRITICAL - Listed in MediaType but not functional

**Files to Create**:
- [ ] `src/pages/Photos.tsx` - Main photo gallery page
- [ ] `src/components/PhotoViewer.tsx` - Full-screen image viewer with EXIF
- [ ] `src/components/PhotoGrid.tsx` - Responsive photo grid
- [ ] `src/components/AlbumManager.tsx` - Create/edit albums
- [ ] `src/components/AlbumGrid.tsx` - Album thumbnail grid
- [ ] `src/services/exifExtractor.ts` - Extract EXIF metadata from photos

**Files to Modify**:
- [ ] `src/features/import/importScanner.ts` - Add photo extensions and scanning
  - Add: `const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'heic', 'raw', 'cr2', 'nef', 'webp', 'gif', 'bmp', 'tiff']`
  - Add photo detection to `looksLikeMedia()` function
- [ ] `src/types/index.ts` - Add photo-specific metadata fields
  - Add: `cameraMake`, `cameraModel`, `lens`, `focalLength`, `aperture`, `shutterSpeed`, `iso`, `gpsLatitude`, `gpsLongitude`, `dateTaken`
- [ ] `src/pages/Library.tsx` - Add Photos to filter options
  - Add `{ label: 'Photos', type: 'photo' }` to MEDIA_TYPES array
- [ ] `src/components/SidebarMenu.tsx` - Add Photos menu item
  - Add: `{ label: 'Photos', icon: <Image size={20} />, path: '/photos' }`
- [ ] `src/App.tsx` - Add photos route
  - Add: `<Route path="/photos" element={<Photos />} />`

**Implementation Steps**:
1. Update scanner to recognize photo files
2. Create basic PhotosPage with grid layout
3. Add EXIF extraction service
4. Create PhotoViewer component (full screen, zoom, pan)
5. Add album creation/management
6. Add to navigation and routing

**Acceptance Criteria**:
- ✅ Can import photos from folders
- ✅ Can view photos in grid and full-screen
- ✅ EXIF data displayed (camera, date, location)
- ✅ Can create and organize albums
- ✅ Photos appear in Library with filter
- ✅ Photos accessible from sidebar

---

### 2. Comic/Manga Reader - INCOMPLETE ⚠️
**Status**: Types exist, EReader has TODO for implementation  
**Priority**: CRITICAL - bookFormat includes 'comic'|'manga' but no reader

**Current File**:
- `src/components/EReader.tsx` (line ~50) - Has TODO: "Load actual book content (EPUB/PDF/CBZ/CBR)"

**Files to Create**:
- [ ] `src/components/ComicReader.tsx` - Dedicated comic/manga reader
- [ ] `src/services/comicExtractor.ts` - Extract images from CBZ/CBR archives

**Files to Modify**:
- [ ] `src/components/EReader.tsx` - Add comic rendering or redirect to ComicReader
  - Detect if book format is 'comic' or 'manga'
  - Use image-based rendering instead of text reflow
  - Add page navigation (not chapter navigation)

**Implementation Steps**:
1. Install archive extraction library: `npm install jszip`
2. Create comicExtractor service (CBZ = ZIP, CBR = RAR)
3. Build ComicReader component:
   - Image-only rendering (no text reflow)
   - Page-by-page navigation (not scrolling)
   - Zoom and pan controls
   - Reading direction toggle (LTR for western, RTL for manga)
   - Double-page spread mode
   - Fit-width / Fit-height options
4. Update EReader to detect comic format and use ComicReader
5. Add comic-specific controls to reader UI

**Acceptance Criteria**:
- ✅ Can open CBZ files and view pages
- ✅ Page navigation works (prev/next)
- ✅ Zoom/pan controls functional
- ✅ RTL mode for manga
- ✅ Double-page spread works
- ✅ Reading progress saved per page

**Known TODOs**:
- `src/components/EReader.tsx:50` - "Load EPUB/PDF using epub.js or pdf.js"
- `src/components/EReader.tsx:120` - "Render actual book content"

---

### 3. Photo Scanning - NOT IMPLEMENTED ❌
**Status**: Scanner doesn't recognize photo files  
**Priority**: CRITICAL - Required for photo gallery to work

**Current File**:
- `src/features/import/importScanner.ts` - Only scans video/audio/book

**Implementation**:
```typescript
// Add to importScanner.ts after line 5:
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'heic', 'raw', 'cr2', 'nef', 'webp', 'gif', 'bmp', 'tiff', 'dng', 'arw', 'orf']

// Update looksLikeMedia function to include:
return VIDEO_EXT.includes(ext) || AUDIO_EXT.includes(ext) || BOOK_EXT.includes(ext) || PHOTO_EXT.includes(ext)
```

**Metadata Extraction**:
- Install: `npm install exif-parser` or use native APIs
- Extract: Camera make/model, lens, focal length, aperture, ISO, shutter speed, GPS coordinates, date taken
- Store in Media interface photo-specific fields

---

## ⭐ TIER 2: HIGH PRIORITY

### 4. Podcast RSS Parser - UNIMPLEMENTED 🔄
**Status**: Store exists, all RSS methods are TODO  
**Priority**: HIGH - Core podcast functionality

**Current File**:
- `src/store/podcastStore.ts` - Lines 100-200 have TODOs

**Known TODOs**:
- Line 95: "TODO: Parse RSS feed XML and extract metadata"
- Line 130: "TODO: Fetch and parse RSS feed for new episodes"
- Line 180: "TODO: Integrate with download manager for episode files"

**Implementation Steps**:
1. Install: `npm install rss-parser`
2. Create `src/services/rssParser.ts`:
   ```typescript
   import Parser from 'rss-parser'
   export async function parseRSSFeed(url: string): Promise<PodcastFeed>
   export async function fetchEpisodes(feedUrl: string): Promise<PodcastEpisode[]>
   ```
3. Update podcastStore methods:
   - `subscribeToPodcast()` - Call parseRSSFeed
   - `refreshFeed()` - Fetch new episodes
   - `autoDownloadEpisode()` - Integrate with downloadManagerStore
4. Create PodcastPlayer component (different from MusicPlayerBar):
   - Show notes display
   - Episode artwork
   - Chapter support
   - Speed controls (0.5x-3x)
5. Add OPML import/export for subscriptions

**Acceptance Criteria**:
- ✅ Can subscribe to RSS feeds
- ✅ Episodes auto-fetch on schedule
- ✅ Episode metadata displayed
- ✅ Can download episodes
- ✅ Playback with speed control
- ✅ OPML import/export works

---

### 5. Audiobook Player - NO UI ⚠️
**Status**: Types exist, uses generic music player  
**Priority**: HIGH - Audiobooks need different UX than music

**Current Situation**:
- Audiobook files play through MusicPlayerBar
- No differentiation from regular music
- Chapter navigation missing

**Files to Create**:
- [ ] `src/components/AudiobookPlayer.tsx` - Dedicated audiobook player

**Implementation Steps**:
1. Create AudiobookPlayer component:
   - Prominent chapter navigation
   - Sleep timer (10min, 15min, 30min, 1hr)
   - Narration speed (0.5x-3x with 0.1x increments)
   - Bookmark current position
   - Show total listening time
   - Resume from last position
2. Update routing to detect audiobook format and use AudiobookPlayer
3. Extract chapters from M4B metadata or audiobook-specific formats
4. Add to bookStore for progress tracking

**Acceptance Criteria**:
- ✅ Audiobooks open in dedicated player
- ✅ Chapter navigation works
- ✅ Sleep timer functional
- ✅ Narration speed adjustable
- ✅ Bookmarks save timestamps
- ✅ Progress syncs across devices

---

### 6. Metadata Manual Match - INCOMPLETE 🔄
**Status**: Modal created, provider integration incomplete  
**Priority**: HIGH - Users need to fix incorrect matches

**Current File**:
- `src/components/ManualMetadataMatchModal.tsx` - Line 24 has TODO

**Known TODOs**:
- Line 24: "TODO: Integrate with TMDB/OMDB/MusicBrainz/Google Books APIs"

**Implementation Steps**:
1. Complete provider integrations:
   - TMDB for movies/TV (service exists at `src/services/tmdb.ts`)
   - OMDB fallback
   - MusicBrainz for music (service exists at `src/services/musicbrainz.ts`)
   - Google Books (service exists at `src/services/googleBooks.ts`)
2. Add search UI with provider tabs
3. Display search results with thumbnails
4. Apply selected metadata to media item
5. Mark metadata as "locked" to prevent auto-overwrite

**Acceptance Criteria**:
- ✅ Can search each provider from modal
- ✅ Results show with artwork
- ✅ Can select and apply metadata
- ✅ Locked metadata doesn't get overwritten
- ✅ Works for all media types

---

### 7. Profile PIN Enforcement - NOT INTEGRATED 🔄
**Status**: ProfilePinModal created, not used anywhere  
**Priority**: HIGH - Security feature not functional

**Current Files**:
- `src/components/ProfilePinModal.tsx` - Component exists
- `src/store/profileStore.ts` - Has verifyPin() method
- Profile types have `pinHash` field

**Files to Modify**:
- [ ] `src/pages/Adult.tsx` - Add PIN check before rendering
- [ ] `src/pages/AdultMovies.tsx` - Add PIN check
- [ ] `src/pages/AdultBooks.tsx` - Add PIN check
- [ ] `src/App.tsx` - Add profile selector at startup
- [ ] `src/components/HeaderBar.tsx` - Add "Switch Profile" option

**Implementation Steps**:
1. Add profile selector at app startup (if multiple profiles)
2. Check if accessing adult content requires PIN
3. Show ProfilePinModal before allowing access
4. Add "Switch Profile" to header dropdown
5. Lock session after inactivity (use sessionTimeout from profile)
6. Show profile indicator in header (avatar or name)

**Acceptance Criteria**:
- ✅ Profile selector shows on startup
- ✅ PIN required for adult content
- ✅ Can switch profiles from header
- ✅ Session locks after timeout
- ✅ Failed PIN attempts logged

---

### 8. TV Series Grouping - NOT IMPLEMENTED ❌
**Status**: No season/episode organization  
**Priority**: HIGH - TV shows display poorly without structure

**Files to Create**:
- [ ] `src/components/TVSeriesView.tsx` - Season/episode grid
- [ ] `src/components/SeasonSelector.tsx` - Season tabs/dropdown
- [ ] `src/components/EpisodeCard.tsx` - Episode card with thumbnail

**Files to Modify**:
- [ ] `src/pages/Detail.tsx` - Detect TV show and use TVSeriesView
- [ ] `src/types/index.ts` - Add series-specific fields:
  - `tvShowId` - Link episodes to show
  - `seasonNumber` - Season number
  - `episodeNumber` - Episode number within season
  - `totalSeasons` - Total seasons in series
  - `totalEpisodes` - Total episodes in season

**Implementation Steps**:
1. Add TV-specific metadata fields to Media interface
2. Create TVSeriesView component:
   - Season selector (tabs or dropdown)
   - Episode grid per season
   - Episode thumbnails with progress overlay
   - "Next Episode" suggestion
3. Update Detail page to detect `type === 'tv'` and render TVSeriesView
4. Fetch season/episode data from TMDB
5. Track watch progress per episode

**Acceptance Criteria**:
- ✅ TV shows display in season/episode structure
- ✅ Can navigate between seasons
- ✅ Episode cards show thumbnails and progress
- ✅ "Next Episode" auto-suggests
- ✅ Can mark entire season as watched

---

### 9. Continue Watching - NOT IMPLEMENTED ❌
**Status**: Progress tracking exists, no UI  
**Priority**: HIGH - Key discovery feature

**Files to Create**:
- [ ] `src/components/ContinueWatching.tsx` - Carousel component

**Files to Modify**:
- [ ] `src/pages/Home.tsx` - Add ContinueWatching section
- [ ] Add recently added section
- [ ] Add quick stats section

**Implementation Steps**:
1. Query media with `progress > 0 && progress < 100`
2. Sort by `lastViewedAt` descending
3. Create horizontal scrolling carousel
4. Show progress bar overlay on cards
5. Click to resume playback
6. Add to Home page

**Acceptance Criteria**:
- ✅ Shows media with partial progress
- ✅ Sorted by recently watched
- ✅ Progress bar visible on cards
- ✅ Click resumes from saved position
- ✅ Empty state when no progress

---

### 10. Tag Management UI - NOT IMPLEMENTED ❌
**Status**: Tags field exists, no UI to manage tags  
**Priority**: HIGH - Key organization feature

**Files to Create**:
- [ ] `src/components/TagManager.tsx` - Tag CRUD interface
- [ ] `src/pages/Tags.tsx` - Tag library page (optional)

**Files to Modify**:
- [ ] `src/pages/Detail.tsx` - Add tag editor inline
- [ ] `src/store/libraryStore.ts` - Add tag management methods:
  - `createTag(name, color)`
  - `deleteTag(name)`
  - `renameTag(oldName, newName)`
  - `getAllTags()` - Return unique tags with counts

**Implementation Steps**:
1. Create tag color picker
2. Add tag input with autocomplete
3. Show existing tags as removable chips
4. Add bulk tag operations (apply to multiple items)
5. Filter library by tag

**Acceptance Criteria**:
- ✅ Can create tags with colors
- ✅ Can add/remove tags from media
- ✅ Autocomplete shows existing tags
- ✅ Can filter library by tag
- ✅ Can bulk apply tags

---

### 11. Custom Libraries - NOT IMPLEMENTED ❌
**Status**: Users can only use predefined media types  
**Pri4. JAV/Hentai/Doujin Metadata - INCOMPLETE 🔄
**Status**: Services exist but incomplete, need better providers  
**Priority**: MEDIUM - Adult content metadata quality

**Current Files**:
- `src/services/fanza.ts` - JAV metadata (mock data)
- `src/services/javmeta.ts` - Additional JAV source
- `src/services/dlsite.ts` - Doujin/hentai (mock data)
- `src/services/doujin.ts` - URL import

**Known Issues**:
- Fanza service returns mock data (not real API)
- DLsite service returns mock data
- No comprehensive JAV database integration
- Hentai anime metadata missing
- Adult book/doujin metadata incomplete

**Implementation Steps**:
1. Research and integrate real JAV APIs:
   - R18.com API (if available)
   - JAVLibrary scraping (with rate limiting)
   - DMM/Fanza official API (requires registration)
2. Integrate hentai anime databases:
   - MyAnimeList (has adult content)
   - AniDB (adult section)
   - Custom scraping from hentai sites
3. Improve doujin metadata:
   - DLsite official API
   - nhentai API (unofficial)
   - e-hentai/ExHentai metadata
4. Add adult-specific fields to Media interface:
   - Studio/maker
   - Performers/actresses
   - Series/franchise
   - Product codes (JAV codes)
   - Release date
   - Categories/tags
5. Build adult metadata provider selector in settings
6. Add adult-specific search in Import page

**Acceptance Criteria**:
- ✅ Can fetch real JAV metadata by code
- ✅ Performer information included
- ✅ Doujin metadata from real sources
- ✅ Hentai anime metadata available
- ✅ Cover art/posters fetch correctly
- ✅ Product codes stored and searchable
- ✅ Categories/tags properly imported

---

### 15. Dynamic Card Scaling Slider - NOT IMPLEMENTED ❌
**Status**: Fixed card sizes only  
**Priority**: MEDIUM - Nice UX enhancement

**Current Situation**:
- MediaCard has fixed sizes: 'xs' | 'sm' | 'md' | 'lg'
- Size changed via dropdown in pages
- No smooth scaling

**Files to Modify**:
- [ ] `src/components/MediaCard.tsx` - Support pixel-based sizing
- [ ] `src/pages/MediaTypePage.tsx` - Replace dropdown with slider
- [ ] `src/pages/Library.tsx` - Add slider
- [ ] `src/store/uiStore.ts` - Store slider value (cardWidth in pixels)

**Implementation Steps**:
1. Add `cardWidth` to UIStore (100-400px range)
2. Replace size dropdown with slider:
   ```tsx
   <input
     type="range"
     min={100}
     max={400}
     step={10}
     value={cardWidth}
     onChange={(e) => setCardWidth(Number(e.target.value))}
   />
   ```
3. Update MediaCard to accept pixel width:
   ```tsx
   <div style={{ width: `${cardWidth}px` }}>
   ```
4. Auto-calculate grid columns based on container width:
   ```tsx
   gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))`
   ```
5. Add zoom indicator (e.g., "150px" or "Small/Medium/Large" label)
6. Persist slider value in localStorage
7. Add keyboard shortcuts: `+` to zoom in, `-` to zoom out

**Acceptance Criteria**:
- ✅ Slider smoothly scales card size
- ✅ Grid auto-reflows as cards resize
- ✅ Works on all media type pages
- ✅ Persists across sessions
- ✅ Keyboard shortcuts work
- ✅ Shows current size indicator
- ✅ Responsive on mobile (respects min/max)

---

### 16. Ratings System Enhancement - PARTIALLY IMPLEMENTED 🔄
**Status**: Rating field exists but inconsistent UI  
**Priority**: MEDIUM - Important for library curation

**Current State**:
- `rating?: number` field exists in Media interface
- Some pages show ratings, others don't
- No user rating vs. external rating distinction
- No rating input UI on detail page

**Files to Modify**:
- [ ] `src/pages/Detail.tsx` - Add rating input (star picker)
- [ ] `src/components/MediaCard.tsx` - Show rating consistently
- [ ] `src/types/index.ts` - Split ratings:
  - `externalRating?: number` - From TMDB/OMDB/etc
  - `userRating?: number` - User's personal rating
  - `averageRating?: number` - Average across profiles

**Implementation Steps**:
1. Update Media interface for dual ratings:
   ```typescript
   // External ratings from metadata providers
   externalRating?: number // 0-10
   externalRatingCount?: number // Number of votes
   
   // User ratings
   userRating?: number // 0-10 or 0-5 stars
   ratedAt?: Date
   
   // Multi-profile average
   averageRating?: number
   ```
2. Create StarRating component:
   - Display mode (read-only)
   - Input mode (clickable stars)
   - Support half-stars
   - Show both user and external ratings
3. Add rating input to Detail page:
   - Star picker below poster
   - "Your Rating: ⭐⭐⭐⭐☆"
   - Show external rating separately
4. Add rating filter to Library pages:
   - Filter by minimum rating
   - Separate "Rated by me" filter
5. Support custom rating scales for custom libraries:
   - 5-star system
   - 10-point system
   - 100-point system
   - Custom labels (e.g., "Poor/Fair/Good/Great")

**Acceptance Criteria**:
- ✅ Can rate any media item
- ✅ Star rating UI on detail page
- ✅ Ratings show on media cards
- ✅ Can filter by rating
- ✅ External and user ratings separated
- ✅ Works for custom libraries
- ✅ Ratings persist per profile

---

### 17rity**: HIGH - Major flexibility feature

**Files to Create**:
- [ ] `src/components/CustomLibraryManager.tsx` - Create/edit custom libraries
- [ ] `src/store/customLibrariesStore.ts` - Custom library state management
- [ ] `src/types/customLibrary.ts` - Custom library type definitions

**Files to Modify**:
- [ ] `src/types/index.ts` - Make MediaType extensible for custom types
- [ ] `src/components/SidebarMenu.tsx` - Dynamically render custom libraries
- [ ] `src/App.tsx` - Dynamically generate routes for custom libraries
- [ ] `src/pages/Library.tsx` - Support custom library types in filters

**Implementation Steps**:
1. Create CustomLibrary interface:
   ```typescript
   interface CustomLibrary {
     id: string
     name: string // e.g., "Comics", "Courses", "Recipes"
     icon: string // Lucide icon name
     color: string // Theme color
     fields: CustomField[] // User-defined fields
     createdAt: Date
   }
   interface CustomField {
     name: string
     type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'rating'
     required: boolean
     options?: string[] // For select/multiselect
   }
   ```
2. Build CustomLibraryManager modal:
   - Library name input
   - Icon picker (Lucide icons)
   - Color picker
   - Field builder (add/remove/reorder fields)
3. Store custom libraries in localStorage/DB
4. Dynamically render sidebar items for each custom library
5. Generate routes and pages dynamically
6. Create flexible MediaCard that adapts to custom fields

**Acceptance Criteria**:
- ✅ Can create new custom libraries (e.g., "Board Games", "Wine Collection")
- ✅ Can define custom fields with types
- ✅ Custom libraries appear in sidebar with chosen icon
- ✅ Can add/edit/delete items in custom libraries
- ✅ Custom fields render appropriately in detail view
- ✅ Can filter and search custom library items

---

### 12. CSV/Data Import/Export - NOT IMPLEMENTED ❌
**Status**: No bulk import/export capability  
**Priority**: HIGH - Critical for data migration and backup

**Files to Create**:
- [ ] `src/services/csvImporter.ts` - Parse CSV and map to Media objects
- [ ] `src/services/csvExporter.ts` - Export Media objects to CSV
- [ ] `src/components/ImportWizard.tsx` - Step-by-step import UI
- [ ] `src/components/FieldMapper.tsx` - Map CSV columns to Media fields
- [ ] `src/templates/` - CSV templates for each media type

**Files to Modify**:
- [ ] `src/pages/Import.tsx` - Add "Import from CSV" button
- [ ] `src/pages/Settings.tsx` - Add "Export Library" section

**Implementation Steps**:
1. Install CSV parser: `npm install papaparse` and `npm install @types/papaparse`
2. Create CSV templates for each media type:
   - `templates/movies-template.csv`
   - `templates/tv-template.csv`
   - `templates/music-template.csv`
   - `templates/books-template.csv`
   - `templates/podcasts-template.csv`
   - `templates/photos-template.csv`
   - `templates/custom-template.csv` (for custom libraries)
3. Add template download feature with instructions:
   ```markdown
   # Import Instructions for Movies
   
   ## Required Fields:
   - title: Movie title (text)
   - year: Release year (number)
   - type: Must be "movie"
   
   ## Optional Fields:
   - genres: Comma-separated (e.g., "Action,Sci-Fi")
   - rating: 0-10 (number)
   - ... (list all fields with descriptions)
   ```
4. Build ImportWizard component:
   - Step 1: Select media type or custom library
   - Step 2: Upload CSV file
   - Step 3: Map CSV columns to Media fields (auto-detect + manual adjust)
   - Step 4: Preview first 10 rows
   - Step 5: Import (with progress bar)
5. Build CSV exporter:
   - Export all media or filtered subset
   - Choose fields to include
   - Format dates and arrays properly
6. Support multiple formats:
   - CSV (primary)
   - JSON (for complete data)
   - Excel (.xlsx) - optional

**Acceptance Criteria**:
- ✅ Can download CSV template for any media type
- ✅ Template includes instructions and field descriptions
- ✅ Can upload CSV and map columns to fields
- ✅ Preview shows correctly parsed data
- ✅ Import creates media items in library
- ✅ Can export library to CSV/JSON
- ✅ Export includes all metadata fields
- ✅ Works with custom libraries and custom fields

---

### 13. Metadata Auto-Fetch + Update Button - PARTIALLY IMPLEMENTED 🔄
**Status**: Auto-fetch exists for some types, missing update button  
**Priority**: HIGH - Essential for maintaining library

**Current Files**:
- `src/services/omdb.ts` - OMDB integration
- `src/services/tmdb.ts` - TMDB integration
- `src/services/books.ts` - Google Books integration
- `src/services/music.ts` - iTunes/MusicBrainz integration

**Files to Create**:
- [ ] `src/services/metadataRefresh.ts` - Unified metadata refresh service

**Files to Modify**:
- [ ] `src/pages/Detail.tsx` - Add "Update Metadata" button
- [ ] `src/components/MediaCard.tsx` - Add context menu option "Update Metadata"
- [ ] `src/pages/Import.tsx` - Auto-fetch on import (enhance existing)
- [ ] `src/components/BulkUpdateModal.tsx` - Add "Fetch Missing Metadata" option

**Implementation Steps**:
1. Create unified metadata refresh service:
   ```typescript
   async function refreshMetadata(media: Media): Promise<Partial<Media>> {
     switch(media.type) {
       case 'movie':
       case 'tv':
         return await fetchTMDBMetadata(media.title, media.year)
       case 'music':
         return await fetchMusicMetadata(media.title, media.artist)
       case 'book':
         return await fetchBookMetadata(media.title, media.author)
       // ... etc
     }
   }
   ```
2. Add "Update Metadata" button to Detail page:
   - Show spinner during fetch
   - Preview changes before applying
   - Respect locked fields (don't overwrite)
3. Add "Fetch Missing Metadata" to bulk operations:
   - Find items with missing posters or descriptions
   - Batch fetch with rate limiting
   - Show progress
4. Auto-fetch on import (enhance existing):
   - After file scan, auto-fetch metadata
   - Show progress in job queue
   - Handle failures gracefully
5. Add poster/backdrop refresh:
   - Click poster to search for better image
   - Upload custom artwork
   - Fetch from multiple providers

**Acceptance Criteria**:
- ✅ "Update Metadata" button on detail page works
- ✅ Can refresh metadata for single item
- ✅ Can bulk refresh for multiple items
- ✅ Respects locked fields (no overwrite)
- ✅ Shows preview before applying changes
- ✅ Can fetch missing posters specifically
- ✅ Auto-fetch runs on import
- ✅ Progress visible in UI

---21. Transparent Menu Styling - NOT IMPLEMENTED ❌
**Status**: Menu is solid  
**Priority**: LOW - Visual polish only

**Files to Modify**:
- [ ] `src/components/SidebarMenu.tsx` - Add transparency to background
- [ ] `src/index.css` or component styles

**Implementation Steps**:
1. Update SidebarMenu container:
   ```tsx
   className="bg-surface/80 backdrop-blur-sm" // 20% transparent with blur
   ```
2. Keep menu buttons solid:
   ```tsx
   className="bg-dark hover:bg-primary" // No transparency on buttons
   ```
3. Optional: Add blur effect for depth
4. Test readability with backdrop content

**Acceptance Criteria**:
- ✅ Sidebar background 20% transparent
- ✅ Menu buttons remain solid
- ✅ Text still readable
- ✅ Backdrop blur enhances effect
- ✅ No performance impact

---

### 22

## 💎 TIER 3: MEDIUM PRIORITY

### 11. Cloud Sync Backend - MOSTLY TODO 🔄
**Status**: Store created, all methods are TODOs  
**Priority**: MEDIUM - Nice to have, not critical

**Current File**:
- `src/store/cloudSyncStore.ts` - Lines 80+ all TODO

**Known TODOs**:
- Line 85: "TODO: Implement actual sync logic for provider"
- Line 110: "TODO: Sync media library"
- Line 115: "TODO: Sync progress"
- Line 120: "TODO: Sync settings"
- Line 145: "TODO: Show conflict resolution UI"
- Line 165-195: Multiple backup/restore TODOs

**Implementation Options**:
1. **Firebase**: Real-time sync, auth included
2. **Supabase**: PostgreSQL backend, real-time subscriptions
3. **Custom API**: Full control, more work

**Implementation Steps**:
1. Choose provider (recommend Supabase for PostgreSQL + Realtime)
2. Set up backend database schema
3. Implement sync methods:
   - Push local changes to cloud
   - Pull remote changes to local
   - Merge conflicts (last-write-wins or manual resolution)
4. Add sync status indicator
5. Handle offline mode gracefully

**Acceptance Criteria**:
- ✅ Library syncs across devices
- ✅ Progress syncs in real-time
- ✅ Conflicts resolved automatically or with UI
- ✅ Works offline, syncs when online
- ✅ Settings preserved across devices

---

### 12. Watch Party - AUTHENTICATION TODO 🔄
**Status**: Store created, needs auth integration  
**Priority**: MEDIUM - Social feature, not core

**Current File**:
- `src/store/watchPartyStore.ts` - Lines 40, 60 have auth TODOs

**Known TODOs**:
- Line 40: "TODO: Get from auth - need user ID"
- Line 60: "TODO: Get from auth - need user ID"

**Implementation Steps**:
1. Add authentication system (Firebase Auth or Supabase Auth)
2. Connect watchPartyStore to auth for userId
3. Implement WebRTC or WebSocket sync for playback position
4. Add chat system with reactions
5. Create WatchParty UI:
   - Create party modal
   - Invite friends (share link)
   - Participant list
   - Chat sidebar
   - Sync indicator

**Acceptance Criteria**:
- ✅ Can create watch party
- ✅ Friends can join via link
- ✅ Playback syncs in real-time
- ✅ Chat works with reactions
- ✅ Shows participant list

---

### 13. Plugin System - SANDBOX TODO 🔄
**Status**: Store created, sandbox execution not implemented  
**Priority**: MEDIUM - Advanced feature

**Current File**:
- `src/store/pluginStore.ts` - Lines 90, 135 have TODOs

**Known TODOs**:
- Line 90: "TODO: Run in sandboxed environment"
- Line 135: "TODO: Implement rule execution logic"

**Implementation Steps**:
1. Choose sandbox approach:
   - Web Workers (limited API access)
   - iframe with postMessage
   - QuickJS/Duktape for isolated JS execution
2. Define plugin API surface
3. Implement permission system
4. Create plugin marketplace (or local plugin folder)
5. Add plugin developer docs

**Acceptance Criteria**:
- ✅ Can load plugins safely
- ✅ Plugins request permissions
- ✅ Plugins can't access unauthorized APIs
- ✅ Can enable/disable plugins
- ✅ Plugin automation rules work

---

### 14. Library Statistics Page - NOT IMPLEMENTED ❌
**Status**: No stats visualization  
**Priority**: MEDIUM - Nice insight feature

**Files to Create**:
- [ ] `src/pages/Statistics.tsx` - Stats dashboard
- [ ] `src/components/StatCard.tsx` - Stat display card
- [ ] `src/components/MediaChart.tsx` - Charts for trends

**Implementation Steps**:
1. Calculate statistics from libraryStore:
   - Total items by type
   - Total storage used
   - Watch time (hours)
   - Reading time (hours)
   - Most watched/played
   - Items added per month
2. Create charts (use recharts or similar)
3. Add to navigation

**Acceptance Criteria**:
- ✅ Shows total counts by media type
- ✅ Shows storage usage
- ✅ Shows consumption stats
- ✅ Charts display trends
- ✅ Can filter by date range

---

### 15. Enhanced Scanner - METADATA EXTRACTION ⚠️
**Status**: Basic scanning works, no metadata extraction  
**Priority**: MEDIUM - Improves import experience

**Current File**:
- `s23/features/import/importScanner.ts` - Just finds files

**Implementation Steps**:
1. Install: `npm install fluent-ffmpeg` (for video/audio metadata)
2. Create metadata extraction service:
   -24xtract video: codec, resolution, bitrate, duration
   - Extract audio: codec, bitrate, sample rate, duration
   - Extract photos: EXIF data
3. Generate thumbnails during import
4. Calculate file hash for deduplication
5. Update scanner to extract metadata in background

**Acceptance Criteria**:
- ✅ Video metadata extracted on import
- ✅ Audio metadata extracted
- ✅ Photo EXIF extracted
- ✅ Thumbnails generated
- ✅ File hashes calculated
- ✅ Doesn't block UI during extraction

---

## 📋 MINOR IMPROVEMENTS

### 16. Saved Views / Smart Filters ❌
- [ ] Save filter combinations as named views
- [ ] Quick access to "Recently Added", "Unwatched", etc.
- [ ] Share views between profiles

### 17. Reading Lists (Books) ❌
- [ ] "To Read", "Currently Reading", "Finished"
- [ ] Different from playlists (book-specific)
- [ ] Goodreads integration (future)

### 18. Album/Artist Views (Music) ❌
- [ ] Group music by album
- [ ] Group albums by artist
- [ ] Album art grid view

### 25. Duplicate Detection UI ❌
- [ ] Show duplicate files (by hash)
- [ ] Merge or delete duplicates
- [ ] Comparison view

### 26. Intro Skip Detection ❌
- [ ] ML-based intro detection
- [ ] Manual intro markers
- [ ] Auto-skip button during playback

---

## 🐛 KNOWN BUGS / ISSUES

### From TODO Comments in Code:
1. **podcastStore.ts**:
   - Line 95: RSS parsing not implemented
   - Line 130: Episode fetching not implemented
   - Line 180: Download integration missing

2. **EReader.tsx**:
   - Line 50: Book content loading not implemented
   - Line 120: Rendering placeholder only

3. **ManualMetadataMatchModal.tsx**:
   - Line 24: Provider API integration incomplete

4. **watchPartyStore.ts**:
   - Lines 40, 60: User authentication not connected

5. **pluginStore.ts**:
   - Line 90: Sandbox execution not implemented
   - Line 135: Rule execution not implemented

6. **cloudSyncStore.ts**:
   - Lines 85-195: All sync methods are TODOs

7. **socialStore.ts**:
   - Multiple "TODO: Fetch from API" comments

8. **Collections.tsx**:
   - Line ~200: "TODO: Implement edit modal"

9. **Plugins.tsx**:
   - Line ~150: "TODO: showInstall panel implementation"

---

## 🎯 NEXT ACTIONS (Updated Order)

### Week 1: Photo Gallery & Custom Libraries (Critical)
- [ ] Day 1-2: Update scanner, add photo extensions
- [ ] Day 3: Build PhotosPage and PhotoGrid
- [ ] Day 4: Create PhotoViewer component
- [ ] Day 5-6: Implement custom library system
- [ ] Day 7: Testing and bug fixes

### Week 2: Data Import/Export & Metadata (High Value)
- [ ] Day 1-2: Build CSV importer/exporter
- [ ] Day 3: Create import templates with instructions
- [ ] Day 4-5: Complete metadata auto-fetch + update button
- [ ] Day 6-7: Testing import/export workflows

### Week 3: Comic Reader & Audiobook Player (Critical)
- [ ] Day 1-3: Build ComicReader component (CBZ/CBR support)
- [ ] Day 4-5: Create AudiobookPlayer component
- [ ] Day 6-7: Testing and polish

### Week 4: TV Series & UI Enhancements
- [ ] Day 1-3: Build TVSeriesView with season/episode grouping
- [ ] Day 4: Dynamic card scaling slider
- [ ] Day 5: Enhanced ratings system
- [ ] Day 6-7: Continue Watching carousel

### Week 5: Adult Content & Polish
- [ ] Day 1-3: Implement real JAV/hentai/doujin metadata
- [ ] Day 4-5: Podcast RSS parser
- [ ] Day 6: Transparent menu styling
- [ ] Day 7: Bug fixes and optimization

---

## 🎯 ORIGINAL NEXT ACTIONS (For Reference)

### Original Week 1: Photo Gallery (Critical)
- [ ] Day 1-2: Update scanner, add photo extensions
- [ ] Day 3-4: Build PhotosPage and PhotoGrid
- [ ] Day 5: Create PhotoViewer component
- [ ] Day 6-7: Add EXIF extraction and display

### Week 2: Comic Reader & Audiobook Player (Critical)
- [ ] Day 1-3: Build ComicReader component (CBZ/CBR support)
- [ ] Day 4-5: Create AudiobookPlayer component
- [ ] Day 6-7: Testing and polish

### Week 3: TV Series & Continue Watching (High Value)
- [ ] Day 1-3: Build TVSeriesView with season/episode grouping
- [ ] Day 4-5: Create ContinueWatching carousel
- [ ] Day 6-7: Add to Home page, testing

### Week 4: Podcast & Metadata (Core Functionality)
- [ ] Day 1-3: Implement RSS parser for podcasts
- [ ] Day 4-5: Complete ManualMetadataMatchModal integration
- [ ] Day 6-7: Testing and bug fixes

### Week 5: Polish & Security
- [ ] Day 1-2: Integrate Profile PIN enforcement
- [ ] Day 3-4: Build Tag Management UI
- [ ] Day 5-7: Bug fixes and optimization

---

## 📚 REFERENCE DOCUMENTS

- **FEATURES_IMPLEMENTATION_STATUS.md** - Detailed 200-feature tracking (may be outdated)
- **OPTIONAL_FEATURES.md** - Top 10 priority list
- **NEW_FEATURES_SUMMARY.md** - Recent implementation summary
- **PRD.md** - Product requirements (now reflects unified library)
- **ROADMAP.md** - Development phases

---

## 💡 TIPS FOR MAINTAINING THIS DOCUMENT

1. **Update Status** as features are completed
2. **Remove items** when fully implemented
3. **Add new TODOs** as they're discovered
4. **Keep priorities current** based on user needs
5. **Reference file/line numbers** for quick navigation
6. **Add acceptance criteria** for each feature
7. **Document blockers** if stuck on implementation

---

**Remember**: The infrastructure is excellent (85% complete). Focus on specific media type implementations (photos, comics, audiobooks, podcasts) to reach 100%.
