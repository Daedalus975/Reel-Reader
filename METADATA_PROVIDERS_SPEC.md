# Reel Reader — Metadata Providers Spec (Copilot-Implementable)

**Doc purpose:** Define a stable, extensible metadata layer for Reel Reader that supports **movies, TV, books, comics, games, podcasts, music, and adult/doujin** catalogs via **provider adapters**, with **normalization**, **caching**, and **user overrides**.

This spec is written so GitHub Copilot can implement it as a set of modules, interfaces, and services.

---

## 0) Principles

1. **Provider adapters, not provider lock-in**  
   Every external source is an adapter behind a consistent interface. Swapping providers should not change UI/business logic.

2. **User overrides always win**  
   If a user edits title/art/tags, those values are **locked** and must not be overwritten by refreshes.

3. **Cache first; refresh on demand**  
   Metadata is stored locally as a snapshot and refreshed only by explicit user action or scheduled jobs.

4. **Respect ToS and rate limits**  
   Use documented APIs/feeds. Avoid brittle scraping as a core dependency.

5. **Adult separation is a first-class constraint**  
   Adult metadata and content must follow the app's **Adult Mode**, **Stealth Mode**, and **Encrypted Library/Vault** policies.

---

## 1) Scope & Non-Goals

### In Scope
- Provider adapter interfaces per media type
- Search + ID lookup + enrichment flows
- Normalization into Reel Reader canonical models
- Matching & confidence scoring
- Caching & refresh strategy
- Provider configuration & secrets handling
- Adult/Doujin/JAV provider separation model

### Non-Goals (for this spec)
- Full UI spec for metadata editing screens
- Full player/streaming rights enforcement
- Building or documenting any unofficial scraping

---

## 2) High-Level Architecture

### Components
- **Provider Registry**: loads configured providers and selects best provider(s) per query
- **Metadata Service**: canonical entry point used by import/indexer and UI
- **Normalizer**: maps provider payloads into canonical models
- **Matcher**: scores candidate matches and selects best result
- **Cache Store**: persists provider results + canonical entities + override locks
- **Jobs**: refresh, enrich, and maintenance tasks

### Suggested folder layout
- `src/features/metadata/core/*`
- `src/features/metadata/providers/*`
- `src/features/metadata/normalize/*`
- `src/features/metadata/match/*`
- `src/features/metadata/cache/*`
- `src/features/metadata/jobs/*`
- `src/shared/types/*`
- `src/shared/utils/*`

---

## 3) Canonical Data Models (TypeScript)

> Keep canonical models provider-agnostic. Store provider IDs as external references.

```ts
export type MediaType =
  | "movie"
  | "tv_series"
  | "tv_episode"
  | "music_track"
  | "music_album"
  | "music_artist"
  | "book"
  | "comic"
  | "game"
  | "podcast"
  | "podcast_episode"
  | "adult_video"
  | "doujin";

export type RatingSource = "user" | "provider" | "system";

export interface ExternalRef {
  providerId: string;        // e.g., "tmdb", "musicbrainz", "openlibrary", "dmm"
  externalId: string;        // provider-specific unique identifier
  url?: string;
}

export interface ImageAsset {
  url: string;
  kind: "poster" | "backdrop" | "cover" | "thumbnail" | "logo";
  width?: number;
  height?: number;
  language?: string;
  score?: number;            // internal ranking
  isUserOverride?: boolean;  // locked by user
}

export interface PersonCredit {
  name: string;
  role: "actor" | "director" | "author" | "artist" | "developer" | "publisher" | "composer" | "other";
  characterName?: string;
  order?: number;
  externalRefs?: ExternalRef[];
}

export interface CanonicalMediaBase {
  id: string;                // Reel Reader canonical ID (UUID)
  mediaType: MediaType;
  title: string;
  altTitles?: string[];
  originalTitle?: string;
  description?: string;
  language?: string;
  genres?: string[];
  tags?: string[];           // Reel Reader tags (user-defined)
  releaseDate?: string;      // ISO date
  year?: number;
  runtimeMinutes?: number;
  images?: ImageAsset[];
  people?: PersonCredit[];
  externalRefs: ExternalRef[];
  providerAttribution?: string[]; // for UI display (optional)

  // Adult controls (see section 10)
  isAdult?: boolean;
  privacyLabel?: "default" | "private" | "hidden";
}
```

---

## 4) Provider Adapter Interfaces

