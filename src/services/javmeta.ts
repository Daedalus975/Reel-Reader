// Aggregated JAV metadata providers: FANZA, JavLibrary, R18
// Note: Some providers may have CORS restrictions in a pure browser; Tauri environment can typically fetch.
// We include graceful fallbacks with mock data to avoid breaking UI when a provider fails or is unreachable.

import { searchJAV as searchFanzaJAV, type FanzaItem } from './fanza'

export type JavSource = 'fanza' | 'javlibrary' | 'r18'

export interface JAVResult {
  id: string
  title: string
  poster?: string
  date?: string
  genres: string[]
  makers: string[]
  actors: string[]
  description?: string
  source: JavSource
}

const MOCK_JAV: JAVResult[] = [
  {
    id: 'MOCK-JAVLIB-1',
    title: 'Sample JAVLibrary Title',
    poster: 'https://via.placeholder.com/300x450?text=JAVLibrary',
    date: '2021-01-01',
    genres: ['Drama'],
    makers: ['Sample Studio'],
    actors: ['Sample Actress'],
    source: 'javlibrary',
  },
  {
    id: 'MOCK-R18-1',
    title: 'Sample R18 Title',
    poster: 'https://via.placeholder.com/300x450?text=R18',
    date: '2020-06-10',
    genres: ['Romance'],
    makers: ['R18 Studio'],
    actors: ['R18 Actress'],
    source: 'r18',
  },
]

// JavLibrary scraping (best-effort; HTML structure can change). Works in Tauri; may be blocked in pure browser.
export async function searchJavLibrary(query: string): Promise<JAVResult[]> {
  try {
    const url = `https://www.javlibrary.com/en/vl_searchbyid.php?list&keyword=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } })
    const html = await res.text()

    const results: JAVResult[] = []
    const itemRegex = /<div class="video">([\s\S]*?)<\/div>\s*<\/div>/g
    let match: RegExpExecArray | null
    while ((match = itemRegex.exec(html)) !== null) {
      const block = match[1]
      const titleMatch = block.match(/title="([^"]+)"/)
      const imgMatch = block.match(/src="([^"]+)"/)
      const idMatch = block.match(/v=(\w+)/)
      if (titleMatch) {
        results.push({
          id: idMatch?.[1] || titleMatch[1],
          title: titleMatch[1],
          poster: imgMatch?.[1],
          genres: [],
          makers: [],
          actors: [],
          source: 'javlibrary',
        })
      }
    }

    return results
  } catch (err) {
    console.error('JavLibrary search error', err)
    return []
  }
}

// R18 API (community endpoint). Set VITE_R18_API_BASE to override; default uses r18.dev unofficial API.
// If unreachable, returns empty; mock data used as last resort in combined search.
const R18_BASE: string = (import.meta as any).env?.VITE_R18_API_BASE || 'https://r18.dev'

export async function searchR18(query: string): Promise<JAVResult[]> {
  try {
    const res = await fetch(`${R18_BASE}/api/search?keyword=${encodeURIComponent(query)}&hits=20`)
    if (!res.ok) throw new Error(`R18 HTTP ${res.status}`)
    const data = await res.json()
    const items = data?.items || data?.result || []
    return (items as any[]).map((item) => ({
      id: item.id || item.dmm?.id || item.code || item.video_id || `r18-${item.content_id || Math.random()}`,
      title: item.title || item.name || 'Unknown',
      poster: item.image_url || item.cover || item.thumb || item.thumb_url,
      date: item.release_date || item.date,
      genres: (item.genres || item.genre || []).map((g: any) => g.name || g) || [],
      makers: item.maker ? [item.maker] : [],
      actors: (item.actresses || item.actress || item.casts || []).map((a: any) => a.name || a),
      description: item.description || item.comment,
      source: 'r18',
    }))
  } catch (err) {
    console.error('R18 search error', err)
    return []
  }
}

function mapFanza(items: FanzaItem[]): JAVResult[] {
  return items.map((i) => ({
    id: i.content_id,
    title: i.title,
    poster: i.imageURL?.large || i.imageURL?.small,
    date: i.date,
    genres: i.iteminfo?.genre?.map((g) => g.name) || [],
    makers: i.iteminfo?.maker?.map((m) => m.name) || [],
    actors: i.iteminfo?.actress?.map((a) => a.name) || [],
    source: 'fanza',
  }))
}

export async function searchJAVAll(query: string): Promise<JAVResult[]> {
  const [fanzaRes, javlibRes, r18Res] = await Promise.all([
    searchFanzaJAV(query).catch(() => []),
    searchJavLibrary(query).catch(() => []),
    searchR18(query).catch(() => []),
  ])

  const aggregated: JAVResult[] = [...mapFanza(fanzaRes), ...javlibRes, ...r18Res]
  if (aggregated.length > 0) return aggregated
  // last resort mock
  const q = query.toLowerCase()
  return MOCK_JAV.filter((m) => m.title.toLowerCase().includes(q))
}
