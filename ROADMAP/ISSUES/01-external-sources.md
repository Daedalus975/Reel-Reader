Title: External Sources & Watchers

Description:
Add support for library sources (local folders, external drives, SMB, FTP) and real-time watchers for incremental indexing.

Acceptance criteria:
- Users can add sources (type: folder, external drive, SMB, FTP) in Settings.
- Sources persist per-profile and survive restart.
- User can manually trigger a scan and schedule recurring scans.
- Watchers detect new/removed files and trigger incremental indexing (configurable).

Tasks:
- Create a `Source` model and persistence layer
- Implement manual scanning service and job queue
- Implement watcher service + incremental scanning
- Add Settings UI and source editor
- Add tests for scanner + watcher behavior

Estimate: 5–8 days

Labels: enhancement, feature, top10
Assignees: @owner
