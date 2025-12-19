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

export async function getBookByISBN(isbn: string): Promise<OpenLibraryDoc | null> {
  try {
    // Clean ISBN (remove dashes and spaces)
    const cleanIsbn = isbn.replace(/[-\s]/g, '')
    
    const res = await fetch(
      `https://openlibrary.org/search.json?isbn=${cleanIsbn}&limit=1`,
    )
    const data: OpenLibrarySearchResponse = await res.json()
    return data.docs?.[0] || null
  } catch (err) {
    console.error('OpenLibrary ISBN lookup error', err)
    return null
  }
}

export function getOpenLibraryCoverUrl(coverId?: number): string | undefined {
  if (!coverId) return undefined
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
}

export function extractISBN(text: string): string | null {
  // Match ISBN-10 or ISBN-13
  const isbn13Match = text.match(/(?:ISBN[-\s]?13|978|979)[\s:-]*(\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1})/i)
  const isbn10Match = text.match(/(?:ISBN[-\s]?10)?[\s:-]*(\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1})/i)
  
  return isbn13Match?.[1] || isbn10Match?.[1] || null
}
