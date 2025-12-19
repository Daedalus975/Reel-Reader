ProviderManagementPanel.tsx:108 
 Connection test failed: TypeError: Cannot read properties of undefined (reading 'id')
    at buildProviderContext (integration.ts:22:19)
    at handleTestConnection (ProviderManagementPanel.tsx:90:23)
    at onClick (ProviderManagementPanel.tsx:182:38)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
    at invokeGuardedCallback (react-dom.development.js:4277:31)
    at invokeGuardedCallbackAndCatchFirstError (react-dom.development.js:4291:25)
    at executeDispatch (react-dom.development.js:9041:3)
    at processDispatchQueueItemsInOrder (react-dom.development.js:9073:7)
    at processDispatchQueue (react-dom.development.js:9086:5)
# Quick Test Guide - Metadata System

## ✅ Setup Complete!

The metadata system is now installed and ready to test.

### What Was Installed:
1. ✅ Tauri SQL Plugin (v1 branch from plugins-workspace)
2. ✅ SQL plugin registered in main.rs
3. ✅ Metadata service initialized in App.tsx
4. ✅ Backend built successfully

---

## 🚀 Testing Steps

### Step 1: Get TMDB API Key (Free)

1. Go to https://www.themoviedb.org/signup
2. Create a free account
3. Go to Settings → API → Request API Key
4. Choose "Developer" option
5. Fill in:
   - **Application Name**: Reel Reader
   - **Application URL**: http://localhost
   - **Application Summary**: Personal media manager
6. Copy your **API Key (v3 auth)**

### Step 2: Configure API Key

1. Start the app: `npm run dev`
2. Go to **Settings → Advanced**
3. Scroll to **Metadata Providers** section
4. Paste your TMDB API key
5. Click **Save API Key**
6. Click **Test Connection** - should show "✓ Connected"

### Step 3: Enable Auto-Fetch

1. Go to **Account** page
2. Find **Metadata & Import Settings** section
3. Enable these checkboxes:
   - ✅ Auto-fetch metadata
   - ✅ Parse filenames
   - ✅ Scan for .nfo files

### Step 4: Test Import

#### Option A: Quick Test (Manual API Call)

Open browser console (F12) and run:

```javascript
// Test the metadata service (in dev mode)
const testMetadata = async () => {
  const { metadataService } = await import('./src/features/metadata/index.ts')
  const context = window.__metadataContext
  
  const result = await metadataService.fetchForImport(
    '/path/to/The Matrix (1999).mp4',
    'movie',
    context
  )
  
  console.log('Metadata Result:', result)
  if (result.success) {
    console.log('Title:', result.canonical.title)
    console.log('Year:', result.canonical.year)
    console.log('Description:', result.canonical.description)
    console.log('Poster:', result.canonical.images?.[0]?.url)
    console.log('Genres:', result.canonical.genres)
  } else {
    console.log('Errors:', result.errors)
  }
}

testMetadata()
```

#### Option B: Full Import Flow

1. Go to a library (Movies, TV Shows, etc.)
2. Click **Library Settings** link
3. Add a source folder with test movies
4. Click **Scan Now**
5. Watch the console for metadata fetch logs
6. Check if movies have:
   - ✅ Correct title
   - ✅ Poster image
   - ✅ Description
   - ✅ Year, genres, cast

### Step 5: Verify Database

The SQLite database is created at: `metadata.db`

Check if it exists:
```powershell
Get-ChildItem -Path $env:LOCALAPPDATA\reel-reader -Filter "*.db"
```

---

## 🐛 Troubleshooting

### No metadata appears
- Check console for errors
- Verify API key is saved (localStorage.getItem('tmdb_api_key'))
- Check if auto-fetch is enabled in Account settings
- Try manual refresh button on a movie

### "Database not initialized" error
- Check if metadataService.initialize() ran (look for console log)
- Make sure you have a profile selected
- Restart the app

### "Rate limit exceeded"
- You hit TMDB's 40 requests/minute limit
- Wait 60 seconds and try again
- For bulk imports, add delays between files

### Build errors
- If Cargo.toml changes don't work, try:
  ```powershell
  cd src-tauri
  cargo clean
  cargo build
  ```

---

## 📊 What to Look For

### Console Logs (F12)
```
[App] Metadata service initialized
[Registry] Registered provider: The Movie Database
[RateLimiter] Configured tmdb: 40 req/min, capacity 20
[Cache] SQLite database initialized
[Registry] Found 3 results from The Movie Database
[Registry] Cache hit for tmdb:550
[JobProcessor] Started
```

### Successful Import
A movie with metadata should have:
- **Title**: "The Matrix"
- **Year**: 1999
- **Poster**: Full URL to TMDB image
- **Description**: Plot summary
- **Genres**: ["Action", "Science Fiction"]
- **Cast**: Keanu Reeves, etc.
- **canonicalId**: UUID
- **externalRefs**: [{ providerId: "tmdb", externalId: "603" }]

### Database Tables Created
6 tables should exist:
1. provider_cache
2. canonical_media
3. external_refs
4. user_overrides
5. artwork_overrides
6. refresh_jobs

---

## 🎯 Next Tests

After basic import works:

### Test Manual Refresh
1. Go to a movie detail page
2. Click "Refresh Metadata" button
3. Check console for job scheduling
4. Refresh page to see updated metadata

### Test Field Locking
1. Edit a movie title manually
2. Click lock icon 🔒 next to title field
3. Try refreshing metadata
4. Title should stay locked (not overwritten)

### Test Low Confidence Match
1. Import a file with ambiguous name like "movie.mp4"
2. Should trigger Manual Match Dialog
3. Review candidates and select correct one

### Test Cache
1. Import a movie (fetches from TMDB)
2. Delete the movie from library
3. Re-import same movie
4. Should be instant (cache hit - check console)

---

## 📝 Example Test Movies

Use files named like this for best results:
- ✅ `The Matrix (1999).mp4`
- ✅ `Inception.2010.1080p.BluRay.mp4`
- ✅ `Game of Thrones S01E01.mkv`
- ❌ `movie1.mp4` (too vague)
- ❌ `file.avi` (no metadata)

---

## 🆘 Need Help?

1. Check [METADATA_SETUP_GUIDE.md](METADATA_SETUP_GUIDE.md) for detailed troubleshooting
2. Check [METADATA_IMPLEMENTATION_STATUS.md](METADATA_IMPLEMENTATION_STATUS.md) for architecture details
3. Look at console errors (F12)
4. Check if TMDB API is working: https://api.themoviedb.org/3/configuration?api_key=YOUR_KEY

---

## ✅ Success Checklist

- [ ] Tauri backend built successfully
- [ ] App starts without errors
- [ ] TMDB API key configured
- [ ] Test connection shows "Connected"
- [ ] Auto-fetch enabled in settings
- [ ] Imported movie has poster and description
- [ ] Console shows "[Cache] SQLite database initialized"
- [ ] Database file exists (metadata.db)
- [ ] Manual refresh works
- [ ] Cache hit works on re-import

When all checked, the metadata system is fully operational! 🎉
