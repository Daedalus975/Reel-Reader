/**
 * Background Job System (Section 13 of METADATA_PROVIDERS_SPEC.md)
 * 
 * Manages scheduled and on-demand metadata refresh jobs.
 */

import { CacheService, RefreshJob } from '../core/cache'
import { ProviderRegistry } from '../core/registry'
import { SearchQuery, ProviderContext } from '../core/provider'

export type JobType =
  | 'import_scan'       // Scan new imports
  | 'manual_refresh'    // User-triggered refresh
  | 'scheduled_update'  // Periodic update
  | 'missing_metadata'  // Fill incomplete entries
  | 'artwork_fetch'     // Download missing artwork
  | 'external_id_sync'  // Sync with external sources
  | 'bulk_update'       // Bulk operation

export interface JobProgress {
  jobId: string
  type: JobType
  totalItems: number
  completedItems: number
  failedItems: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface JobScheduleOptions {
  priority?: 'high' | 'normal' | 'low'
  maxAttempts?: number
  delaySeconds?: number
}

/**
 * Background job processor
 */
export class JobProcessor {
  private isRunning = false
  private currentJob: RefreshJob | null = null

  constructor(
    private cacheService: CacheService,
    private registry: ProviderRegistry,
    private context: ProviderContext
  ) {}

  /**
   * Start processing jobs from queue
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[JobProcessor] Already running')
      return
    }

    this.isRunning = true
    console.log('[JobProcessor] Started')

    this.processLoop()
  }

  /**
   * Stop processing (gracefully waits for current job)
   */
  async stop(): Promise<void> {
    this.isRunning = false
    console.log('[JobProcessor] Stopping...')

    // Wait for current job to finish
    while (this.currentJob) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('[JobProcessor] Stopped')
  }

  /**
   * Main processing loop
   */
  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const job = await this.cacheService.getNextJob()

        if (!job) {
          // No jobs, wait 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5000))
          continue
        }

        this.currentJob = job
        await this.processJob(job)
        this.currentJob = null
      } catch (error) {
        console.error('[JobProcessor] Loop error:', error)
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: RefreshJob): Promise<void> {
    console.log(`[JobProcessor] Processing job ${job.jobId} for media ${job.mediaId}`)

    // Update status to running
    await this.cacheService.updateJobStatus(job.jobId, {
      status: 'running',
      startedAt: new Date().toISOString()
    })

    try {
      // Get existing canonical media
      const canonical = await this.cacheService.getCanonicalById(job.mediaId)
      if (!canonical) {
        throw new Error('Media not found in canonical store')
      }

      // Build search query from existing data
      const query: SearchQuery = {
        title: canonical.title,
        year: canonical.year,
        mediaType: canonical.mediaType,
        language: canonical.language
      }

      // Fetch updated metadata
      const result = await this.registry.fetchMetadata(query, this.context)

      if (!result.success) {
        throw new Error(result.errors.map(e => e.error).join(', '))
      }

      // Job succeeded
      await this.cacheService.updateJobStatus(job.jobId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      })

      console.log(`[JobProcessor] Completed job ${job.jobId}`)
    } catch (error) {
      console.error(`[JobProcessor] Job ${job.jobId} failed:`, error)

      const newAttempts = job.attempts + 1

      if (newAttempts >= job.maxAttempts) {
        // Max attempts reached, mark as failed
        await this.cacheService.updateJobStatus(job.jobId, {
          status: 'failed',
          attempts: newAttempts,
          completedAt: new Date().toISOString(),
          error: String(error)
        })
      } else {
        // Retry with exponential backoff
        const backoff = this.registry['rateLimiter'].getBackoffStrategy()
        const delayMs = backoff.getDelay(newAttempts)
        const nextRetry = new Date(Date.now() + delayMs).toISOString()

        await this.cacheService.updateJobStatus(job.jobId, {
          status: 'pending',
          attempts: newAttempts,
          error: String(error),
          nextRetryAt: nextRetry
        })

        console.log(`[JobProcessor] Job ${job.jobId} will retry at ${nextRetry}`)
      }
    }
  }

  /**
   * Schedule a refresh job for a media item
   */
  async scheduleRefresh(
    mediaId: string,
    providerId: string,
    options: JobScheduleOptions = {}
  ): Promise<string> {
    const scheduledAt = new Date(
      Date.now() + (options.delaySeconds ?? 0) * 1000
    ).toISOString()

    return this.cacheService.enqueueRefresh({
      mediaId,
      providerId,
      priority: options.priority ?? 'normal',
      maxAttempts: options.maxAttempts ?? 3,
      scheduledAt
    })
  }

  /**
   * Schedule bulk refresh for multiple items
   */
  async scheduleBulkRefresh(
    mediaIds: string[],
    providerId: string,
    options: JobScheduleOptions = {}
  ): Promise<string[]> {
    const jobIds: string[] = []

    for (const mediaId of mediaIds) {
      const jobId = await this.scheduleRefresh(mediaId, providerId, options)
      jobIds.push(jobId)
    }

    return jobIds
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<RefreshJob | null> {
    // TODO: implement getJobById in cache service
    return null
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<void> {
    await this.cacheService.deleteJob(jobId)
  }

  /**
   * Get all jobs for a media item
   */
  async getMediaJobs(mediaId: string): Promise<RefreshJob[]> {
    return this.cacheService.getJobsByMediaId(mediaId)
  }
}

/**
 * Scheduled job manager for periodic updates
 */
export class JobScheduler {
  private timers = new Map<string, NodeJS.Timeout>()

  constructor(private processor: JobProcessor) {}

  /**
   * Schedule periodic refresh for all media (daily at 3 AM)
   */
  startDailyRefresh(): void {
    const scheduleNext = () => {
      const now = new Date()
      const next = new Date()
      next.setHours(3, 0, 0, 0) // 3 AM

      if (next <= now) {
        next.setDate(next.getDate() + 1) // Tomorrow
      }

      const delay = next.getTime() - now.getTime()

      const timer = setTimeout(async () => {
        await this.runDailyRefresh()
        scheduleNext() // Schedule next run
      }, delay)

      this.timers.set('daily_refresh', timer)

      console.log(`[JobScheduler] Next daily refresh at ${next.toISOString()}`)
    }

    scheduleNext()
  }

  /**
   * Run daily refresh job
   */
  private async runDailyRefresh(): Promise<void> {
    console.log('[JobScheduler] Starting daily refresh')
    // Implementation: query all canonical media, schedule refresh jobs
    // This would be integrated with your libraryStore to get all media IDs
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    for (const [name, timer] of this.timers) {
      clearTimeout(timer)
      console.log(`[JobScheduler] Stopped ${name}`)
    }
    this.timers.clear()
  }
}
