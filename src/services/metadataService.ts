import type { Media } from '../../types'

export interface MetadataMatch {
  id: string
  title: string
  year?: number
  type?: string
  artworkUrl?: string
  confidence?: number
}

export interface MetadataProvider {
  name: string
  search: (query: string) => Promise<MetadataMatch[]>
}

const providers: MetadataProvider[] = []

export const registerProvider = (p: MetadataProvider) => {
  providers.push(p)
}

export const search = async (query: string) => {
  // Try providers sequentially until we have results
  for (const p of providers) {
    try {
      const res = await p.search(query)
      if (res && res.length) return res
    } catch (e) {
      // Continue to next provider on error
    }
  }
  return []
}

export default { registerProvider, search }
