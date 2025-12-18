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

---

## 🚧 Phase 2: Next Steps (Ready to Implement)

### YouTube Trailer Auto-Fetch
**File:** `src/services/tmdb.ts`
- Add `getMovieVideos(movieId)` and `getShowVideos(showId)` using TMDB `/videos` endpoint
- Extract YouTube trailer key and build URL
- Auto-populate `trailerUrl` when adding movies/TV
- Store in `trailerUrl` field for easy override

### Sortable/Filterable Search UI
**Files:** `src/pages/Search.tsx`, `src/components/AddContentModal.tsx`
- Add sort dropdown: Relevance, Popularity, Year, Rating, Title A-Z
- Add filter chips per type:
  - Movies/TV: Genre, Year range, Rating
  - Music: Genre, Year, Explicit filter
  - Books: Genre, Year, Author
- Live search with debounce (already partially implemented)
- Results count and "No results" state

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

### In-App Video Player
**New Package:** `video.js` or `@vidstack/react`
```bash
npm install video.js @types/video.js
```

**New Component:** `src/components/VideoPlayer.tsx`
- Full controls (play/pause, seek, volume, fullscreen)
- Resume from saved progress
- Subtitle support (.srt, .vtt)
- Playback speed control
- Quality selector for multi-quality files

**New Page:** `src/pages/Watch.tsx` (replaces placeholder)
- Embed VideoPlayer with `item.filePath` or `item.trailerUrl`
- Save progress on pause/close
- Next episode button for TV shows

### In-App Music Player
**New Package:** `howler.js` or native HTML5 Audio
```bash
npm install howler @types/howler
```

**New Component:** `src/components/MusicPlayer.tsx`
- Bottom bar player (like Spotify)
- Play/pause, skip, shuffle, repeat
- Volume slider, seek bar
- Now playing artwork + metadata
- Queue management

**Feature:** Music Video Playlist Builder
**New Page:** `src/pages/MusicPlaylists.tsx`
- Create/edit/delete playlists
- Drag-drop reorder tracks
- "Play All" → opens YouTube videos in sequence or embeds
- Export playlist as M3U/JSON

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

5. **Build Music Player** (~3 hours)
   - Install `howler` or use native Audio
   - Bottom bar player component
   - Persistent playback state

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

**Want me to continue with Phase 2 (trailers + sorting) or jump to Phase 3 (players)?**
