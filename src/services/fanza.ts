/**
 * FANZA (DMM) Affiliate API - JAV metadata
 * Official docs (Japanese): https://affiliate.dmm.com/api/
 * Requires Affiliate ID and site ID. We'll support mock fallback when not configured.
 */

// @ts-ignore
const FANZA_API_ID: string | undefined = import.meta.env.VITE_FANZA_API_ID

export interface FanzaItem {
  content_id: string
  title: string
  imageURL: { large: string; small: string }
  date: string
  iteminfo?: { genre?: Array<{ name: string }>; maker?: Array<{ name: string }>; actress?: Array<{ name: string }> }
}

export interface FanzaResponse {
  result: { status: string; items: FanzaItem[] }
}

const MOCK_JAV: FanzaItem[] = [
  {
    content_id: 'JAV-0001',
    title: 'Sample JAV Title 1',
    imageURL: { large: 'https://via.placeholder.com/600x900?text=JAV+1', small: 'https://via.placeholder.com/300x450?text=JAV+1' },
    date: '2020-01-01',
    iteminfo: {
      genre: [{ name: 'Drama' }, { name: 'Romance' }],
      maker: [{ name: 'Sample Studio' }],
      actress: [{ name: 'Actress A' }, { name: 'Actress B' }],
    },
  },
  {
    content_id: 'JAV-0002',
    title: 'Sample JAV Title 2',
    imageURL: { large: 'https://via.placeholder.com/600x900?text=JAV+2', small: 'https://via.placeholder.com/300x450?text=JAV+2' },
    date: '2019-05-20',
    iteminfo: {
      genre: [{ name: 'Cosplay' }],
      maker: [{ name: 'Another Studio' }],
      actress: [{ name: 'Actress C' }],
    },
  },
]

export async function searchJAV(query: string): Promise<FanzaItem[]> {
  // Fallback to mock data if no key configured
  if (!FANZA_API_ID) {
    const q = query.toLowerCase()
    return MOCK_JAV.filter((i) => i.title.toLowerCase().includes(q))
  }

  try {
    const endpoint = `https://api.dmm.com/affiliate/v3/ItemList?api_id=${FANZA_API_ID}&affiliate_id=${FANZA_API_ID}&site=FANZA&service=digital&floor=videoa&hits=20&sort=date&keyword=${encodeURIComponent(
      query,
    )}`
    const res = await fetch(endpoint)
    const data: FanzaResponse = await res.json()
    return data.result?.items || []
  } catch (err) {
    console.error('FANZA search error', err)
    return []
  }
}
