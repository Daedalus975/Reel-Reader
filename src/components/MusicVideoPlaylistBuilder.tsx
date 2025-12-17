import React, { useMemo, useState } from 'react'
import { PlusSquare, CheckSquare, Square, ListVideo } from 'lucide-react'
import type { Media } from '../types'
import { useMusicVideoPlaylistStore } from '@store/musicVideoPlaylistStore'

interface MusicVideoPlaylistBuilderProps {
  items: Media[]
}

export const MusicVideoPlaylistBuilder: React.FC<MusicVideoPlaylistBuilderProps> = ({ items }) => {
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const setQueue = useMusicVideoPlaylistStore((state) => state.setQueue)
  const clearPlaylist = useMusicVideoPlaylistStore((state) => state.clear)

  const selectable = useMemo(() => items.filter((m) => m.type === 'music' && !m.isAdult), [items])

  const toggle = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelection(new Set(selectable.map((m) => m.id)))
  const clearSelection = () => setSelection(new Set())

  const handleBuild = () => {
    const queue = selection.size ? Array.from(selection) : selectable.map((m) => m.id)
    setQueue(queue)
  }

  return (
    <div className="bg-surface/60 border border-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-light font-semibold">
          <ListVideo size={18} className="text-highlight" />
          <span>Music Video Playlist</span>
        </div>
        <div className="flex gap-2">
          <button
            className="text-xs text-primary underline"
            onClick={selectAll}
          >
            Select all
          </button>
          <button
            className="text-xs text-primary underline"
            onClick={clearSelection}
          >
            Clear
          </button>
          <button
            className="text-xs text-primary underline"
            onClick={clearPlaylist}
          >
            Reset playlist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-auto pr-1">
        {selectable.map((item) => {
          const checked = selection.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-center gap-3 text-left w-full bg-dark/60 border border-surface px-3 py-2 hover:border-highlight transition ${checked ? 'ring-1 ring-highlight' : ''}`}
            >
              {checked ? <CheckSquare size={16} className="text-highlight" /> : <Square size={16} className="text-gray-500" />}
              <div className="flex flex-col">
                <span className="text-sm text-light truncate">{item.title}</span>
                <span className="text-xs text-gray-400 truncate">{item.genres[0] ?? 'Music'}</span>
              </div>
            </button>
          )
        })}
        {selectable.length === 0 && (
          <div className="text-sm text-gray-400 col-span-full">No music videos found.</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{selection.size} selected</p>
        <button
          onClick={handleBuild}
          className="flex items-center gap-2 bg-primary text-white px-3 py-2 text-sm rounded-none hover:bg-primary/80 transition"
        >
          <PlusSquare size={16} />
          Build & Play
        </button>
      </div>
    </div>
  )
}
