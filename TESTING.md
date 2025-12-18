# Testing Strategy

- Unit testing with Jest
- Integration tests for library import and playback
- UI tests with Playwright
- CI via GitHub Actions or Vite plugin

Scopes
- Components: render + interaction
- Stores: state transitions, filtering
- Pages: route navigation, loading/error states

## Playback & Player Tests (Playwright)
- Expand a Spotify playlist, click a track Play — verify `useSpotifyPlaybackStore.playTrack` is called and that the Web API `/v1/me/player/play` is triggered (mock or stub the Web API response).
- Play/Pause/Next/Previous flow — verify the UI controls call the appropriate store actions and UI updates (e.g., `currentTrack`, `isPlaying`).
- Queue management: drag-and-drop reorder of the MiniPlayer queue changes store order; removing an item updates the queue and persisted state.
- MiniPlayer: minimize/restore behavior persists across route navigation.
