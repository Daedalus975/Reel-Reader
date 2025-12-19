# Implementation Progress - Enhanced Media Management

## ✅ Phase 1: Completed Foundation

### Button Labels & Type-Aware UI
- ✅ Detail page buttons now show correct labels:
  - Video: "Play" / "Mark Watched"
  - Music: "Listen" / "Mark Watched"
  - Books: "Open" / "Mark Finished"
- ✅ MediaCard badges show "Finished" for books instead of "Watched"
- ✅ Detail page hides Director field for non-video types
- ✅ Renamed "Stars" → "Authors" for books, "Artists" for music
- ✅ Status shows "Finished/Not read" for books

### Music Search Enhancement
- ✅ Added Last.fm API integration (`src/services/lastfm.ts`)
- ✅ Last.fm is now PRIMARY music search (best metadata + popularity scores)
- ✅ Fallback chain: Last.fm → iTunes → MusicBrainz
- ✅ Results include playcount/listeners for better ranking
- ✅ Deduplication by artist+album/track name

### Extended Media Type
- ✅ Added new fields to Media interface:
  - `filePath`: Link to local files
  - `trailerUrl`: YouTube trailer/music video URL
  - `previewUrl`: Google Books/sample preview URL
  - `duration`, `fileSize`, `codec`, `resolution`, `bitrate`, `isbn`: For metadata extraction

### Local File Linking
- ✅ Created `src/services/fileUtils.ts` with Tauri file picker
- ✅ Type-specific file filters (video/audio/ebook formats)
- ✅ Added Browse button in Detail edit mode
- ✅ Added manual path input field
- ✅ Added trailer/preview URL fields in edit mode

### Integrations
- ✅ Spotify integration: Authorization Code + PKCE implemented, Web Playback SDK initializes a browser device and playback is controlled via the Spotify Web API (`/v1/me/player/play`, `/pause`, etc.). PKCE verifier persistence and token refresh are handled.
- ✅ Playlist expansion and per-track playback implemented (`src/pages/Music.tsx`).
- 📌 Optional features catalog imported to `OPTIONAL_FEATURES.md` (1–200). A review and curation pass has been completed — the catalog has been pruned to remove duplicates and out-of-scope items, and a **Top 10 priority** list was added (see `OPTIONAL_FEATURES.md`). These optional items will be implemented behind feature flags and prioritized per roadmap.
- ✅ MiniPlayer: minimizable, draggable queue with drag-and-drop reordering and removal (`src/components/MiniPlayer.tsx`).
- ✅ Persistent playback controls (play/pause/next/prev) added to the Music page and wired to `useSpotifyPlaybackStore` (`src/store/spotifyPlaybackStore.ts`, `src/services/spotifyPlayback.ts`).

### Notifications & Job Queue System (Issue #13)
- ✅ **Job Queue Store** (`src/store/jobQueueStore.ts`): State management for background jobs with retry logic
- ✅ **Notifications Store** (`src/store/notificationsStore.ts`): Toast notifications and notification center (max 50, persisted)
- ✅ **Job Queue Service** (`src/services/jobQueue.ts`): Job execution engine with exponential backoff (1s→16s)
- ✅ **UI Components**:
  - `NotificationToast.tsx`: Auto-dismiss toasts (5s for non-errors)
  - `NotificationToastContainer.tsx`: Shows 3 recent unread toasts in bottom-right
  - `NotificationsCenter.tsx`: Slide-out panel with full history and actions
- ✅ **HeaderBar Integration**: Bell icon with dynamic unread count badge
- ✅ **Real Implementation**: Import page now uses job queue for folder scanning
- ✅ **Job Types**: scan, import, metadata, backup, encrypt, download
- ✅ **Documentation**: See `NOTIFICATIONS_JOBS.md` for full guide
- ✅ **Console Testing**: `testNotifications()`, `testJobQueue()`, `testMultipleJobs()` available in browser console
- 🔄 **Next Steps**: Wire metadata fetching, add error log viewer, debug mode toggle

---

## 🚧 Phase 2: Next Steps (Ready to Implement)

### ✅ YouTube Trailer Auto-Fetch
**Files:** `src/services/tmdb.ts`, `src/pages/Detail.tsx`
- ✅ Added `getMovieTrailer(movieId)` and `getShowTrailer(showId)` using TMDB `/videos` endpoint
- ✅ Extract YouTube trailer key and build URL
- ✅ Auto-fetch button in Detail edit mode fetches trailer from TMDB
- ✅ Trailer display with responsive YouTube embed (16:9)
- ✅ Book preview embed support for Google Books URLs
- ✅ Open in YouTube link for external viewing

### ✅ Sortable/Filterable Search UI
**Files:** `src/pages/Search.tsx`
- ✅ Library mode: Sort by Date Added, Year, Rating, Title A-Z
- ✅ Online mode: Sort by Relevance, Popularity, Year, Rating, Title A-Z
- ✅ Filter controls:
  - Movies/TV: Genre dropdown, Year range (min/max), Min Rating (0-10)
  - All types: Favorites Only toggle
