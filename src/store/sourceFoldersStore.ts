import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MediaType } from '../types'

interface SourceFolder {
  id: string
  path: string
  mediaType: MediaType
  autoScan: boolean
  lastScanned?: Date
  itemCount?: number
}

interface SourceFoldersStore {
  sourceFolders: SourceFolder[]
  
  addSourceFolder: (path: string, mediaType: MediaType, autoScan?: boolean) => void
  removeSourceFolder: (id: string) => void
  updateSourceFolder: (id: string, updates: Partial<SourceFolder>) => void
  getSourceFoldersForType: (mediaType: MediaType) => SourceFolder[]
  scanSourceFolder: (id: string) => Promise<void>
  scanAllSourceFolders: (mediaType?: MediaType) => Promise<void>
}

export const useSourceFoldersStore = create<SourceFoldersStore>()(
  persist(
    (set, get) => ({
      sourceFolders: [],

      addSourceFolder: (path, mediaType, autoScan = true) => {
        const newFolder: SourceFolder = {
          id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path,
          mediaType,
          autoScan,
          itemCount: 0,
        }
        set((state) => ({
          sourceFolders: [...state.sourceFolders, newFolder],
        }))
        
        // Trigger initial scan if autoScan is enabled
        if (autoScan) {
          get().scanSourceFolder(newFolder.id)
        }
      },

      removeSourceFolder: (id) => {
        set((state) => ({
          sourceFolders: state.sourceFolders.filter((f) => f.id !== id),
        }))
      },

      updateSourceFolder: (id, updates) => {
        set((state) => ({
          sourceFolders: state.sourceFolders.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }))
      },

      getSourceFoldersForType: (mediaType) => {
        return get().sourceFolders.filter((f) => f.mediaType === mediaType)
      },

      scanSourceFolder: async (id) => {
        const folder = get().sourceFolders.find((f) => f.id === id)
        if (!folder) return

        try {
          console.log(`Scanning folder: ${folder.path} for ${folder.mediaType}`)
          
          // Import scanning utilities
          const { scanSource } = await import('../features/import/importScanner')
          const { parseFilenameAdvanced, findMetadataSidecars } = await import('../services/metadata/metadataService')
          const { parseJAVFilename } = await import('../services/metadata/jav')
          const { parseDoujinshiFilename } = await import('../services/metadata/doujinshi')
          const { useLibraryStore } = await import('./libraryStore')
          const { useProfileMediaStore } = await import('./profileMediaStore')
          const { useProfileStore } = await import('./profileStore')
          
          // Get current profile
          const profileStore = useProfileStore.getState()
          const currentProfile = profileStore.getCurrentProfile()
          if (!currentProfile) {
            console.warn('No active profile for scanning')
            return
          }

          // Create a source object for the scanner
          const source = {
            id: folder.id,
            name: folder.path,
            type: 'folder' as const,
            path: folder.path,
            enabled: true,
            createdAt: new Date().toISOString(),
          }

          // Scan the folder
          const files = await scanSource(source)
          console.log(`Found ${files.length} media files in ${folder.path}`)

          // Add files to library
          const libraryStore = useLibraryStore.getState()
          const profileMediaStore = useProfileMediaStore.getState()
          
          let addedCount = 0
          const newMediaIds: string[] = []
          
          for (const filePath of files) {
            // Extract filename and parse it using specialized parsers
            const fileName = filePath.split(/[/\\]/).pop() || 'Unknown'
            
            let parsed: Partial<any> = {}
            
            // Use specialized parsers for adult content
            if (folder.mediaType === 'jav') {
              parsed = parseJAVFilename(fileName)
            } else if (folder.mediaType === 'doujinshi') {
              parsed = parseDoujinshiFilename(fileName)
            } else {
              // Use general advanced parser
              parsed = parseFilenameAdvanced(fileName, folder.mediaType)
            }
            
            // Check for sidecar metadata files (.nfo, .json, etc.)
            const sidecarData = await findMetadataSidecars(filePath)
            if (sidecarData) {
              // Merge sidecar data with parsed data (sidecar takes priority)
              parsed = { ...parsed, ...sidecarData }
            }
            
            // Create media item with parsed information
            const mediaItem: any = {
              id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: parsed.title || fileName.replace(/\.[^/.]+$/, ''),
              type: folder.mediaType,
              genres: parsed.genres || [],
              language: parsed.language || 'en',
              tags: parsed.tags || ['imported'],
              isAdult: folder.mediaType === 'jav' || folder.mediaType === 'doujinshi',
              dateAdded: new Date(),
              isFavorite: false,
              filePath,
            }
            
            // Add all parsed metadata
            if (parsed.releaseDate) mediaItem.releaseDate = parsed.releaseDate
            if (parsed.seasonNumber !== undefined) mediaItem.seasonNumber = parsed.seasonNumber
            if (parsed.episodeNumber !== undefined) mediaItem.episodeNumber = parsed.episodeNumber
            if (parsed.rating) mediaItem.rating = parsed.rating
            if (parsed.description) mediaItem.description = parsed.description
            if (parsed.posterUrl) mediaItem.posterUrl = parsed.posterUrl
            if (parsed.backdropUrl) mediaItem.backdropUrl = parsed.backdropUrl
            if (parsed.cast?.length) mediaItem.cast = parsed.cast
            if (parsed.director) mediaItem.director = parsed.director
            if (parsed.studio) mediaItem.studio = parsed.studio
            if (parsed.runtime) mediaItem.runtime = parsed.runtime
            if (parsed.quality) mediaItem.quality = parsed.quality
            if (parsed.videoCodec) mediaItem.videoCodec = parsed.videoCodec
            if (parsed.audioCodec) mediaItem.audioCodec = parsed.audioCodec
            if (parsed.productCode) mediaItem.productCode = parsed.productCode
            if (parsed.series) mediaItem.series = parsed.series
            if (parsed.artist) mediaItem.artist = parsed.artist
            if (parsed.album) mediaItem.album = parsed.album
            if (parsed.pageCount) mediaItem.pageCount = parsed.pageCount
            
            // Add to library
            profileMediaStore.addMediaToProfile(currentProfile.id, mediaItem as any)
            newMediaIds.push(mediaItem.id)
            addedCount++
          }

          // Update last scanned timestamp and item count
          get().updateSourceFolder(id, {
            lastScanned: new Date(),
            itemCount: files.length,
          })
          
          // Refresh library store with new profile media
          const profileMedia = profileMediaStore.getMediaForProfile(currentProfile.id)
          libraryStore.setMedia(profileMedia)
          
          // Automatically fetch metadata for newly imported items
          if (newMediaIds.length > 0) {
            try {
              const { fetchMetadataForMultiple } = await import('../services/jobHelpers')
              fetchMetadataForMultiple(newMediaIds)
              console.log(`Queued metadata fetch for ${newMediaIds.length} items`)
            } catch (metadataError) {
              console.warn('Could not queue metadata fetch:', metadataError)
            }
          }
          
          alert(`Scan complete!\n\nAdded ${addedCount} media items from:\n${folder.path}\n\nMetadata will be fetched automatically.`)
        } catch (error) {
          console.error('Error scanning folder:', error)
          alert(`Error scanning folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      },

      scanAllSourceFolders: async (mediaType) => {
        const folders = mediaType
          ? get().sourceFolders.filter((f) => f.mediaType === mediaType)
          : get().sourceFolders

        for (const folder of folders) {
          if (folder.autoScan) {
            await get().scanSourceFolder(folder.id)
          }
        }
      },
    }),
    {
      name: 'reel-reader-source-folders',
    }
  )
)
