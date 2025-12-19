/**
 * Test utility to demonstrate the notifications and job queue system
 * Call these functions from the browser console to test functionality
 */

import { useNotificationsStore } from '@/store/notificationsStore'
import { enqueueJob } from '@/services/jobQueue'

/**
 * Test notifications with different types
 */
export function testNotifications() {
  const store = useNotificationsStore.getState()
  
  // Success notification
  store.addNotification({
    type: 'success',
    title: 'Test Success',
    message: 'This is a success notification that will auto-dismiss in 5 seconds',
    dismissable: true,
  })
  
  // Info notification
  setTimeout(() => {
    store.addNotification({
      type: 'info',
      title: 'Test Info',
      message: 'This is an info notification',
      dismissable: true,
    })
  }, 1000)
  
  // Warning notification
  setTimeout(() => {
    store.addNotification({
      type: 'warning',
      title: 'Test Warning',
      message: 'This is a warning notification',
      dismissable: true,
    })
  }, 2000)
  
  // Error notification (won't auto-dismiss)
  setTimeout(() => {
    store.addNotification({
      type: 'error',
      title: 'Test Error',
      message: 'This is an error notification that requires manual dismissal',
      dismissable: true,
      actionLabel: 'Retry',
      actionCallback: () => {
        console.log('Retry button clicked!')
      },
    })
  }, 3000)
}

/**
 * Test job queue with a simple job
 */
export function testJobQueue() {
  // Enqueue a scan job with fake data
  const jobId = enqueueJob(
    'scan',
    'Test Scan Job',
    {
      description: 'Testing the job queue system',
      data: { path: '/test/path' },
      maxRetries: 2,
    }
  )
  
  console.log(`Enqueued job with ID: ${jobId}`)
  console.log('Check the notifications panel (bell icon) to see job status updates')
}

/**
 * Test multiple concurrent jobs
 */
export function testMultipleJobs() {
  // Enqueue multiple jobs
  enqueueJob('scan', 'Scan Movies Folder', {
    description: 'Scanning /Movies for media files',
    data: { path: '/Movies' },
  })
  
  setTimeout(() => {
    enqueueJob('metadata', 'Fetch Movie Metadata', {
      description: 'Fetching metadata for "Inception"',
      data: { title: 'Inception', type: 'movie' },
    })
  }, 500)
  
  setTimeout(() => {
    enqueueJob('scan', 'Scan TV Shows Folder', {
      description: 'Scanning /TV Shows for media files',
      data: { path: '/TV Shows' },
    })
  }, 1000)
  
  console.log('Enqueued 3 jobs - they will process sequentially')
  console.log('Check the notifications panel to see progress')
}

/**
 * Test backup job
 */
export function testBackup() {
  const { createBackup } = require('@/services/jobHelpers')
  const jobId = createBackup()
  console.log(`Enqueued backup job with ID: ${jobId}`)
  console.log('The backup will download as a JSON file when complete')
}

/**
 * Test download job
 */
export function testDownload() {
  const { downloadFile } = require('@/services/jobHelpers')
  // Download Reel Reader logo from example URL
  const jobId = downloadFile(
    'https://via.placeholder.com/150',
    'test-download.png'
  )
  console.log(`Enqueued download job with ID: ${jobId}`)
}

/**
 * Enable debug mode to see verbose logging
 */
export function enableDebugMode() {
  const { useUIStore } = require('@/store/uiStore')
  useUIStore.getState().setDebugMode(true)
  console.log('Debug mode enabled - check console for detailed job logs')
}

/**
 * Disable debug mode
 */
export function disableDebugMode() {
  const { useUIStore } = require('@/store/uiStore')
  useUIStore.getState().setDebugMode(false)
  console.log('Debug mode disabled')
}

// Expose functions globally for console testing
if (typeof window !== 'undefined') {
  ;(window as any).testNotifications = testNotifications
  ;(window as any).testJobQueue = testJobQueue
  ;(window as any).testMultipleJobs = testMultipleJobs
  ;(window as any).testBackup = testBackup
  ;(window as any).testDownload = testDownload
  ;(window as any).enableDebugMode = enableDebugMode
  ;(window as any).disableDebugMode = disableDebugMode
  
  console.log('Test functions available:')
  console.log('  testNotifications() - Test notification toasts')
  console.log('  testJobQueue() - Test a single job')
  console.log('  testMultipleJobs() - Test multiple concurrent jobs')
  console.log('  testBackup() - Test backup export')
  console.log('  testDownload() - Test file download')
  console.log('  enableDebugMode() - Enable verbose logging')
  console.log('  disableDebugMode() - Disable verbose logging')
}
