# Import / External Sources (scaffold)

This folder will contain the import and source watcher implementation for the External Sources feature.

Planned modules:
- `src/features/import/sourceModel.ts` — Source model (folder, drive, smb, ftp)
- `src/features/import/watcher.ts` — Watcher and incremental scanning
- `src/services/importScanner.ts` — Scanner utilities + jobs
- UI: `Settings -> Sources` page

Quick tasks:
- [ ] Create Source model and persistence
- [ ] Implement manual scan and job queue
- [ ] Implement watcher service and incremental scan
- [ ] Add Settings UI and source editor

Feature flag: `feature_external_sources`
