/**
 * DLsite WebService API - Doujinshi metadata
 * Docs: https://www.dlsite.com/home/guide/webservice.html (affiliate required)
 * We'll provide mock fallback when not configured.
 */

// @ts-ignore
const DLSITE_SITE_ID: string | undefined = import.meta.env.VITE_DLSITE_SITE_ID

export interface DlsiteWork {
  workno: string
  title: string
  maker_name?: string
  genre?: string[]
  reg_date?: string
  work_image?: string
  adult?: boolean
}

const MOCK_DOUJIN: DlsiteWork[] = [
  {
    workno: 'RJ000001',
    title: 'Sample Doujin 1',
    maker_name: 'Circle A',
    genre: ['Original', 'Romance'],
    reg_date: '2021-06-10',
    work_image: 'https://via.placeholder.com/600x800?text=Doujin+1',
    adult: true,
  },
  {
    workno: 'RJ000002',
    title: 'Sample Doujin 2',
    maker_name: 'Circle B',
    genre: ['Parody', 'Comedy'],
    reg_date: '2020-03-02',
    work_image: 'https://via.placeholder.com/600x800?text=Doujin+2',
    adult: true,
  },
]

export async function searchDoujinshi(query: string): Promise<DlsiteWork[]> {
  if (!DLSITE_SITE_ID) {
    const q = query.toLowerCase()
    return MOCK_DOUJIN.filter((w) => w.title.toLowerCase().includes(q))
  }

  try {
    // Placeholder for real DLsite WebService endpoint (requires partner params)
    // Return empty for now if not implemented
    return []
  } catch (err) {
    console.error('DLsite search error', err)
    return []
  }
}