### Shared provider contract
```ts
export interface ProviderContext {
  locale?: string;                  // e.g., "en-US"
  adultMode?: boolean;              // current profile setting
  allowAdultProviders?: boolean;    // derived from adultMode + vault lock status
  preferredLanguages?: string[];    // UI language preferences
  timeZone?: string;
}

export interface ProviderRateLimit {
  maxRequestsPerSecond?: number;
  maxRequestsPerDay?: number;
}

export interface ProviderConfig {
  providerId: string;               // unique id in registry
  enabled: boolean;
  apiKey?: string;                  // store encrypted/securely
  baseUrl?: string;
  rateLimit?: ProviderRateLimit;
  allowAdult?: boolean;             // provider is adult-focused
}

export interface ProviderSearchQuery {
  mediaType: MediaType;
  title?: string;
  year?: number;
  externalId?: string;
  isbn?: string;
  artist?: string;
  album?: string;
  episode?: { season?: number; number?: number; seriesTitle?: string };
  extra?: Record<string, unknown>;
}

export interface ProviderSearchCandidate {
  providerId: string;
  externalId: string;
  title: string;
  year?: number;
  language?: string;
  scoreHint?: number;               // provider's score if available
  url?: string;
  raw?: unknown;
}

export interface ProviderFetchResult {
  providerId: string;
  externalId: string;
  raw: unknown;                     // provider payload (stored for debugging/caching)
  fetchedAt: string;                // ISO date-time
}

export interface MetadataProvider {
  id: string; // same as providerId
  supports: MediaType[];
  isAdultProvider?: boolean;

  search(ctx: ProviderContext, q: ProviderSearchQuery): Promise<ProviderSearchCandidate[]>;
  fetchById(ctx: ProviderContext, mediaType: MediaType, externalId: string): Promise<ProviderFetchResult>;
}
```

### Optional enrichment interface (images/credits)
```ts
export interface EnrichmentProvider {
  enrich(ctx: ProviderContext, canonical: CanonicalMediaBase): Promise<Partial<CanonicalMediaBase>>;
}
```

---

## 5) Normalization Layer

### Goal
Convert `ProviderFetchResult.raw` into a canonical model + externalRefs + images + credits.

```ts
export interface NormalizationResult<T extends CanonicalMediaBase> {
  canonical: T;
  warnings: string[];
}

export interface Normalizer {
  providerId: string;
  normalize(mediaType: MediaType, fetch: ProviderFetchResult): NormalizationResult<any>;
}
```

**Rules**
- Always attach an `ExternalRef` for the provider.
- Prefer `originalTitle` if provided.
- Normalize language to BCP-47 if possible (e.g., `en`, `ja`, `en-US`).
- Convert runtime to minutes; duration to seconds where appropriate.
- Images: store multiple sizes; rank them with `score` for easy selection.

---

## 6) Matching & Confidence Scoring

### Matching steps
1. **Generate search candidates** using best provider(s) for the media type.
2. **Score candidates** using:
   - title similarity (normalized tokens)
   - year proximity
   - runtime proximity (if known)
   - language match (preferredLanguages)
   - series/season/episode structure (for TV episodes)
3. **Auto-select** if score ≥ threshold.
4. Otherwise show **manual match picker**.

### Suggested thresholds
- `AUTO_MATCH_THRESHOLD = 0.87`
- `REVIEW_MATCH_THRESHOLD = 0.75`

### Stored outcome
- store chosen `ExternalRef` as the **primary ref** for that canonical entity
- store the `matchConfidence` and `matchMethod` = `auto|manual`

---

## 7) Caching, Storage, and Refresh

### Storage tables (SQLite suggested)
- `provider_cache`  
  - `providerId`, `mediaType`, `externalId`, `rawJson`, `etag`, `fetchedAt`
- `canonical_media`  
  - `id`, `mediaType`, `canonicalJson`, `updatedAt`
- `external_refs`  
  - `canonicalId`, `providerId`, `externalId`, `isPrimary`
- `user_overrides`  
  - `canonicalId`, `fieldPath`, `valueJson`, `locked`
- `artwork_overrides`  
  - `canonicalId`, `imageUrl`, `kind`, `locked`
- `refresh_jobs`  
  - `jobId`, `canonicalId`, `providerId`, `status`, `scheduledAt`, `lastError`

### Cache policy
- Search results: cache 24h (or shorter if provider rate-limited)
- Fetch-by-id: cache 7–30 days (configurable)
- Refresh only when:
  - user requests "Refresh metadata"
  - scheduled job (optional)
  - missing required fields (optional prompt)

### ETag / conditional requests
If provider supports it, store `etag` and use conditional fetches.

---

## 8) Rate Limiting and Backoff

- Implement a per-provider token bucket limiter:
  - `maxRequestsPerSecond`
  - optional `maxRequestsPerDay`
- Backoff strategy for 429/5xx:
  - exponential backoff with jitter
  - max retries per job (e.g., 5)
- Never block the UI thread; run provider calls as background jobs when scanning.

---

## 9) Error Handling & UX Rules

- If a provider fails:
  - log error in `provider_errors`
  - show non-blocking UI: "Metadata provider unavailable; using local info"
  - offer manual edit + manual match later
- Keep the file playable even with no metadata.
- If the match confidence is low:
  - create a "Needs Review" queue item

---

## 10) Adult, Doujin, JAV Provider Policy

