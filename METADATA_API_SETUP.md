# Metadata API Setup Guide

This guide will help you configure various metadata sources for Reel Reader to automatically fetch information about your media.

## 📋 Table of Contents

1. [TMDB (The Movie Database)](#tmdb) - Movies & TV Shows
2. [OMDB (Open Movie Database)](#omdb) - Movies & TV Shows
3. [TVDB (TheTVDB)](#tvdb) - TV Shows
4. [MusicBrainz](#musicbrainz) - Music
5. [Last.fm](#lastfm) - Music
6. [Google Books API](#google-books) - Books
7. [Open Library](#open-library) - Books
8. [JAV Metadata](#jav-metadata) - Adult Movies
9. [Doujinshi Metadata](#doujinshi-metadata) - Adult Books

---

## TMDB (The Movie Database)

**Best for:** Movies and TV Shows
**Cost:** Free (1000 requests/day)
**Quality:** ⭐⭐⭐⭐⭐ Excellent

### Setup Steps:

1. Go to https://www.themoviedb.org/signup
2. Create a free account
3. Verify your email
4. Visit https://www.themoviedb.org/settings/api
5. Click "Request an API Key"
6. Select "Developer" option
7. Fill out the application form:
   - Application Name: `Reel Reader`
   - Application URL: `http://localhost` (or your personal website)
   - Application Summary: `Personal media library manager`
8. Accept the terms and submit
9. Copy your **API Key (v3 auth)**

### Where to add in Reel Reader:
- Go to **Settings** > **Advanced** > **Metadata Settings**
- Paste your API key in the **TMDB API Key** field
- Enable TMDB source

### What you get:
- Movie/TV titles, descriptions, release dates
- High-quality posters and backdrops
- Cast and crew information
- Ratings and genres
- Studio/network information
- Runtime and episode details

---

## OMDB (Open Movie Database)

**Best for:** Movies and TV Shows (alternative/backup to TMDB)
**Cost:** Free (1000 requests/day), Paid plans available
**Quality:** ⭐⭐⭐⭐ Good

### Setup Steps:

1. Go to http://www.omdbapi.com/apikey.aspx
2. Select "FREE" plan (1000 requests/day)
3. Enter your email address
4. Check your email for activation link
5. Click the activation link
6. Your API key will be displayed and emailed to you

### Where to add in Reel Reader:
- Go to **Settings** > **Advanced** > **Metadata Settings**
- Paste your API key in the **OMDB API Key** field
- Enable OMDB source (lower priority than TMDB)

---

## TVDB (TheTVDB)

**Best for:** TV Shows with episode-specific data
**Cost:** Free for personal use
**Quality:** ⭐⭐⭐⭐⭐ Excellent for TV

### Setup Steps:

1. Go to https://thetvdb.com/
2. Create a free account
3. Log in and go to https://thetvdb.com/dashboard/account/apikey
4. Generate a new API key
5. Copy the **API Key**

### Where to add in Reel Reader:
- Go to **Settings** > **Advanced** > **Metadata Settings**
- Paste your API key in the **TVDB API Key** field
- Enable TVDB source

### What you get:
- Comprehensive episode lists
- Air dates and seasons
- Episode descriptions and ratings
- Series banners and posters

---

## MusicBrainz

**Best for:** Music metadata
**Cost:** Free (no API key required!)
**Quality:** ⭐⭐⭐⭐⭐ Excellent, community-driven

### Setup Steps:

**No API key needed!** MusicBrainz is completely free.

### Where to enable in Reel Reader:
- Go to **Settings** > **Advanced** > **Metadata Settings**
- Simply enable **MusicBrainz** source

### What you get:
- Artist names and info
- Album titles and release dates
- Track listings
- Album artwork (via Cover Art Archive)
- Genre and style information

### Rate Limiting:
- Please respect their rate limits (1 request/second)
- App will automatically throttle requests

---

## Last.fm

**Best for:** Music metadata and recommendations
**Cost:** Free
**Quality:** ⭐⭐⭐⭐ Good

### Setup Steps:

1. Go to https://www.last.fm/api/account/create
2. Create a free Last.fm account if you don't have one
3. Fill out the API account form:
   - Application name: `Reel Reader`
   - Application description: `Personal media library manager`
   - Callback URL: `http://localhost`
4. Submit the form
5. Copy your **API Key**

### Where to add in Reel Reader:
- Go to **Settings** > **Advanced** > **Metadata Settings**
- Paste your API key in the **Last.fm API Key** field
- Enable Last.fm source

---

## Google Books API

**Best for:** Books metadata
**Cost:** Free (1000 requests/day)
**Quality:** ⭐⭐⭐⭐ Very Good

### Setup Steps:

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable the **Google Books API**:
   - Search for "Books API" in the API Library
   - Click "Enable"
4. Go to **Credentials** tab
5. Click "Create Credentials" > "API Key"
6. Copy your API key
7. (Optional) Restrict your key to Books API only for security

### Where to add in Reel Reader:
- Go to **Settings** > **Advanced** > **Metadata Settings**
- Paste your API key in the **Google Books API Key** field
- Enable Google Books source

### What you get:
- Book titles, authors, publishers
- Descriptions and summaries
- Cover images
- ISBN numbers
- Page counts and publication dates

---

## Open Library

**Best for:** Books metadata (no API key required!)
**Cost:** Free
**Quality:** ⭐⭐⭐ Good, community-driven

### Setup Steps:

**No API key needed!** Open Library is completely free.

### Where to enable in Reel Reader:
- Go to **Settings** > **Advanced** > **Metadata Settings**
- Simply enable **Open Library** source

---

## JAV Metadata

**Best for:** Japanese Adult Videos
**Cost:** Free (scraping-based)
**Quality:** ⭐⭐⭐ Good

### Available Sources:

#### 1. R18.com (DMM)
- Official JAV distributor
- Requires web scraping (no official API)
- Best for: Cover images, actress names, release dates

#### 2. JAVLibrary
- Community database
- Requires web scraping
- Best for: Product codes, series information, tags

### Setup:

**Note:** These sources require web scraping which may need:
- CORS proxy or backend service
- Respectful rate limiting
- User consent for adult content

### Where to enable in Reel Reader:
- Go to **Account** > **Metadata & Import Settings**
- Enable **Adult content metadata** (requires adult profile)
- Sources will be automatically used when scanning JAV libraries

### Automatic Detection:

The app will automatically detect JAV content from:
- **Product codes** in filenames: `IPX-123`, `SSIS-456`, `MIDE-789`
- **Pattern**: `[STUDIO]-[NUMBER]`

### Example Filenames:
```
IPX-123 Actress Name.mp4
[Studio] SSIS-456 Title Here (1080p).mkv
MIDE-789.mkv
```

---

## Doujinshi Metadata

**Best for:** Adult manga/doujinshi
**Cost:** Free (scraping-based)
**Quality:** ⭐⭐⭐ Good

### Automatic Detection:

The app will automatically extract metadata from:

#### Filename Patterns:
```
[Circle Name] Title (Event) [Language].cbz
(Event) [Circle Name] Title [Tags].zip
[Artist (Circle)] Title [Language].pdf
(123456) [Circle] Title.cbz   # With gallery ID
```

#### What gets extracted:
- **Circle/Artist name** from `[Circle]` or `[Artist (Circle)]`
- **Event** from `(Comiket)`, `(C99)`, `(COMIC1)`, etc.
- **Language** from `[EN]`, `[JP]`, `[CH]`, etc.
- **Tags** from additional `[tag1][tag2]` brackets
- **Gallery ID** from `(123456)` at start

### Setup:

**Note:** Adult content APIs require:
- User consent
- Privacy considerations
- Respectful usage

### Where to enable in Reel Reader:
- Go to **Account** > **Metadata & Import Settings**
- Enable **Adult content metadata** (requires adult profile)

---

## 🎯 Recommended Setup

### For Movies & TV Shows:
1. **TMDB** (primary) - Best overall quality
2. **OMDB** (fallback) - Good backup source
3. **TVDB** (TV-specific) - Detailed episode data

### For Music:
1. **MusicBrainz** (primary) - No API key needed!
2. **Last.fm** (secondary) - Additional info and recommendations
3. **Spotify** (if connected) - Your playlists and library

### For Books:
1. **Google Books** (primary) - Best cover images and descriptions
2. **Open Library** (fallback) - No API key needed!

### For Adult Content:
1. **Filename parsing** (always enabled)
2. **R18/JAVLibrary** (for JAV) - Automatic with opt-in
3. **Gallery ID parsing** (for doujinshi) - Automatic with opt-in

---

## 💡 Best Practices

1. **Enable multiple sources** for better coverage
2. **Set priorities** in Metadata Settings (TMDB > OMDB > TVDB)
3. **Use .nfo files** for media you already have detailed info for
4. **Organize filenames** using standard patterns for better parsing
5. **Opt-in for adult content** metadata to respect privacy

---

## 🔒 Privacy & Security

- API keys are stored **locally only** (never sent to external servers except the APIs)
- Adult content metadata is **opt-in** and requires adult profile
- All metadata fetching is **optional** and can be disabled
- Rate limits are **automatically respected**
- No data is collected or shared by Reel Reader

---

## 📝 Filename Best Practices

### Movies:
```
Movie Title (2020) [1080p].mp4
Movie Title (2020) [BluRay][x265].mkv
```

### TV Shows:
```
Show Name S01E05 Episode Title.mkv
Show.Name.1x05.720p.WEB-DL.mkv
```

### Music:
```
Artist - Song Title.mp3
Artist - Album Name - 01 Track Title.mp3
```

### Books:
```
Author Name - Book Title (2020).epub
Book Title - Author.pdf
```

### JAV:
```
IPX-123 Actress Name.mp4
[Studio] SSIS-456 Title (1080p).mkv
```

### Doujinshi:
```
[Circle Name] Title (C99) [EN].cbz
(123456) [Artist (Circle)] Title [Digital].zip
```

---

## 🆘 Troubleshooting

### "Metadata not fetching"
- Check that auto-fetch is enabled in Account settings
- Verify API keys are correct
- Check console for error messages
- Ensure you haven't exceeded rate limits

### "API key invalid"
- Re-copy the key (watch for extra spaces)
- Verify the key is activated (check email)
- Make sure you're using the correct key type (API v3 for TMDB)

### "Adult content not working"
- Verify you're in an adult-enabled profile
- Check that adult content metadata is enabled in Account settings
- Ensure filenames follow standard patterns

---

## 📚 Resources

- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [OMDB API Documentation](http://www.omdbapi.com/)
- [TVDB API Documentation](https://thetvdb.github.io/v4-api/)
- [MusicBrainz API Documentation](https://musicbrainz.org/doc/MusicBrainz_API)
- [Google Books API Documentation](https://developers.google.com/books/docs/v1/using)
- [Kodi .nfo File Format](https://kodi.wiki/view/NFO_files)
