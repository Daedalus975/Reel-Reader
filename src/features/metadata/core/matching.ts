/**
 * Matching & Confidence Scoring (Section 5 of METADATA_PROVIDERS_SPEC.md)
 * 
 * Determines if search results match user's media with configurable thresholds.
 */

import { SearchQuery, SearchResult } from './provider'

export interface MatchCandidate {
  searchResult: SearchResult
  confidence: number        // 0-1 score
  reasons: string[]         // explain why this matched
  warnings: string[]        // potential issues
}

export interface MatchResult {
  matched: boolean
  autoApproved: boolean     // true if confidence >= AUTO_MATCH_THRESHOLD
  needsReview: boolean      // true if MIN_CONFIDENCE <= confidence < AUTO_MATCH_THRESHOLD
  candidates: MatchCandidate[]
  bestMatch?: MatchCandidate
}

// Thresholds from spec
export const AUTO_MATCH_THRESHOLD = 0.87  // auto-apply metadata
export const MIN_CONFIDENCE = 0.75        // show for manual review
export const REJECT_THRESHOLD = 0.50      // hide from results

/**
 * Main matching service
 */
export class MatchingService {
  /**
   * Score a search result against the original query
   */
  scoreMatch(query: SearchQuery, result: SearchResult): MatchCandidate {
    let confidence = 0
    const reasons: string[] = []
    const warnings: string[] = []

    // Exact title match (40 points)
    const titleSimilarity = this.calculateTitleSimilarity(query.title, result.title)
    confidence += titleSimilarity * 0.4
    if (titleSimilarity > 0.9) {
      reasons.push('Exact title match')
    } else if (titleSimilarity > 0.7) {
      reasons.push('Very similar title')
    } else if (titleSimilarity < 0.5) {
      warnings.push('Title mismatch')
    }

    // Year match (20 points)
    if (query.year && result.year) {
      const yearDiff = Math.abs(query.year - result.year)
      if (yearDiff === 0) {
        confidence += 0.2
        reasons.push('Exact year match')
      } else if (yearDiff === 1) {
        confidence += 0.15
        reasons.push('Year within 1')
      } else if (yearDiff <= 2) {
        confidence += 0.1
      } else {
        warnings.push(`Year off by ${yearDiff}`)
      }
    }

    // Media type match (20 points) - implicit if result came from correct provider
    confidence += 0.2
    reasons.push('Correct media type')

    // Provider's internal score (20 points)
    if (result.matchScore !== undefined) {
      confidence += result.matchScore * 0.2
      if (result.matchScore > 0.8) {
        reasons.push('High provider confidence')
      }
    }

    // Normalize to 0-1
    confidence = Math.min(confidence, 1.0)

    return {
      searchResult: result,
      confidence,
      reasons,
      warnings
    }
  }

  /**
   * Match query against multiple search results
   */
  matchQuery(query: SearchQuery, results: SearchResult[]): MatchResult {
    const candidates = results
      .map(result => this.scoreMatch(query, result))
      .filter(candidate => candidate.confidence >= REJECT_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence)

    if (candidates.length === 0) {
      return {
        matched: false,
        autoApproved: false,
        needsReview: false,
        candidates: []
      }
    }

    const bestMatch = candidates[0]
    const autoApproved = bestMatch.confidence >= AUTO_MATCH_THRESHOLD
    const needsReview = !autoApproved && bestMatch.confidence >= MIN_CONFIDENCE

    return {
      matched: true,
      autoApproved,
      needsReview,
      candidates,
      bestMatch
    }
  }

  /**
   * String similarity using Levenshtein distance
   */
  private calculateTitleSimilarity(a: string, b: string): number {
    // Normalize: lowercase, remove special chars, trim
    const normalize = (s: string) =>
      s.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

    const normA = normalize(a)
    const normB = normalize(b)

    if (normA === normB) return 1.0

    const distance = this.levenshteinDistance(normA, normB)
    const maxLength = Math.max(normA.length, normB.length)
    return 1 - distance / maxLength
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }
}

/**
 * Manual review item for UI
 */
export interface ReviewItem {
  id: string                // temp ID for review session
  query: SearchQuery
  candidates: MatchCandidate[]
  mediaItemId?: string      // Reel Reader media item if already exists
  filepath?: string         // for new imports
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  selectedCandidateId?: string
}
