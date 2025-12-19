# Notifications & Job Queue System

## Overview

The application now includes a comprehensive notifications and job queue system for managing long-running background operations. This system provides:

- **Job Queue**: Manages background tasks with automatic retry and exponential backoff
- **Notifications**: Toast notifications and a notification center for user feedback
- **Progress Tracking**: Real-time progress updates for running jobs
- **Error Handling**: Automatic retry with configurable attempts and backoff intervals

## Architecture

### Core Components

1. **Job Queue Store** (`src/store/jobQueueStore.ts`)
   - Manages job state (queued, running, completed, failed, cancelled)
   - Tracks job progress (0-100%)
   - Handles retry logic with configurable max retries
   - Persists jobs to local storage (excludes running jobs)

2. **Notifications Store** (`src/store/notificationsStore.ts`)
   - Stores up to 50 notifications with automatic pruning
   - Tracks read/unread status
   - Supports success, error, warning, and info types
   - Persists notifications to local storage

3. **Job Queue Service** (`src/services/jobQueue.ts`)
   - Executes jobs sequentially to prevent resource conflicts
   - Implements exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Sends notifications on job completion/failure
   - Provides job handler registration system

4. **UI Components**
   - **NotificationToast**: Individual toast notifications (auto-dismiss after 5s except errors)
   - **NotificationToastContainer**: Displays up to 3 recent unread toasts in bottom-right
   - **NotificationsCenter**: Slide-out panel with full notification history and actions

## Supported Job Types

- **scan**: Recursively scan folders for media files
- **import**: Import discovered files into library
- **metadata**: Fetch metadata from OMDB/TMDB/iTunes
- **backup**: Backup library data
- **encrypt**: Encrypt sensitive data
- **download**: Download remote content

## Usage

### Enqueueing a Job

```typescript
import { enqueueJob } from '@/services/jobQueue'

// Simple job
const jobId = enqueueJob(
  'scan',
  'Scanning Movies Folder',
  {
    description: 'Discovering media files',
    data: { path: '/path/to/movies' }
  }
)

// Job with custom retry limit
const jobId = enqueueJob(
  'metadata',
  'Fetching Metadata',
  {
    description: 'Getting info from OMDB',
    maxRetries: 5,
    data: { title: 'Inception', type: 'movie' }
  }
)
```

### Registering Custom Job Handlers

```typescript
import { registerJobHandler } from '@/services/jobQueue'

registerJobHandler('custom-type', async (job, updateProgress) => {
  // Your job logic here
  updateProgress(25)
  await doSomeWork()
  
  updateProgress(50)
  await doMoreWork()
  
  updateProgress(100)
  
  // Store results in job.data for later retrieval
  job.data = { ...job.data, result: 'success' }
})
```

### Sending Notifications

```typescript
import { useNotificationsStore } from '@/store/notificationsStore'

const { addNotification } = useNotificationsStore.getState()

// Success notification (auto-dismisses)
addNotification({
  type: 'success',
  title: 'Import Complete',
  message: 'Added 42 items to your library',
  dismissable: true,
})

// Error with action button
addNotification({
  type: 'error',
  title: 'Scan Failed',
  message: 'Could not access folder',
  dismissable: true,
  actionLabel: 'Retry',
  actionCallback: () => {
    // Retry logic here
  },
})
```

### Monitoring Job Progress

```typescript
import { useJobQueueStore } from '@/store/jobQueueStore'

// Watch for job completion
const checkJob = () => {
  const job = useJobQueueStore.getState().getJob(jobId)
  
  if (job?.status === 'completed') {
    console.log('Job finished!', job.data)
  } else if (job?.status === 'failed') {
    console.error('Job failed:', job.error)
  } else if (job?.status === 'running' || job?.status === 'queued') {
    console.log(`Progress: ${job.progress}%`)
    setTimeout(checkJob, 500)
  }
}

checkJob()
```

## User Interface

### Bell Icon (HeaderBar)
- Click to open Notifications Center
- Shows unread count badge (e.g., "3" or "9+" for 10+)
- Located in top-right of header bar

### Notification Toasts
- Appear in bottom-right corner
- Show up to 3 most recent unread notifications
- Auto-dismiss after 5 seconds (except errors)
- Click to mark as read and dismiss
- Supports action buttons (e.g., "Retry", "View Details")

### Notifications Center (Slide-out Panel)
- Full notification history (last 50)
- Mark individual notifications as read
- "Mark All Read" button
- "Clear All" button to remove all notifications
- Shows notification type icons and timestamps
- Dismissable notifications have X button

## Testing

Console test functions are available in the browser console:

```javascript
// Test different notification types
testNotifications()

// Test a single job
testJobQueue()

// Test multiple concurrent jobs
testMultipleJobs()
```

## Error Handling

Jobs automatically retry on failure with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- Attempt 4: 4 seconds delay
- Attempt 5: 8 seconds delay
- Attempt 6: 16 seconds delay (max)

After max retries, job is marked as failed and error notification is sent with "Retry" action button.

## Current Implementation Status

✅ **Completed:**
- Job queue store with retry/backoff logic
- Notifications store with persistence
- Job queue service with exponential backoff
- Toast notifications with auto-dismiss
- Notifications center slide-out panel
- HeaderBar bell icon with unread badge
- Type-safe implementation
- All job handlers (scan, import, metadata, backup, encrypt, download)
- Debug mode with verbose logging
- Error log viewer page with filtering and search
- Job helper utilities for common operations
- Backup/restore functionality

🔄 **Integrated:**
- Import page uses job queue for folder scanning
- Settings page has debug mode toggle
- Settings page has backup export button
- Error log page accessible from Settings
- Debug logging throughout job execution

📋 **Future Enhancements:**
- Job cancellation UI for running jobs
- Job priority system for urgent tasks
- Parallel job execution for independent tasks
- Restore from backup functionality
- Scheduled/recurring jobs (auto-backup, etc.)
- Job dependencies (chain jobs together)

## Implementation Example: Import Page

The Import page demonstrates real-world usage:

```typescript
// When user clicks "Scan Folder"
const handleScan = async () => {
  // Enqueue scan job
  const jobId = enqueueJob(
    'scan',
    `Scanning ${sourcePath}`,
    {
      description: 'Discovering media files in folder',
      data: { path: sourcePath }
    }
  )
  
  // Poll for completion
  const checkJob = () => {
    const job = useJobQueueStore.getState().getJob(jobId)
    if (job?.status === 'completed' && job.data?.files) {
      setDiscoveredFiles(job.data.files) // Update UI
    }
  }
  
  setTimeout(checkJob, 500)
}
```

## Best Practices

1. **Job Handlers**: Keep handlers focused on a single task
2. **Progress Updates**: Update progress regularly for long operations
3. **Error Messages**: Provide clear, actionable error messages
4. **Data Storage**: Use `job.data` to pass results between jobs
5. **Notifications**: Use appropriate notification types (success/error/warning/info)
6. **Auto-dismiss**: Let success/info notifications auto-dismiss, require manual dismissal for errors
7. **Action Buttons**: Provide retry/view options for errors when applicable

## File Locations

```
src/
├── store/
│   ├── jobQueueStore.ts           # Job queue state management
│   └── notificationsStore.ts      # Notifications state management
├── services/
│   └── jobQueue.ts                # Job execution engine
├── components/
│   ├── HeaderBar.tsx              # Bell icon integration
│   ├── NotificationToast.tsx      # Toast component + container
│   └── NotificationsCenter.tsx    # Slide-out panel
├── utils/
│   └── testNotifications.ts       # Console test utilities
└── pages/
    └── Import.tsx                 # Example integration
```
