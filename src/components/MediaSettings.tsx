import React from 'react'
import { Folder, X, RefreshCw } from 'lucide-react'
import { useSourceFoldersStore } from '@store/sourceFoldersStore'
import { Button } from './Button'
import { open as openDialog } from '@tauri-apps/api/dialog'
import type { MediaType } from '../types'

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'music', label: 'Music' },
  { value: 'book', label: 'Books' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'jav', label: 'JAV' },
  { value: 'doujinshi', label: 'Doujinshi' },
]

export const MediaSettings: React.FC = () => {
  const { sourceFolders, addSourceFolder, removeSourceFolder, scanSourceFolder, scanAllSourceFolders } = useSourceFoldersStore()
  const [selectedType, setSelectedType] = React.useState<MediaType>('movie')

  const handleAddFolder = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: true,
      })
      if (selected) {
        const folders = Array.isArray(selected) ? selected : [selected]
        folders.forEach(folder => {
          addSourceFolder(folder, selectedType, true)
        })
        alert(`Added ${folders.length} source folder(s) for ${selectedType}`)
      }
    } catch (err) {
      console.error('Folder selection error:', err)
      alert(`Error selecting folders: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleScanFolder = async (folderId: string) => {
    await scanSourceFolder(folderId)
  }

  const handleScanAll = async () => {
    if (confirm('Scan all source folders? This may take a while.')) {
      await scanAllSourceFolders()
      alert('All folders scanned!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Source Folder Section */}
      <div className="bg-dark/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-light mb-4">Add Source Folders</h3>
        <p className="text-sm text-gray-400 mb-4">
          Source folders are automatically monitored for new media. Select a media type and choose folders to watch.
        </p>
        
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-300 mb-2">Media Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as MediaType)}
              className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {MEDIA_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={handleAddFolder}>
            <Folder size={16} className="mr-2" />
            Browse Folders
          </Button>
          <Button variant="outline" onClick={handleScanAll}>
            <RefreshCw size={16} className="mr-2" />
            Scan All
          </Button>
        </div>
      </div>

      {/* Source Folders by Type */}
      {MEDIA_TYPES.map(mediaType => {
        const folders = sourceFolders.filter(f => f.mediaType === mediaType.value)
        if (folders.length === 0) return null

        return (
          <div key={mediaType.value} className="bg-surface/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-light flex items-center gap-2">
                <Folder size={16} />
                {mediaType.label} ({folders.length} folder{folders.length !== 1 ? 's' : ''})
              </h3>
              <span className="text-xs text-gray-400">Auto-monitored for new content</span>
            </div>
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between bg-dark/50 px-3 py-2 rounded text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Folder size={14} className="text-primary flex-shrink-0" />
                    <span className="text-light truncate" title={folder.path}>{folder.path}</span>
                    {folder.itemCount !== undefined && (
                      <span className="text-xs text-gray-400">({folder.itemCount} items)</span>
                    )}
                    {folder.lastScanned && (
                      <span className="text-xs text-gray-500">
                        Last: {new Date(folder.lastScanned).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScanFolder(folder.id)}
                      className="text-primary hover:text-primary/80 p-1"
                      title="Scan folder now"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove source folder?\n${folder.path}`)) {
                          removeSourceFolder(folder.id)
                        }
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove folder"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {sourceFolders.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Folder size={48} className="mx-auto mb-3 opacity-50" />
          <p>No source folders configured</p>
          <p className="text-sm">Add folders above to automatically scan for media</p>
        </div>
      )}
    </div>
  )
}
