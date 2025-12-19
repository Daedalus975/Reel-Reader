# Music Player Enhancements

**Status**: Planned  
**Priority**: Medium  
**Feature Flag**: `feature_music_player_enhancements`

## Overview
Enhance the music playback experience with advanced features: crossfade, gapless playback, ReplayGain, lyrics display, and visualizer.

## User Story
As a music lover, I want advanced audio features like gapless playback and lyrics so that I can enjoy a professional listening experience.

## Acceptance Criteria
- [ ] Crossfade between tracks (configurable duration: 0-12s)
- [ ] Gapless playback for albums
- [ ] ReplayGain support (track/album modes)
- [ ] Loudness normalization toggle
- [ ] Lyrics fetch and display (synchronized if available)
- [ ] Basic audio visualizer (WebGL canvas)
- [ ] Audio EQ presets per genre (optional)
- [ ] Sleep timer for music/podcasts
- [ ] Podcast-specific: silence skip / smart speed
- [ ] Import/export playlists (M3U, JSON)

## Technical Details

### Dependencies
```bash
npm install howler @types/howler
# For lyrics
npm install genius-lyrics-api
# For visualizer (optional)
npm install @react-three/fiber three
```

### New Files
- `src/components/LyricsPanel.tsx` — Lyrics display with scroll sync
- `src/components/AudioVisualizer.tsx` — WebGL visualizer
- `src/services/lyricsService.ts` — Fetch lyrics from APIs
- `src/store/audioSettingsStore.ts` — Crossfade/gapless/EQ settings

### Integration Points
- Extend `spotifyPlaybackStore` or create `localAudioStore` for local files
- Add settings UI in Music settings page
- Wire lyrics panel to MusicPlayerBar (expandable)
- Add visualizer toggle in player controls

### Design Considerations
- Lyrics panel: dark overlay with scrollable centered text
- Visualizer: subtle, non-distracting; toggleable
- Settings: simple toggles and sliders for crossfade/normalization

## Implementation Steps
1. Add crossfade logic to audio playback service
2. Implement gapless playback (preload next track)
3. Add ReplayGain metadata parsing and volume adjustment
4. Integrate lyrics API (Genius, MusixMatch, or local .lrc files)
5. Build LyricsPanel component with synchronized scroll
6. Create basic WebGL visualizer (frequency bars or waveform)
7. Add M3U/JSON playlist import/export
8. Add settings UI for all audio enhancements
9. Test with various audio formats and quality levels

## Testing
- [ ] Verify crossfade works smoothly between tracks
- [ ] Test gapless playback with album tracks
- [ ] Verify ReplayGain normalization consistency
- [ ] Test lyrics sync with playback position
- [ ] Check visualizer performance (60fps target)
- [ ] Test playlist import/export round-trip

## Related Issues
- #05-queue-playlist-ux (for smart playlists)
- #09-lyrics-visualizer (lyrics/visualizer flagged)
- #08-global-hotkeys (for sleep timer shortcuts)

## Links
- [Howler.js docs](https://howlerjs.com/)
- [Genius API](https://docs.genius.com/)
- PRD: Phase 3 → In-App Music Player
