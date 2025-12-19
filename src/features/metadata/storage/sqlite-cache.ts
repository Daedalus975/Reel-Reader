/**
 * SQLite Cache Implementation (Section 7 Schema)
 * 
 * Uses Tauri SQL plugin for persistent storage.
 * Install: `cargo add tauri-plugin-sql --features sqlite` in src-tauri/Cargo.toml
 */

import Database from 'tauri-plugin-sql-api'
import {
  CacheService,
  CacheEntry,
  UserOverride,
  ArtworkOverride,
  RefreshJob
} from '../core/cache'
import { CanonicalMedia, ExternalRef } from '../core/models'

export class SQLiteCacheService implements CacheService {
  private db: Database | null = null

  async initialize(): Promise<void> {
    this.db = await Database.load('sqlite:metadata.db')
    await this.createTables()
    console.log('[Cache] SQLite database initialized')
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    // Table 1: Provider cache
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS provider_cache (
        cache_key TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        media_type TEXT NOT NULL,
        response TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        request_hash TEXT NOT NULL
      )
    `)
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_provider ON provider_cache(provider_id)`)
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_expires ON provider_cache(expires_at)`)

    // Table 2: Canonical media
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS canonical_media (
        id TEXT PRIMARY KEY,
        media_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_type ON canonical_media(media_type)`)

    // Table 3: External references
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS external_refs (
        media_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        external_id TEXT NOT NULL,
        url TEXT,
        is_primary INTEGER DEFAULT 0,
        PRIMARY KEY (media_id, provider_id),
        FOREIGN KEY (media_id) REFERENCES canonical_media(id) ON DELETE CASCADE
      )
    `)
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_external_lookup ON external_refs(provider_id, external_id)`)

    // Table 4: User overrides
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS user_overrides (
        media_id TEXT NOT NULL,
        field_path TEXT NOT NULL,
        override_value TEXT NOT NULL,
        override_at TEXT NOT NULL,
        reason TEXT,
        PRIMARY KEY (media_id, field_path),
        FOREIGN KEY (media_id) REFERENCES canonical_media(id) ON DELETE CASCADE
      )
    `)

    // Table 5: Artwork overrides
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS artwork_overrides (
        media_id TEXT NOT NULL,
        image_kind TEXT NOT NULL,
        url TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        locked_at TEXT NOT NULL,
        PRIMARY KEY (media_id, image_kind),
        FOREIGN KEY (media_id) REFERENCES canonical_media(id) ON DELETE CASCADE
      )
    `)

    // Table 6: Refresh jobs
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS refresh_jobs (
        job_id TEXT PRIMARY KEY,
        media_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        scheduled_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        error TEXT,
        next_retry_at TEXT,
        FOREIGN KEY (media_id) REFERENCES canonical_media(id) ON DELETE CASCADE
      )
    `)
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_status ON refresh_jobs(status)`)
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_scheduled ON refresh_jobs(scheduled_at)`)
  }

  // ====== Provider Cache ======

  async getCached(cacheKey: string): Promise<CacheEntry | null> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.select<CacheEntry[]>(
      'SELECT * FROM provider_cache WHERE cache_key = $1',
      [cacheKey]
    )

    if (result.length === 0) return null

    const row = result[0]
    return {
      ...row,
      response: JSON.parse(row.response as any)
    }
  }

  async setCached(entry: CacheEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execute(
      `INSERT OR REPLACE INTO provider_cache 
       (cache_key, provider_id, media_type, response, fetched_at, expires_at, request_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.cacheKey,
        entry.providerId,
        entry.mediaType,
        JSON.stringify(entry.response),
        entry.fetchedAt,
        entry.expiresAt,
        entry.requestHash
      ]
    )
  }

  async invalidate(cacheKey: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.execute('DELETE FROM provider_cache WHERE cache_key = $1', [cacheKey])
  }

  async invalidateProvider(providerId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.execute('DELETE FROM provider_cache WHERE provider_id = $1', [providerId])
  }

  async cleanExpired(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized')

    const now = new Date().toISOString()
    const result = await this.db.execute(
      'DELETE FROM provider_cache WHERE expires_at < $1',
      [now]
    )

    return result.rowsAffected
  }

  // ====== Canonical Media ======

  async getCanonicalById(mediaId: string): Promise<CanonicalMedia | null> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.select<Array<{ id: string; data: string }>>(
      'SELECT * FROM canonical_media WHERE id = $1',
      [mediaId]
    )

    if (result.length === 0) return null

    return JSON.parse(result[0].data)
  }

  async saveCanonical(media: CanonicalMedia): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const now = new Date().toISOString()

    await this.db.execute(
      `INSERT OR REPLACE INTO canonical_media 
       (id, media_type, data, created_at, updated_at)
       VALUES ($1, $2, $3, COALESCE((SELECT created_at FROM canonical_media WHERE id = $1), $4), $5)`,
      [media.id, media.mediaType, JSON.stringify(media), now, now]
    )

    // Save external refs
    if (media.externalRefs && media.externalRefs.length > 0) {
      for (const ref of media.externalRefs) {
        await this.addExternalRef(media.id, ref)
      }
    }
  }

  async deleteCanonical(mediaId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.execute('DELETE FROM canonical_media WHERE id = $1', [mediaId])
  }

  async findByExternalRef(ref: ExternalRef): Promise<CanonicalMedia | null> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.select<Array<{ media_id: string }>>(
      'SELECT media_id FROM external_refs WHERE provider_id = $1 AND external_id = $2',
      [ref.providerId, ref.externalId]
    )

    if (result.length === 0) return null

    return this.getCanonicalById(result[0].media_id)
  }

  // ====== External Refs ======

  async getExternalRefs(mediaId: string): Promise<ExternalRef[]> {
    if (!this.db) throw new Error('Database not initialized')

    const rows = await this.db.select<
      Array<{
        provider_id: string
        external_id: string
        url?: string
        is_primary: number
      }>
    >('SELECT * FROM external_refs WHERE media_id = $1', [mediaId])

    return rows.map((row: any) => ({
      providerId: row.provider_id,
      externalId: row.external_id,
      url: row.url,
      isPrimary: row.is_primary === 1
    }))
  }

  async addExternalRef(mediaId: string, ref: ExternalRef): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execute(
      `INSERT OR REPLACE INTO external_refs 
       (media_id, provider_id, external_id, url, is_primary)
       VALUES ($1, $2, $3, $4, $5)`,
      [mediaId, ref.providerId, ref.externalId, ref.url, ref.isPrimary ? 1 : 0]
    )
  }

  async removeExternalRef(mediaId: string, providerId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execute(
      'DELETE FROM external_refs WHERE media_id = $1 AND provider_id = $2',
      [mediaId, providerId]
    )
  }

  // ====== User Overrides ======

  async getOverrides(mediaId: string): Promise<UserOverride[]> {
    if (!this.db) throw new Error('Database not initialized')

    const rows = await this.db.select<
      Array<{
        field_path: string
        override_value: string
        override_at: string
        reason?: string
      }>
    >('SELECT * FROM user_overrides WHERE media_id = $1', [mediaId])

    return rows.map((row: any) => ({
      mediaId,
      fieldPath: row.field_path,
      overrideValue: JSON.parse(row.override_value),
      overrideAt: row.override_at,
      reason: row.reason
    }))
  }

  async setOverride(override: UserOverride): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execute(
      `INSERT OR REPLACE INTO user_overrides 
       (media_id, field_path, override_value, override_at, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        override.mediaId,
        override.fieldPath,
        JSON.stringify(override.overrideValue),
        override.overrideAt,
        override.reason
      ]
    )
  }

  async removeOverride(mediaId: string, fieldPath: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execute(
      'DELETE FROM user_overrides WHERE media_id = $1 AND field_path = $2',
      [mediaId, fieldPath]
    )
  }

  async isFieldLocked(mediaId: string, fieldPath: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.select<Array<{ field_path: string }>>(
      'SELECT field_path FROM user_overrides WHERE media_id = $1 AND field_path = $2',
      [mediaId, fieldPath]
    )

    return result.length > 0
  }

  // ====== Artwork Overrides ======

  async getArtworkOverrides(mediaId: string): Promise<ArtworkOverride[]> {
    if (!this.db) throw new Error('Database not initialized')

    const rows = await this.db.select<
      Array<{
        image_kind: string
        url: string
        width?: number
        height?: number
        locked_at: string
      }>
    >('SELECT * FROM artwork_overrides WHERE media_id = $1', [mediaId])

    return rows.map((row: any) => ({
      mediaId,
      imageKind: row.image_kind as any,
      url: row.url,
      width: row.width,
      height: row.height,
      lockedAt: row.locked_at
    }))
  }

  async setArtworkOverride(override: ArtworkOverride): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execute(
      `INSERT OR REPLACE INTO artwork_overrides 
       (media_id, image_kind, url, width, height, locked_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        override.mediaId,
        override.imageKind,
        override.url,
        override.width,
        override.height,
        override.lockedAt
      ]
    )
  }

  async removeArtworkOverride(mediaId: string, imageKind: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execute(
      'DELETE FROM artwork_overrides WHERE media_id = $1 AND image_kind = $2',
      [mediaId, imageKind]
    )
  }

  // ====== Refresh Jobs ======

  async enqueueRefresh(
    job: Omit<RefreshJob, 'jobId' | 'status' | 'attempts'>
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized')

    const jobId = crypto.randomUUID()

    await this.db.execute(
      `INSERT INTO refresh_jobs 
       (job_id, media_id, provider_id, priority, status, attempts, max_attempts, scheduled_at)
       VALUES ($1, $2, $3, $4, 'pending', 0, $5, $6)`,
      [jobId, job.mediaId, job.providerId, job.priority, job.maxAttempts, job.scheduledAt]
    )

    return jobId
  }

  async getNextJob(): Promise<RefreshJob | null> {
    if (!this.db) throw new Error('Database not initialized')

    const now = new Date().toISOString()

    const result = await this.db.select<RefreshJob[]>(
      `SELECT * FROM refresh_jobs 
       WHERE status = 'pending' 
       AND (next_retry_at IS NULL OR next_retry_at <= $1)
       ORDER BY 
         CASE priority 
           WHEN 'high' THEN 1 
           WHEN 'normal' THEN 2 
           WHEN 'low' THEN 3 
         END,
         scheduled_at ASC
       LIMIT 1`,
      [now]
    )

    return result.length > 0 ? result[0] : null
  }

  async updateJobStatus(jobId: string, update: Partial<RefreshJob>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (update.status) {
      fields.push(`status = $${paramIndex++}`)
      values.push(update.status)
    }
    if (update.attempts !== undefined) {
      fields.push(`attempts = $${paramIndex++}`)
      values.push(update.attempts)
    }
    if (update.startedAt) {
      fields.push(`started_at = $${paramIndex++}`)
      values.push(update.startedAt)
    }
    if (update.completedAt) {
      fields.push(`completed_at = $${paramIndex++}`)
      values.push(update.completedAt)
    }
    if (update.error) {
      fields.push(`error = $${paramIndex++}`)
      values.push(update.error)
    }
    if (update.nextRetryAt) {
      fields.push(`next_retry_at = $${paramIndex++}`)
      values.push(update.nextRetryAt)
    }

    if (fields.length === 0) return

    values.push(jobId)
    await this.db.execute(
      `UPDATE refresh_jobs SET ${fields.join(', ')} WHERE job_id = $${paramIndex}`,
      values
    )
  }

  async deleteJob(jobId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.execute('DELETE FROM refresh_jobs WHERE job_id = $1', [jobId])
  }

  async getJobsByMediaId(mediaId: string): Promise<RefreshJob[]> {
    if (!this.db) throw new Error('Database not initialized')

    return this.db.select<RefreshJob[]>(
      'SELECT * FROM refresh_jobs WHERE media_id = $1 ORDER BY scheduled_at DESC',
      [mediaId]
    )
  }
}