- ✅ Live filtering with debounced search
- ✅ Results count with filtered count display (e.g., "15 results (filtered from 50)")
- ✅ "No results" state with helpful messages

### Preview/Trailer Display in Detail
**File:** `src/pages/Detail.tsx`
- Add YouTube embed iframe for `trailerUrl` (responsive 16:9)
- Add "Watch Trailer" / "Listen to Preview" button
- Google Books iframe embed for `previewUrl` when type is book
- Toggle expand/collapse for preview section

---

## 📋 Phase 3: Advanced Features (Requires Package Installation)

### Metadata Extraction Service
**New Package:** `music-metadata`, `pdf-parse`, `fluent-ffmpeg`
```bash
npm install music-metadata pdf-parse fluent-ffmpeg
```

**New File:** `src/services/metadataExtractor.ts`
- Audio: Extract ID3 tags (artist, album, year, genre, bitrate, duration)
- Video: Extract codec, resolution, duration, bitrate using ffprobe
- PDF: Extract author, title, ISBN from PDF metadata
- EPUB: Parse OPF metadata

**Integration:** Call when user picks a file; auto-fill form fields

### ✅ In-App Video Player
**Package:** `video.js` + `@types/video.js` (installed)

**New Component:** `src/components/VideoPlayer.tsx`
- ✅ Full controls (play/pause, seek, volume, fullscreen)
- ✅ Resume from saved progress position
- ✅ Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- ✅ Picture-in-picture support
- ✅ Keyboard shortcuts (Space, arrows, F, M)
- ✅ Responsive fluid layout
- ✅ Auto-detect video type (mp4, webm, mkv, mov, ogg)
- 🔜 Subtitle support (.srt, .vtt) — track selection UI pending

**Updated Page:** `src/pages/Watch.tsx`
- ✅ VideoPlayer embedded with local file or trailer URL
- ✅ Progress saved on unmount
- ✅ Next episode button for TV shows (auto-detects series)
- ✅ Mark watched/favorite actions
- ✅ Poster image display
- ✅ Keyboard shortcuts hint

### ✅ Music Player Enhancements (Issue #12)
**Package:** `howler.js` + `@types/howler` (installed)

**Enhanced Component:** `src/components/MusicPlayerBar.tsx`
- ✅ Howler.js integration replacing native Audio API
- ✅ Crossfade between tracks (0-12s configurable)
- ✅ Gapless playback with preloading
- ✅ Volume normalization (target volume 0-1)
- ✅ ReplayGain support (track/album mode, preamp -15 to +15 dB)
- ✅ EQ presets (flat/rock/pop/jazz/classical/electronic/bass-boost)
- ✅ Sleep timer with countdown
- ✅ Settings persist via Zustand

**New Service:** `src/services/lyricsService.ts`
- ✅ Fetch lyrics from LRCLIB (open-source, no API key)
- ✅ LRC format parsing for time-synced lyrics
- ✅ Plain text fallback
- ✅ Genius API placeholder for future
- 🔜 Local metadata extraction from audio files

**New Component:** `src/components/LyricsPanel.tsx`
- 🔜 Display plain text or time-synced lyrics
- 🔜 Auto-scroll to current line
- 🔜 Click to seek to line
- 🔜 Toggle between synced/plain view

**New Component:** `src/components/AudioVisualizer.tsx`
- ✅ Canvas-based Web Audio API integration with Howler
- ✅ 4 visualizer modes: Bars, Waveform, Circular, Particles
- ✅ Real-time frequency analysis
- ✅ Fullscreen overlay with keyboard controls

**New Component:** `src/components/AudioSettingsPanel.tsx`
- ✅ Crossfade duration slider
- ✅ Gapless toggle
- ✅ Normalization controls
- ✅ ReplayGain settings
- ✅ EQ preset dropdown
- ✅ Sleep timer configuration

**New Service:** `src/services/playlistService.ts`
- ✅ M3U/M3U8 playlist parsing
- ✅ Export library to M3U file
- ✅ Import M3U and match with library items
- ✅ Title + artist matching logic

**New Component:** `src/components/PlaylistManager.tsx`
- ✅ Import/export M3U playlists
- ✅ Match imported tracks with library
- ✅ Play matched tracks button
- ✅ Visual feedback for matched/unmatched tracks

**Updated Page:** `src/pages/Music.tsx`
- ✅ Settings button for AudioSettingsPanel
- ✅ Lyrics button for LyricsPanel
- ✅ Playlist Manager button
- ✅ Modal overlays for all panels

### In-App Book Reader
**New Package:** `epubjs` (EPUB), `react-pdf` (PDF)
```bash
npm install epubjs react-pdf
```

**New Component:** `src/components/BookReader.tsx`
- EPUB: Full reader with page navigation, bookmarks, font size
- PDF: Scroll view with zoom, page navigation
- CBZ/CBR: Image viewer with prev/next
- Save reading progress (page/location)
- Night mode / sepia theme

