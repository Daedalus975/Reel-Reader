/**
 * Helper utilities for job queue operations
 */

import { enqueueJob } from './jobQueue'
import { useLibraryStore } from '@/store/libraryStore'

/**
 * Enqueue metadata fetch job for a media item
 */
export function fetchMetadataForMedia(mediaId: string) {
  const media = useLibraryStore.getState().media.find((m) => m.id === mediaId)
  
  if (!media) {
    console.error('Media not found:', mediaId)
    return null
  }

  return enqueueJob(
    'metadata',
    `Fetch metadata for "${media.title}"`,
    {
      description: 'Getting additional info from OMDB',
      data: {
        mediaId: media.id,
        title: media.title,
        type: media.type,
      },
    }
  )
}

/**
 * Enqueue metadata fetch for multiple media items
 */
export function fetchMetadataForMultiple(mediaIds: string[]) {
  const jobIds: string[] = []
  
  for (const id of mediaIds) {
    const jobId = fetchMetadataForMedia(id)
    if (jobId) {
      jobIds.push(jobId)
    }
  }
  
  return jobIds
}

/**
 * Enqueue backup job for current profile
 */
export function createBackup(profileId?: string) {
  return enqueueJob(
    'backup',
    profileId ? 'Backup Profile Data' : 'Backup All Data',
    {
      description: 'Exporting library to JSON file',
      data: { profileId },
    }
  )
}

/**
 * Enqueue download job
 */
export function downloadFile(url: string, filename: string) {
  return enqueueJob(
    'download',
    `Download ${filename}`,
    {
      description: `Downloading from ${new URL(url).hostname}`,
      data: { url, filename },
    }
  )
}

/**
 * Enqueue folder scan job
 */
export function scanFolder(path: string) {
  return enqueueJob(
    'scan',
    `Scan ${path}`,
    {
      description: 'Discovering media files',
      data: { path },
    }
  )
}
