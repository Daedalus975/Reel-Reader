# 01 — External Sources & Watchers

**Summary:** Add support for library sources (local folders, external drives, SMB, FTP) and real-time watchers for incremental indexing.

**Acceptance criteria:**
- Users can add sources (type: folder, external drive, SMB, FTP) in Settings.
- Sources persist per-profile and survive restart.
- User can manually trigger a scan and schedule recurring scans.
- Watchers detect new/removed files and trigger incremental indexing (configurable).

**Implementation notes:**
- Feature flag: `feature_external_sources`
- Modules to add: `src/features/import`, `src/features/import/watcher`, `src/services/importScanner`

**Tasks:**
- [ ] Add source model & persistence
- [ ] Implement manual scan CLI/command
- [ ] Implement incremental scanner and watcher
- [ ] Add UI to Settings for source management
- [ ] Add import job queue & error reporting

**Estimate:** 5–8 days

**Related docs:** `OPTIONAL_FEATURES.md` (Top 10)
