# OMDb Integration Setup

The app uses OMDb (Open Movie Database) to search and auto-populate media metadata including posters, ratings, genres, and descriptions.

## Get Started (5 minutes)

### Step 1: Get Your Free OMDb API Key

1. Visit [OMDb API Key Request](http://www.omdbapi.com/apikey.aspx)
2. Enter your email address
3. Select the **free tier** (1,000 requests/day)
4. Click "Submit"
5. Check your email - you'll get your API key instantly
6. Copy the key (looks like: `a1b2c3d4e5f6g7h8`)

### Step 2: Add the Key to Your Environment

Edit `.env.local` in the project root and update:

```env
VITE_OMDB_API_KEY=your_key_here
```

Replace `your_key_here` with your actual OMDb key from step 1.

### Step 3: Restart Dev Server

```bash
npm run web-dev
```

### Step 4: Test It Out

1. Go to the **Import** page
2. In "Search & Import Metadata", search for any movie or TV show (e.g., "Inception", "Breaking Bad")
3. Select the type (Movie or TV)
4. Click "Search"
5. Click any result to add it with full metadata!

---

## Features

✅ **Search** - Find any movie/TV show (1,000 searches/day free)
✅ **Real Posters** - Professional poster images
✅ **Ratings** - IMDb ratings (0-10 scale)
✅ **Genres** - Auto-tag with genres
✅ **Descriptions** - Full plot overviews
✅ **Actors** - Top 3 actors added as tags
✅ **Release Dates** - Accurate year information

---

## Troubleshooting

**"No results found"** → Check that:
1. Your API key is correct in `.env.local`
2. Dev server was restarted after editing .env.local
3. Your search query is spelled correctly
4. You haven't exceeded your 1,000 daily requests (unlikely)

**Search bar not appearing** → Hard refresh browser (Ctrl+Shift+R)

**Still no results?** → Open browser console (F12) and check for error messages

---

## Upgrading (Optional)

If you need more than 1,000 searches/day:
- OMDb paid plans start at $2.99/month
- Or consider switching back to TMDB (requires paid plan too)
- Or use the free tier with smart caching/rate limiting

---

## Manual Entry

You can also manually add media without searching:
1. Scroll down to "Manual Entry"
2. Fill in title, type, year, tags
3. Click "Add Manual Item"

This works even without an API key!


