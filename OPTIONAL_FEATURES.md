# Optional Features Catalog (1–200) — Curated & Pruned

This file previously contained the full 1–200 optional feature catalog provided by the project stakeholder. I reviewed the functions-aligned list and the current product PRD, FEATURES, and IMPLEMENTATION_STATUS documents, and pruned the catalog to remove items that are already implemented, duplicated, deprecated, or out-of-scope for the near-term roadmap.

Notes on methodology
- Kept features that add clear product value and align with the PRD or current implementation (playback, metadata, import, profiles, sync, casting, downloads, accessibility).
- Removed or deferred items that are duplicates, too experimental, or outside the project's current scope (e.g., low-priority visual gimmicks or platform features not supported by Tauri desktop currently).
- Marked items as **Implemented**, **Recommended**, **Deferred**, or **Out-of-scope**.
- Added a short **Top 10 priority** list to guide next implementation work.

IMPORTANT: The full, unabridged 1–200 list is retained in project attachments (original import). If you want the whole list pasted here unabridged, tell me and I'll add it.

---

## Summary of status
- Implemented (already in repo):
  - Spotify playback wiring (SDK + Web API), per-track play, Play All (queue sync), device selection, shuffle/repeat, polling playback state, `MiniPlayer` and `FoldoutPlayer` UI. (See `src/services/spotifyPlayback.ts`, `src/store/spotifyPlaybackStore.ts`, `src/components/FoldoutPlayer.tsx`, `src/components/MiniPlayer.tsx`)

- Recommended (useful, aligns with PRD & product goals):
  1. External sources & watch folder import + incremental scanning
  2. Metadata provider integration & artwork fetching + manual match picker
  3. Offline download manager + scheduled downloads + storage analytics
  4. Profiles & adult-mode PIN gating + profile-based restrictions
  5. Queue/playlist UX polish: drag/drop reorder, per-track metadata resolution, playlist import/export (M3U/JSON)
  6. Casting: DLNA + Chromecast support (feature-flagged)
  7. Backup/restore & database export (encrypted backups)
  8. Global playback hotkeys & media-key integration (Tauri)
  9. Lyrics display + basic visualizer (feature-flagged)
  10. Cross-device sync of playback position and playlists (optional cloud sync)

- Deferred / Lower priority (feature-flagged or research first):
  - AI metadata cleanup jobs, mood-based playlist generation, smart radio, collaborative playlists, and watch-party social features
  - Crossfade, gapless playback, and advanced audio processing (defer until core features & offline downloads are stable)
  - Platform-specific casting (AirPlay) and DRM-protected sources (defer)

- Out-of-scope / Removed from the immediate catalog:
  - Experimental plugin sandboxing, local script runner (too broad for v1)
  - Deep platform integrations not supported in desktop Tauri environment right now (some mobile-only features)

---

## Top 10 priority items (with suggested next-step actions)
1. External sources + watch folders
   - Next step: scaffold `src/features/import` with a `source` model and watcher service (feature flag gated). Add UI to add sources in Settings.
2. Metadata & artwork integration
   - Next step: wire provider adapters, add manual match picker in item edit screen.
3. Offline downloads manager
   - Next step: implement download queue, storage quota UI and partial/cancel behaviors.
4. Profiles & security (adult mode, PIN)
   - Next step: add PIN flow and profile-level toggles for adult content; update PRD sections.
5. Queue/playlist UX polish
   - Next step: complete drag/drop reorder, add per-item context actions, persist friendly metadata in queue store.
6. Casting: DLNA first (Chromecast later)
   - Next step: create device discovery service and simple 'send to device' action.
7. Backup & restore
   - Next step: implement DB export/import, encrypted backups and UI for scheduling.
8. Global hotkeys & media-key integration
   - Next step: add Tauri bindings and a small hotkey manager; expose settings in Accessibility.
9. Lyrics / basic visualizer (feature-flagged)
   - Next step: add lyrics fetchers and a simple WebGL canvas visualizer (deferred to a feature branch).
10. Cloud sync (optional)
   - Next step: determine sync backend (opt-in), design conflict resolution, and expose settings per-profile.

---

## How to use this file
- Use the **Top 10 priority list** to create tracked work items (issues + feature flags). Each item should include an implementation owner, acceptance criteria, and a basic estimate.
- When implementing a recommended item, add a short entry to `IMPLEMENTATION_STATUS.md` and link any related pull requests.

Recent actions:
- Top 10 roadmap files were created in `ROADMAP/TOP_10/` (one file per top item).
- A simple feature-flag utility was added at `src/utils/featureFlags.ts` and default flags at `src/features/flags.ts`.

Next steps (done on request):
- I will create local feature branches and add starter scaffolding for the first two top items (External Sources and Metadata). If you want, I can also convert the Top 10 into GitHub issues (requires repo access/token) or create issues locally as PR templates.

