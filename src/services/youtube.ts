// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_KEY: string | undefined = (import.meta as any).env?.VITE_YOUTUBE_API_KEY
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'

export async function searchYouTubeVideo(query: string): Promise<string | null> {
  if (!API_KEY) {
    console.warn('YouTube API key not configured (VITE_YOUTUBE_API_KEY).')
    return null
  }
  if (!query.trim()) return null

  const params = new URLSearchParams({
    key: API_KEY,
    part: 'snippet',
    type: 'video',
    maxResults: '1',
    q: query,
    videoEmbeddable: 'true',
    safeSearch: 'none',
  })

  try {
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`)
    if (!res.ok) throw new Error(`YouTube search failed: ${res.status}`)
    const data = await res.json()
    const id = data?.items?.[0]?.id?.videoId
    if (!id) return null
    return `https://www.youtube.com/watch?v=${id}`
  } catch (err) {
    console.error('YouTube search error', err)
    return null
  }
}
