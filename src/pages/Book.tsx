import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, BookReader } from '@components/index'
import { useLibraryStore, useUIStore } from '@store/index'
import { openFile } from '../services/fileUtils'

export const Book: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { media, updateMedia, markAsWatched } = useLibraryStore()
  const { setCurrentPage } = useUIStore()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setCurrentPage(`/book/${id ?? ''}`)
  }, [id, setCurrentPage])

  const item = useMemo(() => media.find((m) => m.id === id), [media, id])

  useEffect(() => {
    if (item?.progress) setProgress(item.progress)
  }, [item])

  if (!item) {
    return (
      <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
        <div className="bg-surface p-6 rounded-none">
          <h1 className="text-2xl font-bold text-light mb-2">Not found</h1>
          <p className="text-gray-400 mb-4">The requested book could not be located.</p>
          <Link to="/library" className="text-primary font-semibold">Back to Library</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-24 pb-24 px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-8">
        <div className="bg-surface rounded-none overflow-hidden">
          {item.poster ? (
            <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="h-96 bg-dark flex items-center justify-center text-gray-400">No cover</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-light">{item.title}</h1>
              <p className="text-gray-400 text-sm">{item.year ?? 'Year N/A'} • {item.language}</p>
              {item.fileSize && (
                <p className="text-xs text-gray-500 mt-1">{(item.fileSize / (1024 * 1024)).toFixed(1)} MB</p>
              )}
            </div>
            <div className="flex gap-2">
              {item.filePath && (
                <Button variant="secondary" size="sm" onClick={() => openFile(item.filePath!)}>
                  Open Externally
                </Button>
              )}
              <Button variant="primary" size="sm">
                Continue Reading
              </Button>
            </div>
          </div>

          {item.description && <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>}

          <div className="bg-dark border border-surface rounded-none p-2 md:p-3">
            <BookReader
              filePath={item.filePath}
              previewUrl={item.previewUrl}
              initialProgress={item.progress || 0}
              onProgress={(percent) => {
                setProgress(percent)
                updateMedia(item.id, { progress: percent })
                if (percent >= 0.98) {
                  markAsWatched(item.id, percent)
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progress: {(progress * 100).toFixed(0)}%</span>
            {item.filePath ? (
              <span className="text-gray-500">Source: {item.filePath}</span>
            ) : item.previewUrl ? (
              <span className="text-gray-500">Preview mode</span>
            ) : (
              <span className="text-gray-500">No file linked</span>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
