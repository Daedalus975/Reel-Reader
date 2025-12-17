// Music Search via iTunes Search API (no key required)

export interface ITunesResult {
  collectionId?: number
  trackId?: number
  artistName: string
  collectionName?: string
  trackName?: string
  previewUrl?: string
  trackViewUrl?: string
  artworkUrl100?: string
  primaryGenreName?: string
  releaseDate?: string
}

export interface ITunesResponse {
  resultCount: number
  results: ITunesResult[]
}

export async function searchMusic(query: string, entity: 'album' | 'song' = 'album'): Promise<ITunesResult[]> {
  try {
    const entityParam = entity === 'album' ? 'album' : 'song'
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entityParam}&limit=10`,
    )
    const data: ITunesResponse = await res.json()
    return data.results || []
  } catch (err) {
    console.error('iTunes search error', err)
    return []
  }
}

export function getArtworkUrlLarge(artworkUrl100?: string): string | undefined {
  if (!artworkUrl100) return undefined
  return artworkUrl100.replace('100x100bb', '600x600bb')
}
