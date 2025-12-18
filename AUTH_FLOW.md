# Authentication & Access

- Standard login + 2FA
- Local encrypted user profiles
- Adult mode toggle is profile-specific and encrypted
- Remote sync requires token auth

Profiles
- Multiple users with custom restrictions
- Per-profile language + rating preferences

## Spotify OAuth (implementation notes)
- Authorization Code + PKCE is used for Spotify integration. To recover the PKCE verifier across redirects or reloads we include a state-based fallback where the verifier is encoded into the `state` parameter and decoded on callback. (See `src/services/spotify.ts`.)
- React Strict Mode can cause effects to run twice; the Spotify callback route guards against duplicate token exchange using a ref-based single-run guard (`src/pages/SpotifyCallback.tsx`).
- Tokens are refreshed automatically near expiry using `refreshSpotifyToken()` and helpers in `src/services/spotifyPlayback.ts`.
- The Spotify Web Playback SDK is used only to register an in-browser device; actual playback control is performed through the Web API endpoints (`/v1/me/player/*`).