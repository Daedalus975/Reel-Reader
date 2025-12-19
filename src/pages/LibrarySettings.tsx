import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSourceFoldersStore } from '@store/index'
import { Folder, X, ArrowLeft } from 'lucide-react'
import { Button } from '@components/index'
import { open as openDialog } from '@tauri-apps/api/dialog'
import type { MediaType } from '../types'

const LIBRARY_TITLES: Record<MediaType | string, string> = {
  movie: 'Movies',
  tv: 'TV Shows',
  music: 'Music',
  book: 'Books',
  comic: 'Comics',
  audiobook: 'Audiobooks',
  podcast: 'Podcasts',
  jav: 'Adult Movies',
  doujinshi: 'Adult Books',
}

export const LibrarySettings: React.FC = () => {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const { sourceFolders, addSourceFolder, removeSourceFolder, getSourceFoldersForType, scanSourceFolder } = useSourceFoldersStore()

  const mediaType = type as MediaType
  const title = LIBRARY_TITLES[type || ''] || 'Library'
  const typeFolders = useMemo(() => getSourceFoldersForType(mediaType), [mediaType, sourceFolders])

  const handleAddSourceFolders = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: true,
        title: `Select ${title} Source Folders`,
      })

      if (!selected) return

      const folders = Array.isArray(selected) ? selected : [selected]
      for (const folderPath of folders) {
        addSourceFolder(folderPath, mediaType, true)
      }
      alert(`Added ${folders.length} source folder(s)!`)
    } catch (error) {
      console.error('Failed to select folders:', error)
      alert('Failed to open folder selector. Make sure you are running the desktop app.')
    }
  }

  const handleRemoveFolder = (folderId: string, folderPath: string) => {
    if (confirm(`Remove source folder?\n${folderPath}\n\nMedia items from this folder will remain in your library.`)) {
      removeSourceFolder(folderId)
    }
  }

  const handleScanFolder = async (folderId: string) => {
    try {
      await scanSourceFolder(folderId)
      alert('Scan complete!')
    } catch (error) {
      console.error('Scan failed:', error)
      alert('Scan failed. Check console for details.')
    }
  }

  const handleUploadFiles = () => {
    const input = document.getElementById(`file-upload-${type}`)
    input?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      alert(`Selected ${files.length} file(s). File import feature will be implemented soon!`)
      // TODO: Process files and add to library
    }
  }

  return (
    <main className="pt-24 pb-20 px-6 md:px-10 lg:px-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-light mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to {title}</span>
          </button>
          <h1 className="text-3xl font-bold text-light">{title} Library Settings</h1>
          <p className="text-gray-400 mt-2">
            Configure source folders and import settings for your {title.toLowerCase()} library
          </p>
        </div>

        {/* Source Folders Section */}
        <section className="bg-surface rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-light mb-4">Source Folders</h2>
          <p className="text-sm text-gray-400 mb-6">
            Add folders to automatically monitor for {title.toLowerCase()} content. The app will scan these folders for media files.
          </p>

          {/* Hidden file input */}
          <input
            id={`file-upload-${type}`}
            type="file"
            accept="*/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Folder List */}
          {typeFolders.length > 0 ? (
            <div className="space-y-3 mb-6">
              {typeFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="bg-dark/50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Folder size={20} className="text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-light truncate" title={folder.path}>
                        {folder.path}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        {folder.itemCount !== undefined && (
                          <span className="text-xs text-gray-400">
                            {folder.itemCount} items
                          </span>
                        )}
                        {folder.lastScanned && (
                          <span className="text-xs text-gray-500">
                            Last scanned: {new Date(folder.lastScanned).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleScanFolder(folder.id)}
                      className="px-3 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 text-sm transition-colors"
                    >
                      Scan Now
                    </button>
                    <button
                      onClick={() => handleRemoveFolder(folder.id, folder.path)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Remove folder"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-dark/30 rounded-lg p-8 text-center mb-6">
              <Folder size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No source folders added yet</p>
              <p className="text-sm text-gray-500">
                Add folders to automatically import {title.toLowerCase()} from your computer
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleAddSourceFolders} variant="primary">
              <Folder size={18} className="inline mr-2" />
              Add Source Folder(s)
            </Button>
            <Button onClick={handleUploadFiles} variant="outline">
              Upload Files
            </Button>
          </div>
        </section>

        {/* Additional Settings Section */}
        <section className="bg-surface rounded-lg p-6">
          <h2 className="text-2xl font-bold text-light mb-4">Import Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-light font-medium">Auto-scan on startup</p>
                <p className="text-sm text-gray-400">
                  Automatically scan source folders when the app starts
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={false}
                className="accent-primary h-4 w-4"
              />
            </div>
            <div className="h-px bg-dark" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-light font-medium">Watch for changes</p>
                <p className="text-sm text-gray-400">
                  Automatically detect when files are added or removed from source folders
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={false}
                className="accent-primary h-4 w-4"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
