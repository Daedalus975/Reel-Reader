# Video Player Implementation

**Status**: Planned  
**Priority**: High  
**Feature Flag**: `feature_video_player`

## Overview
Implement an in-app video player with full playback controls, subtitle support, and resume functionality.

## User Story
As a user, I want to watch videos directly within Reel Reader so that I can have a unified media experience without switching to external players.

## Acceptance Criteria
- [ ] VideoPlayer component with play/pause/seek/volume controls
- [ ] Fullscreen toggle
- [ ] Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- [ ] Subtitle support (.srt, .vtt) with track selection
- [ ] Audio track selection for multi-audio files
- [ ] Aspect ratio override (Auto, 16:9, 4:3, Fill)
- [ ] Resume from saved progress position
- [ ] Next episode button for TV shows
- [ ] Keyboard shortcuts (Space = play/pause, arrows = seek, F = fullscreen)
- [ ] Save progress on pause/close
- [ ] Quality selector for multi-quality files (future)

## Technical Details

### Dependencies
```bash
npm install video.js @types/video.js
# OR
npm install @vidstack/react
```

### New Files
- `src/components/VideoPlayer.tsx` — Main video player component
- `src/pages/Watch.tsx` — Replaces placeholder Watch page
- `src/store/videoPlaybackStore.ts` — Persist playback state

### Integration Points
- Wire to `item.filePath` or `item.trailerUrl` in Detail page
- Update MediaCard "Play" action to navigate to `/watch/:id`
- Save/restore position in `MediaProgress` store

### Design Considerations
- Dark theme controls matching brand guide
- Square corners (`rounded-none`)
- Minimal chrome, hover-to-reveal controls
- WCAG AA contrast for control buttons

## Implementation Steps
1. Install video.js and create basic VideoPlayer component
2. Add keyboard shortcuts and control handlers
3. Wire subtitle/audio track selection UI
4. Implement playback state persistence
5. Create/update Watch page with VideoPlayer
6. Add next episode logic for TV shows
7. Test with various video formats (mp4, mkv, webm)
8. Add error handling and fallback UI

## Testing
- [ ] Manual test with multiple video formats
- [ ] Verify resume position works across sessions
- [ ] Test keyboard shortcuts
- [ ] Test fullscreen on desktop
- [ ] Verify subtitle sync and offset controls
- [ ] Add Playwright E2E test for basic playback flow

## Related Issues
- #02-metadata-artwork (for thumbnails/scrub previews)
- #05-queue-playlist-ux (for up-next/episode chaining)
- #08-global-hotkeys (for media key integration)

## Links
- [video.js docs](https://videojs.com/)
- [Vidstack docs](https://www.vidstack.io/)
- PRD: Phase 3 → In-App Video Player