**New Page:** `src/pages/Read.tsx`
- Embed BookReader with `item.filePath`
- Top bar with progress indicator
- Bookmark panel
- Search in book

---

## 🎯 Quick Next Actions (Priority Order)

1. **Add YouTube Trailer Auto-Fetch** (~30 min)
   - Fetch from TMDB API when adding movies/TV
   - Display in Detail page with embed

2. **Add Sort/Filter UI** (~1 hour)
   - Dropdowns and filter chips in Search
   - Sort results by popularity/year/rating
   - Live filtering

3. **Build Basic Metadata Extraction** (~2 hours)
   - Install `music-metadata` for audio
   - Extract and auto-fill when file is picked
   - Show extracted data in edit form

4. **Build Video Player** (~3 hours)
   - Install `video.js`
   - Create VideoPlayer component
   - Update Watch page to use it

5. **✅ Build Music Player Enhancements** (~6 hours)
   - ✅ Install `howler` + `@types/howler`
   - ✅ Integrate Howler into MusicPlayerBar
   - ✅ Crossfade, gapless, normalization, ReplayGain, EQ
   - ✅ Audio settings panel with persist
   - ✅ Lyrics service + panel (UI pending)
   - ✅ Audio visualizer with 4 modes
   - ✅ M3U playlist import/export
   - ✅ Playlist manager UI

6. **Build Book Reader** (~4 hours)
   - Install `epubjs` and `react-pdf`
   - Create BookReader component
   - Progress saving

---

## 📝 Environment Setup Required

Add to `.env.local`:
```env
# Last.fm (free, for music search)
VITE_LASTFM_API_KEY=your_lastfm_key

# TMDB (for YouTube trailer IDs)
VITE_TMDB_API_KEY=your_tmdb_key
```

Get API keys:
- Last.fm: https://www.last.fm/api/account/create
- TMDB: https://www.themoviedb.org/settings/api (already have)

---

## 🎬 Test Plan

1. **Search Music** with Last.fm:
   - Search for popular album/artist
   - Verify results show play counts
   - Add to library

2. **Link Local File**:
   - Edit any media item
   - Click "Browse" → pick a file
   - Save and verify path stored

3. **Add Trailer URL**:
   - Edit movie
   - Paste YouTube URL in Trailer field
   - Save and verify stored

4. **Type-Specific Labels**:
   - Add/view book → verify "Authors", "Mark Finished"
   - Add/view movie → verify "Stars", "Mark Watched"
   - Add/view music → verify "Listen" button

---

## Optional Features Mapping — Implemented vs Pending

This section cross-references the 200-feature catalog and the aligned functions list. It focuses on items we have implemented or begun, plus immediate next steps.

### Implemented
- External Sources: Manual scan (desktop-aware) in [src/pages/Import.tsx](src/pages/Import.tsx) using the scanner at [src/features/import/importScanner.ts](src/features/import/importScanner.ts)
- Playback (Spotify): Authorization Code + PKCE, Web Playback SDK device, API controls; UI in [src/components/MusicPlayerBar.tsx](src/components/MusicPlayerBar.tsx), [src/components/MiniPlayer.tsx](src/components/MiniPlayer.tsx), [src/components/FoldoutPlayer.tsx](src/components/FoldoutPlayer.tsx)
- Profiles: Create/switch profiles validated by tests in [tests/profile-system.spec.ts](tests/profile-system.spec.ts)
- Desktop/Web Gating: `isDesktop` runtime guard and dynamic Tauri imports, plus web banner [src/components/WebDesktopBanner.tsx](src/components/WebDesktopBanner.tsx)
- Books: Basic EPUB/PDF open path wired via [src/components/BookReader.tsx](src/components/BookReader.tsx)

### In Progress
- External Sources: Add library source UI/editor, and wire source persistence (store + settings). Watcher service scaffolding and incremental scanner to follow.
- Playback: Seek/scrub wiring alignment across players; persistent bottom player improvements.
- Adult Mode: Pages exist; PIN gating and enforcement rules pending.

### Planned (near-term)
- Metadata Providers & Artwork: Provider adapters, manual match picker, artwork fetch/upload, and lockable fields.
- Queue Management & Playlists: Drag/drop reorder, per-track actions, playlist import/export (M3U/JSON).
- Video Player: Fullscreen, speed, subtitles, aspect ratio override.
- Casting: DLNA (device discovery + send to device), Chromecast (flagged).
- Notifications & Jobs: Background job queue with retry/backoff and a notifications center for imports/metadata/backups.

Tracking: See detailed items and statuses in [OPTIONAL_FEATURES.md](OPTIONAL_FEATURES.md) under “Functions Aligned to 200 Features — Implementation Targets”.

---

**Want me to continue with Phase 2 (trailers + sorting) or jump to Phase 3 (players)?**
