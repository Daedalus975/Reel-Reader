/**
 * Rate Limiting (Section 8 of METADATA_PROVIDERS_SPEC.md)
 * 
 * Token bucket algorithm for API rate limiting with backoff.
 */

import { RateLimiter, BackoffStrategy } from './provider'

interface TokenBucket {
  tokens: number
  capacity: number
  refillRate: number // tokens per second
  lastRefill: number // timestamp
}

/**
 * Rate limiter service using token bucket algorithm
 */
export class RateLimiterService implements RateLimiter {
  private buckets = new Map<string, TokenBucket>()
  private backoff = new ExponentialBackoff()

  /**
   * Wait until a token is available for the provider
   */
  async throttle(providerId: string): Promise<void> {
    const bucket = this.getBucket(providerId)

    // Refill tokens based on elapsed time
    this.refillBucket(bucket)

    // If no tokens available, wait
    if (bucket.tokens < 1) {
      const waitTime = (1 - bucket.tokens) / bucket.refillRate * 1000
      console.log(`[RateLimiter] Waiting ${waitTime}ms for ${providerId}`)
      await this.sleep(waitTime)
      await this.throttle(providerId) // recursive retry
      return
    }

    // Consume one token
    bucket.tokens -= 1
  }

  /**
   * Reset rate limit for provider
   */
  reset(providerId: string): void {
    const bucket = this.buckets.get(providerId)
    if (bucket) {
      bucket.tokens = bucket.capacity
      bucket.lastRefill = Date.now()
    }
  }

  /**
   * Configure rate limit for provider
   */
  configure(providerId: string, requestsPerMinute: number): void {
    const refillRate = requestsPerMinute / 60 // tokens per second
    const capacity = Math.max(requestsPerMinute / 2, 10) // bucket size

    this.buckets.set(providerId, {
      tokens: capacity,
      capacity,
      refillRate,
      lastRefill: Date.now()
    })

    console.log(
      `[RateLimiter] Configured ${providerId}: ${requestsPerMinute} req/min, capacity ${capacity}`
    )
  }

  private getBucket(providerId: string): TokenBucket {
    let bucket = this.buckets.get(providerId)
    if (!bucket) {
      // Default: 60 requests per minute
      const refillRate = 1 // 1 token per second
      bucket = {
        tokens: 30,
        capacity: 30,
        refillRate,
        lastRefill: Date.now()
      }
      this.buckets.set(providerId, bucket)
    }
    return bucket
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now()
    const elapsed = (now - bucket.lastRefill) / 1000 // seconds
    const tokensToAdd = elapsed * bucket.refillRate

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get backoff strategy for retries
   */
  getBackoffStrategy(): BackoffStrategy {
    return this.backoff
  }
}

/**
 * Exponential backoff for retries
 */
export class ExponentialBackoff implements BackoffStrategy {
  readonly maxAttempts = 5
  private readonly baseDelay = 1000 // 1 second
  private readonly maxDelay = 60000 // 60 seconds

  getDelay(attempt: number): number {
    if (attempt >= this.maxAttempts) {
      return -1 // no more retries
    }

    // Exponential: 1s, 2s, 4s, 8s, 16s, ... (capped at maxDelay)
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay)

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay
    return delay + jitter
  }
}
