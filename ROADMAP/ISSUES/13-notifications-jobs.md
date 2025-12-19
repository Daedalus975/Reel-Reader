# Notifications & Background Jobs

**Status**: Planned  
**Priority**: High  
**Feature Flag**: `feature_notifications_jobs`

## Overview
Implement a background job queue system with retry/backoff policies and a notifications center to inform users about import progress, metadata updates, backup status, and errors.

## User Story
As a user, I want to see notifications when my library imports finish or when errors occur so that I can stay informed without constantly checking progress manually.

## Acceptance Criteria
- [ ] Background job queue (import, scan, metadata fetch, backup, encryption)
- [ ] Job status tracking (queued, running, completed, failed)
- [ ] Retry/backoff policy for failed jobs (exponential backoff)
- [ ] Notifications center UI (accessible from header bar)
- [ ] Notification types: success, error, warning, info
- [ ] Alerts for:
  - New media added
  - Metadata issues detected
  - Backup success/failure
  - Import errors with retry option
  - Large operations completed
- [ ] Dismissable notifications with action buttons
- [ ] Notification history (last 50 notifications)
- [ ] Error log viewer for diagnostics
- [ ] Debug mode toggle in settings

## Technical Details

### New Files
- `src/store/jobQueueStore.ts` — Job queue state management
- `src/store/notificationsStore.ts` — Notifications state
- `src/services/jobQueue.ts` — Job execution engine with retry logic
- `src/components/NotificationsCenter.tsx` — Notifications panel UI
- `src/components/NotificationToast.tsx` — Toast notification component
- `src/pages/ErrorLog.tsx` — Error log viewer

### Integration Points
- Wire import scanner to create import jobs
- Wire metadata fetcher to create metadata jobs
- Wire backup service to create backup jobs
- Add bell icon to HeaderBar with unread count badge
- Trigger toast notifications on job completion/failure

### Job Queue Design
```typescript
interface Job {
  id: string
  type: 'import' | 'scan' | 'metadata' | 'backup' | 'encrypt'
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress?: number // 0-100
  retries: number
  maxRetries: number
  error?: string
  createdAt: Date
  completedAt?: Date
}
```

### Retry Policy
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 retries)
- User-configurable retry limits in settings
- Manual retry button in notifications

## Implementation Steps
1. Create job queue store and execution engine
2. Implement retry/backoff logic
3. Create notifications store with actions (add, dismiss, mark read)
4. Build NotificationsCenter component (slide-out panel)
5. Build toast notification component (bottom-right corner)
6. Add bell icon to HeaderBar with unread count
7. Wire import/scan/metadata services to job queue
8. Add error log viewer page
9. Add debug mode toggle in settings
10. Test with long-running jobs and forced failures

## Testing
- [ ] Verify job queue processes jobs sequentially
- [ ] Test retry/backoff logic with simulated failures
- [ ] Verify notifications appear and dismiss correctly
- [ ] Test unread count updates
- [ ] Verify error log captures all failures
- [ ] Add Playwright test for import job notification flow

## Related Issues
- #01-external-sources (for import job integration)
- #02-metadata-artwork (for metadata job integration)
- #07-backup-restore (for backup job integration)

## Design Considerations
- Notifications panel: slide-out from top-right (below header)
- Toast notifications: bottom-right corner, auto-dismiss after 5s
- Unread count badge: small red circle on bell icon
- Square corners, dark theme

## Links
- PRD: Phase 2/3 → Background Jobs & Notifications
- IMPLEMENTATION_STATUS: Optional Features Mapping
