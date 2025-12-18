import type { Source } from './sourceModel'

// Stubbed scanner. Real implementation will call platform APIs / node fs and extract metadata.
export const scanSource = async (source: Source): Promise<string[]> => {
  // Return an array of file paths discovered under this source path.
  // Real implementation: recurse directory, detect media files, extract basic metadata.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([`${source.path}/dummy-media-1.mp4`, `${source.path}/dummy-media-2.mp3`])
    }, 30)
  })
}

export default scanSource
