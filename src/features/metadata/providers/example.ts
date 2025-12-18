import { registerProvider, type MetadataProvider } from '@/services/metadataService'

const provider: MetadataProvider = {
  name: 'example',
  search: async (query: string) => {
    return [
      { id: 'ex-1', title: `${query} (example)`, year: 2020, artworkUrl: undefined, confidence: 0.6 },
    ]
  },
}

registerProvider(provider)

export default provider
