# Metadata System Setup Guide

Quick start guide for implementing the metadata provider system in Reel Reader.

## Prerequisites

- Tauri 1.5+ application
- React 18+ with TypeScript
- SQLite support (via tauri-plugin-sql)
- Zustand for state management

## Installation Steps

### 1. Install Dependencies

#### Rust Dependencies

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-sql = { version = "0.1", features = ["sqlite"] }
```

#### Configure Tauri

Update `src-tauri/src/main.rs`:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Rebuild Tauri:
```bash
cd src-tauri
cargo build
```

### 2. Initialize Metadata Service

#### Update App.tsx

```typescript
import { useEffect } from 'react'
import { metadataService } from './features/metadata'
import { buildProviderContext } from './features/metadata/integration'
import { useProfileStore } from './store/profileStore'

function App() {
  const { activeProfile } = useProfileStore()

  useEffect(() => {
    const initMetadata = async () => {
      if (!activeProfile) return

      try {
        // Build context from current profile/settings
        const context = buildProviderContext(
          useProfileStore.getState(),
          {
            tmdbApiKey: localStorage.getItem('tmdb_api_key') ?? undefined
          }
        )

        // Initialize service
        await metadataService.initialize(context)
        console.log('Metadata service initialized')
      } catch (error) {
        console.error('Failed to initialize metadata service:', error)
      }
    }

    initMetadata()

    // Cleanup on unmount
    return () => {
      metadataService.shutdown()
    }
  }, [activeProfile])

  return (
    // Your app content
  )
}
```

### 3. Get TMDB API Key

1. Create account at https://www.themoviedb.org
2. Go to Settings → API → Request API Key
3. Choose "Developer" option
4. Fill in application details:
   - Name: Reel Reader
   - URL: http://localhost (or your domain)
   - Description: Personal media manager
5. Copy the "API Key (v3 auth)" value

### 4. Configure Provider

Users can enter API key in Settings → Advanced → Metadata Providers panel, or you can set it programmatically:

```typescript
import { metadataService } from './features/metadata'

// Save API key
metadataService.updateApiKey('tmdb', 'your-api-key-here')
localStorage.setItem('tmdb_api_key', 'your-api-key-here')
```

### 5. Integrate with Source Folder Scanning

#### Update sourceFoldersStore.ts

```typescript
import {
  scanWithMetadata,
  enhanceMediaWithMetadata,
  buildProviderContext
} from '../features/metadata/integration'
import { useProfileStore } from './profileStore'

// In scanSourceFolder function:
scanSourceFolder: async (folderId) => {
  const folder = get().folders.find(f => f.id === folderId)
  if (!folder) return

  set({ isScanning: true })

  // ... existing file scanning logic ...

  // For each media file found:
  for (const file of mediaFiles) {
    const mediaType = determineMediaType(file.path, folder.type)

    // Build context
    const context = buildProviderContext(
      useProfileStore.getState(),
      { tmdbApiKey: localStorage.getItem('tmdb_api_key') ?? '' }
    )

    // Auto-fetch metadata if enabled
    if (context.librarySettings.autoFetchMetadata) {
      const result = await scanWithMetadata(file.path, mediaType, context)

      if (result.success && result.canonical) {
        // Create media item with canonical metadata
        const baseItem = {
          id: crypto.randomUUID(),
          filepath: file.path,
          filename: file.name,
          filesize: file.size,
          addedAt: new Date().toISOString()
        }

        const enhanced = enhanceMediaWithMetadata(baseItem, result.canonical)
        libraryStore.getState().addMedia(enhanced)
        continue
      }
    }

    // Fallback: create basic item without metadata
    const basicItem = createBasicMediaItem(file)
    libraryStore.getState().addMedia(basicItem)
  }

  set({ isScanning: false })
}
```

### 6. Add UI Components

#### Settings Page

Already integrated! The MetadataSettings component shows in Settings → Advanced.

#### Media Detail Page

Add refresh button to detail views:

```tsx
import { MetadataRefreshButton } from '../components/MetadataActions'

function MovieDetailPage({ movie }: { movie: MediaItem }) {
  return (
    <div>
      {/* ... existing UI ... */}
      
      <div className="mt-4">
        <MetadataRefreshButton
          mediaId={movie.id}
          canonicalId={movie.canonicalId}
          onRefreshComplete={() => refetchMovie()}
        />
      </div>
    </div>
  )
}
```

#### Manual Match Dialog

For low-confidence matches:

```tsx
import { useState } from 'react'
import { ManualMatchDialog } from '../components/ManualMatchDialog'
import { metadataService } from '../features/metadata'

