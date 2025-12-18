Title: Cloud Sync (playback positions, optional)

Description:
Optional cloud sync for playback positions, playlists, and device state (opt-in).

Acceptance criteria:
- Users can opt-in to cloud sync and see devices/playlists synced across devices.
- Conflicts handled via last-write-wins or manual resolution UI.

Tasks:
- Design sync backend contract and client SDK
- Implement opt-in flow and settings
- Tests for conflict scenarios

Estimate: 6–10 days

Labels: enhancement, feature, top10
Assignees: @owner