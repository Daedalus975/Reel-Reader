# PRD: In-App Music Player

## Goal
Provide an integrated in-app music player that allows users to browse playlists, select individual tracks, manage a queue, and control playback (play/pause/next/previous/seek/volume) using Spotify integration and local playback. The player must support a compact minimizable UI that docks to the right-hand corner and allows drag-drop queue reordering.

## User Stories
- As a user, I can expand a Spotify playlist and play any track directly from the list.

**Optional features catalog:** See `OPTIONAL_FEATURES.md` for a curated and pruned catalog and **Top 10 priority** list of optional features. Next: convert each top item to a tracked issue and gate the work behind feature flags.
- As a user, I can "Play All" a playlist and have items queued in order.
- As a user, I can add tracks to the queue, reorder them via drag-and-drop, and remove items.
- As a user, I can minimize the player to a corner and restore it; the player should be persistent across route changes.
- As a user, I can control playback (play/pause/next/previous) and see current track metadata (title/artist/album art) and a progress bar.
- As a Tauri desktop user, I can use global media keys and choose the playback device.

## Acceptance Criteria
- Play a specific track from a playlist: clicking a track triggers `playTrack(uri)` and playback starts on the registered device.
- Play All: clicking "Play All" queues tracks and starts playback at the first queued item.
- Queue management: drag/drop reorders the queue and persisting state reflects the new order across reloads.
- Minimize/restore: the MiniPlayer can be minimized to a small button in the lower-right and restored; state persists on navigation and across reloads if the user has persisted preferences.
- Controls: Play/Pause toggles playback state, Next/Previous skip tracks (call `nextTrack`/`previousTrack`), Volume control calls `setVolume`, and seek updates position.
- UX: Provide keyboard shortcuts (space = play/pause, ←/→ seek, N/P next/previous) and accessible ARIA labels.

## Implementation Notes
- Spotify integration uses Authorization Code + PKCE; PKCE verifier fallback, duplicate exchange guard, and automatic token refresh exist in `src/services/spotify.ts`, `src/pages/SpotifyCallback.tsx`, `src/services/spotifyPlayback.ts`.
- Device registration uses the Spotify Web Playback SDK; control APIs call `/v1/me/player/*` endpoints.
- Key files:
  - UI: `src/pages/Music.tsx`, `src/components/MiniPlayer.tsx`, `src/components/MusicPlayerBar.tsx`
  - Store: `src/store/spotifyPlaybackStore.ts`, `src/store/musicVideoPlaylistStore.ts`
  - Services: `src/services/spotifyPlayback.ts`, `src/services/spotifyFeatures.ts`

## Test Cases
- Play a track from a playlist (Playwright): assert that `playTrack` was invoked and UI shows selected track.
- Reorder queue via drag/drop (e2e): assert queue order changed and persisted.
- Minimize/restore (integration): assert state maintained across route navigation.

## Metrics & Rollout
- Track feature usage: plays initiated from in-app playlists, queue reorder events, minimizes/restores.
- Roll out as feature flag for internal beta, confirm reliability of Spotify flows across network edge cases.

---

If you'd like, I can open a PR with these doc edits and add Playwright test skeletons next.