### Constraints
- Adult providers only usable when:
  - profile has **Adult Mode enabled**
  - (if Vault exists) the **adult vault is unlocked**
  - stealth mode is not blocking display (unless explicitly unlocked)

### Separation
- Mark canonical entries from adult sources with:
  - `isAdult: true`
  - `privacyLabel: private|hidden` based on profile settings
- Store adult provider keys and responses in:
  - encrypted local storage (best effort)
  - or in a vault DB if you maintain a separate encrypted database

### Logging
- Do not log raw adult titles/queries to plaintext logs by default.
- Provide a "privacy-safe logging" toggle.

### Provider choices
- Prefer documented APIs/affiliate feeds.
- Avoid brittle scraping dependencies as a default adapter.

---

## 11) Provider Registry & Selection Strategy

### Registry responsibilities
- Load enabled provider configs
- Offer `getProvidersFor(mediaType, ctx)` filtered by adult policy
- Allow "preferred provider order" per media type

### Default selection (example)
- Movies/TV: Provider A → Provider B fallback
- Books: Provider A → Provider B fallback
- Music: Provider A → Provider B fallback
- Podcasts: Provider A → Provider B fallback
- Games: Provider A → Provider B fallback
- Adult/Doujin: Adult provider A → Adult provider B fallback

---

## 12) Provider Configuration & Secrets

### Storage
- Store provider configs in:
  - local settings DB
  - keys encrypted at rest (OS keychain if available)
- Allow per-provider enable/disable from Settings UI.

### Minimal config schema
```json
{
  "providers": [
    { "providerId": "tmdb", "enabled": true, "apiKey": "****", "allowAdult": false },
    { "providerId": "openlibrary", "enabled": true, "allowAdult": false },
    { "providerId": "musicbrainz", "enabled": true, "allowAdult": false },
    { "providerId": "podcastindex", "enabled": true, "apiKey": "****", "allowAdult": false },
    { "providerId": "adultProvider1", "enabled": false, "apiKey": "****", "allowAdult": true }
  ]
}
```

---

## 13) Background Jobs (Metadata)

- `JOB-001 scan_and_match_metadata(sourceId)`
- `JOB-002 fetch_and_normalize_by_external_id(providerId, mediaType, externalId)`
- `JOB-003 refresh_metadata(canonicalId)`
- `JOB-004 enrich_artwork(canonicalId)`
- `JOB-005 detect_duplicates(libraryId)`
- `JOB-006 ai_cleanup_metadata(canonicalId)` (feature-flagged)
- `JOB-007 fetch_subtitles(mediaId)` (feature-flagged)

---

## 14) Testing Requirements

### Unit tests
- Normalizers: raw → canonical
- Match scoring: candidates → best match
- Adult policy: adult provider blocked unless enabled/unlocked
- Cache logic: TTL, ETag behavior, fallback

### Integration tests
- Provider adapter mocked HTTP
- End-to-end import flow: file → match → canonical entity in DB

---

## 15) Observability (Local)

- Provider call metrics: duration, status, retries
- Cache hit rate
- "Needs review" counts
- Last refresh per provider
- Optional crash reporting (opt-in)

---

## 16) Appendix — Required Fields per Media Type

### Movies / Adult Video
- Required: `title`, `year OR releaseDate`, `runtimeMinutes (if known)`, `images.poster (if available)`
- Recommended: `genres`, `people`, `studios`, `altTitles`

### TV Series / Episode
- Series required: `title`, `year OR releaseDate`
- Episode required: `seriesTitle OR seriesId`, `seasonNumber`, `episodeNumber`, `title`

### Books / Comics / Doujin
- Required: `title`, `authors OR people`, `publisher (if known)`
- Recommended: `isbn`, `pageCount`, `seriesName`, `images.cover`

### Music (Artist/Album/Track)
- Artist required: `title=name`
- Album required: `title`, `artistNames`
- Track required: `title`, `artistNames`, `trackNumber`
- Optional: `discNumber`, `lyrics`

### Podcasts
- Podcast required: `title`, `feedUrl OR externalId`
- Episode required: `podcastId`, `title`, `audioUrl (if available)`

### Games
- Required: `title`, `platforms (if known)`, `releaseDate or year`
- Recommended: `developers`, `publishers`, `genres`, `images.cover`

---

## 17) Copilot Implementation Checklist

- [ ] Create provider interfaces (`MetadataProvider`, `Normalizer`, registry)
- [ ] Implement cache tables + repository layer
- [ ] Implement matching + confidence scoring
- [ ] Implement canonical store + external refs
- [ ] Implement user overrides + field locking
- [ ] Implement adult policy gates + vault integration hooks
- [ ] Implement background jobs + retry/backoff
- [ ] Add Settings UI for provider enable/disable + keys
- [ ] Add manual match UI for ambiguous items
- [ ] Add "Refresh metadata" action per item
