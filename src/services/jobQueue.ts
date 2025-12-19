/**
 * Job Queue Service
 * Executes jobs with retry/backoff logic
 */

import { useJobQueueStore, type Job, type JobType } from '@/store/jobQueueStore'
import { useNotificationsStore } from '@/store/notificationsStore'

type JobHandler = (job: Job, updateProgress: (progress: number) => void) => Promise<void>

const jobHandlers = new Map<JobType, JobHandler>()

/**
 * Register a handler for a job type
 */
export function registerJobHandler(type: JobType, handler: JobHandler) {
  jobHandlers.set(type, handler)
}

/**
 * Calculate backoff delay in milliseconds
 * Exponential backoff: 1s, 2s, 4s, 8s, 16s
 */
function calculateBackoff(retries: number): number {
  return Math.min(1000 * Math.pow(2, retries), 16000)
}

/**
 * Execute a single job
 */
async function executeJob(job: Job): Promise<void> {
  const handler = jobHandlers.get(job.type)
  
  if (!handler) {
    throw new Error(`No handler registered for job type: ${job.type}`)
  }

  const store = useJobQueueStore.getState()
  
  // Mark as running
  store.updateJob(job.id, {
    status: 'running',
    startedAt: Date.now(),
  })
  store.setCurrentJob(job.id)

  try {
    // Execute with progress callback
    await handler(job, (progress) => {
      store.updateJob(job.id, { progress: Math.min(100, Math.max(0, progress)) })
    })
    
    const { debugMode } = await import('@/store/uiStore').then(m => m.useUIStore.getState())
    if (debugMode) {
      console.log(`[Job Queue] Job ${job.id} completed successfully:`, {
        duration: Date.now() - (job.startedAt || 0),
        result: job.data,
      })
    }
        store.updateJob(job.id, {
      status: 'completed',
      progress: 100,
      completedAt: Date.now(),
    })

    // Send success notification
    useNotificationsStore.getState().addNotification({
      type: 'success',
      title: 'Job Completed',
      message: job.title,
      dismissable: true,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if we should retry
    if (job.retries < job.maxRetries) {
      const delay = calculateBackoff(job.retries)
      
      store.updateJob(job.id, {
        status: 'queued',
        error: `${errorMessage} (retry in ${delay / 1000}s)`,
      })
      store.incrementRetry(job.id)

      // Schedule retry
      setTimeout(() => {
        const updatedJob = store.getJob(job.id)
        if (updatedJob && updatedJob.status === 'queued') {
          executeJob(updatedJob)
        }
      }, delay)
    } else {
      // Mark as failed
      const { debugMode } = await import('@/store/uiStore').then(m => m.useUIStore.getState())
      if (debugMode) {
        console.error(`[Job Queue] Job ${job.id} failed after ${job.retries} retries:`, {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          jobData: job.data,
        })
      }
      
      store.updateJob(job.id, {
        status: 'failed',
        error: errorMessage,
        completedAt: Date.now(),
      })

      // Send error notification
      useNotificationsStore.getState().addNotification({
        type: 'error',
        title: 'Job Failed',
        message: `${job.title}: ${errorMessage}`,
        dismissable: true,
        actionLabel: 'Retry',
        actionCallback: () => {
          retryJob(job.id)
        },
      })
    }
  } finally {
    store.setCurrentJob(null)
  }
}

/**
 * Process the job queue
 * Picks the next queued job and executes it
 */
export async function processQueue(): Promise<void> {
  const store = useJobQueueStore.getState()
  
  // Don't process if a job is already running
  if (store.currentJobId) {
    return
  }

  const queuedJobs = store.getJobsByStatus('queued')
  
  if (queuedJobs.length === 0) {
    return
  }

  // Get the oldest queued job
  const nextJob = queuedJobs.sort((a, b) => a.createdAt - b.createdAt)[0]
  
  await executeJob(nextJob)
  
  // Continue processing if there are more jobs
  if (store.getJobsByStatus('queued').length > 0) {
    setTimeout(processQueue, 100)
  }
}

/**
 * Add a job to the queue and start processing
 */
export function enqueueJob(
  type: JobType,
  title: string,
  options?: {
    description?: string
    maxRetries?: number
    data?: Record<string, any>
  }
): string {
  const store = useJobQueueStore.getState()
  
  const jobId = store.addJob({
    type,
    title,
    description: options?.description,
    maxRetries: options?.maxRetries ?? 3,
    data: options?.data,
  })

  // Send queued notification
  useNotificationsStore.getState().addNotification({
    type: 'info',
    title: 'Job Queued',
    message: title,
    dismissable: true,
  })

  // Start processing
  setTimeout(processQueue, 100)

  return jobId
}

/**
 * Retry a failed job
 */
export function retryJob(jobId: string): void {
  const store = useJobQueueStore.getState()
  const job = store.getJob(jobId)

  if (!job || job.status !== 'failed') {
    return
  }

  store.updateJob(jobId, {
    status: 'queued',
    retries: 0,
    error: undefined,
  })

  setTimeout(processQueue, 100)
}

/**
 * Cancel a running or queued job
 */
export function cancelJob(jobId: string): void {
  const store = useJobQueueStore.getState()
  const job = store.getJob(jobId)

  if (!job || (job.status !== 'queued' && job.status !== 'running')) {
    return
  }

  store.updateJob(jobId, {
    status: 'cancelled',
    completedAt: Date.now(),
  })

  if (store.currentJobId === jobId) {
    store.setCurrentJob(null)
  }
}

// Real job handlers

registerJobHandler('import', async (job, updateProgress) => {
  // Import job: add media items from discovered files
  const { files, mediaStore } = job.data as { files: string[]; mediaStore: any }
  const total = files.length
  
  for (let i = 0; i < total; i++) {
    const filePath = files[i]
    const name = filePath.split(/[\\\/]/).pop() || filePath
    const now = new Date()
    
    mediaStore.addMedia({
      id: `${now.getTime()}-${i}`,
      title: name,
      type: 'movie',
      year: undefined,
      genres: [],
      language: 'EN',
      rating: undefined,
      poster: undefined,
      backdrop: undefined,
      description: filePath,
      isAdult: false,
      tags: [],
      watched: false,
      isFavorite: false,
      dateAdded: now,
    })
    
    updateProgress(Math.round(((i + 1) / total) * 100))
    // Small delay to prevent UI freezing
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
})

registerJobHandler('scan', async (job, updateProgress) => {
  // Scan job: recursively scan folder for media files
  const { path } = job.data as { path: string }
  updateProgress(10)
  
  // Import scanner dynamically
  const { scanSource } = await import('../features/import/importScanner')
  
  updateProgress(30)
  
  const source = {
    id: `scan-${Date.now()}`,
    name: path,
    type: 'folder' as const,
    path,
    enabled: true,
    createdAt: new Date().toISOString(),
  }
  
  const files = await scanSource(source)
  updateProgress(90)
  
  // Store files in job data for follow-up import job
  job.data = { ...job.data, files }
  updateProgress(100)
})

registerJobHandler('metadata', async (job, updateProgress) => {
  // Metadata job: fetch metadata from OMDB/TMDB for a media item
  const { title, type } = job.data as { title: string; type: string }
  
  updateProgress(20)
  
  try {
    // Import OMDB service
    const { searchOMDb, getPosterUrl, parseRating, parseGenres, parseYear } = await import('../services/omdb')
    
    updateProgress(40)
    
    const omdbType = type === 'tv' ? 'series' : 'movie'
    const results = await searchOMDb(title, omdbType)
    
    updateProgress(80)
    
    if (results.length > 0) {
      const result = results[0]
      const metadata = {
        poster: getPosterUrl(result.Poster),
        rating: parseRating(result.imdbRating),
        genres: parseGenres(result.Genre),
        year: parseYear(result.Year),
        description: result.Plot,
      }
      
      // Store metadata in job data
      job.data = { ...job.data, metadata }
      updateProgress(100)
    } else {
      job.data = { ...job.data, metadata: null }
      updateProgress(100)
    }
  } catch (error) {
    throw new Error(`Failed to fetch metadata: ${error}`)
  }
})

registerJobHandler('backup', async (job, updateProgress) => {
  // Backup job: export library data to JSON file
  const { profileId } = job.data as { profileId?: string }
  
  updateProgress(10)
  
  try {
    // Import stores
    const { useProfileMediaStore } = await import('@/store/profileMediaStore')
    const { useProfileStore } = await import('@/store/profileStore')
    
    updateProgress(30)
    
    const mediaStore = useProfileMediaStore.getState()
    const profileStore = useProfileStore.getState()
    
    // Get data to backup
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      profiles: profileStore.profiles,
      media: profileId 
        ? { [profileId]: mediaStore.getMediaForProfile(profileId) }
        : mediaStore.mediaByProfile,
    }
    
    updateProgress(70)
    
    // Convert to JSON
    const json = JSON.stringify(backupData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    
    updateProgress(90)
    
    // Trigger download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reel-reader-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    job.data = { ...job.data, success: true, filename: a.download }
    updateProgress(100)
  } catch (error) {
    throw new Error(`Failed to create backup: ${error}`)
  }
})

registerJobHandler('encrypt', async (job, updateProgress) => {
  // Encrypt job: encrypt sensitive profile data
  const { profileId, password } = job.data as { profileId: string; password: string }
  
  if (!password) {
    throw new Error('Password is required for encryption')
  }
  
  updateProgress(20)
  
  try {
    updateProgress(50)
    
    // In production, generate key from password using PBKDF2:
    // const encoder = new TextEncoder()
    // const data = encoder.encode(password)
    // const keyMaterial = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'])
    // const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
    
    updateProgress(75)
    
    // For demo purposes, just store encrypted flag
    const { useProfileStore } = await import('@/store/profileStore')
    const profile = useProfileStore.getState().profiles.find(p => p.id === profileId)
    
    if (profile) {
      // In production, encrypt profile.pin with derived key
      job.data = { ...job.data, encrypted: true }
    }
    
    updateProgress(100)
  } catch (error) {
    throw new Error(`Failed to encrypt profile: ${error}`)
  }
})

registerJobHandler('download', async (job, updateProgress) => {
  // Download job: download remote media file
  const { url, filename } = job.data as { url: string; filename: string }
  
  if (!url) {
    throw new Error('URL is required for download')
  }
  
  updateProgress(10)
  
  try {
    // Fetch the file
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }
    
    updateProgress(50)
    
    // Get blob
    const blob = await response.blob()
    
    updateProgress(90)
    
    // Trigger download
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
    
    job.data = { ...job.data, success: true, size: blob.size }
    updateProgress(100)
  } catch (error) {
    throw new Error(`Failed to download file: ${error}`)
  }
})
