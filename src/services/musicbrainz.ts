// MusicBrainz + Cover Art Archive fallback for Music metadata

export interface MBReleaseGroup {
  id: string
  title: string
  'first-release-date'?: string
  'primary-type'?: string
  'artist-credit'?: Array<{ name: string }>
}

export interface MBResponse {
  'release-groups': MBReleaseGroup[]
}

export async function searchMusicBrainz(query: string) {
  try {
    const url = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(
      query,
    )}&fmt=json&limit=10`
    const res = await fetch(url, { headers: { 'User-Agent': 'ReelReader/0.1 (metadata fallback)' } })
    const data: MBResponse = await res.json()
    const groups = data['release-groups'] || []
    // Map to iTunes-like shape used by UI
    return groups.map((g) => {
      const year = g['first-release-date']?.slice(0, 4)
      const artist = g['artist-credit']?.[0]?.name || ''
      // CAA front image; may 404 for some groups, UI handles gracefully
      const artworkUrl100 = `https://coverartarchive.org/release-group/${g.id}/front-250`
      return {
        collectionId: undefined,
        trackId: undefined,
        artistName: artist,
        collectionName: g.title,
        trackName: undefined,
        artworkUrl100,
        primaryGenreName: undefined,
        releaseDate: year ? `${year}-01-01` : undefined,
      }
    })
  } catch (e) {
    console.error('MusicBrainz search error', e)
    return []
  }
}
