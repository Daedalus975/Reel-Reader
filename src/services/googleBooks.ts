// Google Books fallback for Book metadata

export interface GoogleBooksItem {
  id: string
  volumeInfo: {
    title?: string
    authors?: string[]
    publishedDate?: string
    categories?: string[]
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    language?: string
    description?: string
  }
}

export interface GoogleBooksResponse {
  totalItems: number
  items?: GoogleBooksItem[]
}

// Map to an OpenLibrary-like shape that our UI expects
export function mapGoogleToOpenLibraryDoc(item: GoogleBooksItem) {
  const year = item.volumeInfo.publishedDate?.slice(0, 4)
  return {
    key: `google:${item.id}`,
    title: item.volumeInfo.title || 'Unknown',
    first_publish_year: year ? parseInt(year, 10) : undefined,
    author_name: item.volumeInfo.authors || [],
    language: item.volumeInfo.language ? [item.volumeInfo.language] : undefined,
    cover_i: undefined as number | undefined,
    cover_url: item.volumeInfo.imageLinks?.thumbnail,
    isbn: undefined as string[] | undefined,
    subject: item.volumeInfo.categories || [],
    description: item.volumeInfo.description,
  }
}

export async function searchGoogleBooks(query: string) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`,
    )
    const data: GoogleBooksResponse = await res.json()
    const items = data.items || []
    return items.map(mapGoogleToOpenLibraryDoc)
  } catch (e) {
    console.error('Google Books search error', e)
    return []
  }
}
