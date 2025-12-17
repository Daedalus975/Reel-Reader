# API Spec — Reel Reader

Base URL: `${API_BASE_URL}` from [.env.template](.env.template)

## `GET /api/media/:id`
Returns metadata and asset references for a single media item.
```json
{
  "id": "abc123",
  "type": "movie",
  "title": "Piku",
  "year": 2015,
  "genres": ["Comedy", "Drama"],
  "rating": 7.6,
  "language": "EN"
}
```

## `GET /api/media`
List media with filters.
Query params: `type`, `genre`, `language`, `rating`, `search`

## `POST /api/user/watchlist`
Adds or removes content from the user’s watchlist.
```json
{
  "userId": "user_001",
  "mediaId": "abc123",
  "action": "add" // or "remove"
}
```

## `POST /api/import`
Trigger local scan + metadata enrichment.
```json
{
  "path": "C:/Movies",
  "mediaType": "movie"
}
```

Notes
- Rate limit write endpoints
- Auth required for user-specific actions
- Adult-mode filters applied server-side