function ImportReview() {
  const [pendingMatches, setPendingMatches] = useState([])
  const [currentMatch, setCurrentMatch] = useState(null)

  const handleSelectMatch = async (candidateId: string) => {
    // Apply selected match
    // ... implementation
  }

  return (
    <>
      {/* Review UI */}
      
      <ManualMatchDialog
        isOpen={!!currentMatch}
        matchResult={currentMatch}
        mediaTitle={currentMatch?.query.title}
        onSelect={handleSelectMatch}
        onSkip={() => setCurrentMatch(null)}
        onClose={() => setCurrentMatch(null)}
      />
    </>
  )
}
```

### 7. Field Locking (Optional)

Allow users to lock metadata fields:

```tsx
import { FieldLockToggle } from '../components/MetadataActions'

function MediaEditForm({ media }: { media: MediaItem }) {
  return (
    <form>
      <div className="flex items-center gap-2">
        <label>Title</label>
        <FieldLockToggle
          canonicalId={media.canonicalId}
          fieldPath="title"
          currentValue={media.title}
          isLocked={media.lockedFields?.includes('title')}
        />
      </div>
      <input value={media.title} onChange={...} />
      
      {/* ... other fields ... */}
    </form>
  )
}
```

## Adult Content Architecture

Adult content is **completely isolated** to Adult profiles:

- Regular profiles: Cannot access adult libraries or adult metadata
- Adult profiles: Require vault unlock + metadata fetch enabled
- No "adult mode toggle" in regular profiles

```typescript
// Adult content only available in Adult profiles
const isAdultProfile = profile.type === 'adult'

if (isAdultProfile && vaultUnlocked && fetchAdultMetadata) {
  // Can fetch adult metadata
}
```

## Testing

### 1. Test Provider Connection

Go to Settings → Advanced → Metadata Providers:
1. Enter TMDB API key
2. Click "Test Connection"
3. Should show "✓ Connected"

### 2. Test Import Flow

1. Add a source folder with movies
2. Enable "Auto-fetch metadata" in Account settings
3. Scan folder
4. Check console for metadata fetch logs
5. Verify movies have titles, posters, descriptions

### 3. Test Manual Refresh

1. Go to movie detail page
2. Click "Refresh Metadata"
3. Check console for job scheduling
4. Wait a few seconds for background job
5. Refresh page to see updated metadata

### 4. Test Cache

1. Import movie (fetches metadata)
2. Clear media library
3. Re-import same movie
4. Should be instant (cache hit)

Check cache:
```typescript
const deleted = await metadataService.cleanCache()
console.log(`Cleaned ${deleted} expired entries`)
```

## Troubleshooting

### Error: "Database not initialized"

**Solution**: Ensure `metadataService.initialize(context)` is called on app startup.

```typescript
// In App.tsx useEffect
await metadataService.initialize(context)
```

### Error: "API key invalid"

**Solutions**:
1. Verify API key from TMDB dashboard
2. Check no extra spaces in key
3. Test connection in settings

### No Metadata Fetched on Import

**Checklist**:
1. Auto-fetch enabled in Account settings?
2. TMDB API key configured?
3. Provider enabled in config?
4. Check console for errors

Debug:
```typescript
const context = buildProviderContext(...)
console.log('Context:', context)
console.log('Auto-fetch enabled:', context.librarySettings.autoFetchMetadata)
console.log('API key present:', !!context.config.apiKey)
```

### Low Match Confidence

**Solutions**:
1. Improve filename:
   - `Bad Example.mkv` → `The Matrix (1999).mkv`
   - `ep5.mp4` → `Game of Thrones S01E05.mp4`
2. Add year to filename
3. Use Manual Match Dialog to select correct result

### Rate Limit Errors

TMDB allows 40 requests/minute. If scanning large library:

```typescript
// Reduce concurrent requests
for (const file of files) {
  await scanWithMetadata(...)
  await new Promise(resolve => setTimeout(resolve, 1500)) // 1.5s delay
}
```

### Performance Issues

**Optimizations**:
1. Clean expired cache regularly
2. Use background jobs for bulk operations
3. Enable caching in provider config

```typescript
// Schedule bulk refresh with low priority
await metadataService.refreshBulk(
  mediaIds,
  'tmdb',
  context,
  { priority: 'low' }
)
```

## Next Steps

1. **Add More Providers**:
   - MusicBrainz for music
   - OpenLibrary for books
   - IGDB for games

2. **Enhance Matching**:
   - Add fuzzy title matching
   - Use file hash matching
   - Implement vote-based selection

3. **UI Improvements**:
   - Progress bar for bulk imports
   - Notification for failed fetches
   - Metadata comparison view

4. **Advanced Features**:
   - Scheduled daily refresh
   - Auto-download artwork
   - Multi-language support
   - User reviews/ratings sync

See [README.md](./README.md) for full API documentation.
See [METADATA_PROVIDERS_SPEC.md](../../METADATA_PROVIDERS_SPEC.md) for architectural details.
