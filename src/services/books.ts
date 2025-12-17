// Open Library Books Service
// Free, no API key required

export interface OpenLibraryDoc {
  key: string
  title: string
  first_publish_year?: number
  author_name?: string[]
  language?: string[]
  cover_i?: number
  isbn?: string[]
  subject?: string[]
}

export interface OpenLibrarySearchResponse {
  numFound: number
  start: number
  docs: OpenLibraryDoc[]
}

export async function searchBooks(query: string): Promise<OpenLibraryDoc[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=10`,
    )
    const data: OpenLibrarySearchResponse = await res.json()
    return data.docs || []
  } catch (err) {
    console.error('OpenLibrary search error', err)
    return []
  }
}

export function getOpenLibraryCoverUrl(coverId?: number): string | undefined {
  if (!coverId) return undefined
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
}
