// Bookmarks & Chapters Component
// Features: #28, #34 - User bookmarks and chapters support

import React, { useState } from 'react'
import { Play, Trash2, Plus } from 'lucide-react'
import type { Bookmark, Chapter } from '../types'

interface BookmarksChaptersProps {
  bookmarks: Bookmark[]
  chapters: Chapter[]
  currentTime: number
  onSeek: (time: number) => void
  onAddBookmark?: (timestamp: number, label?: string) => void
  onDeleteBookmark?: (id: string) => void
  onAddChapter?: (startTime: number, title: string) => void
  onDeleteChapter?: (id: string) => void
}

export const BookmarksChapters: React.FC<BookmarksChaptersProps> = ({
  bookmarks,
  chapters,
  currentTime,
  onSeek,
  onAddBookmark,
  onDeleteBookmark,
  onAddChapter,
  onDeleteChapter,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'chapters'>('chapters')
  const [showAddBookmark, setShowAddBookmark] = useState(false)
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('')
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleAddBookmark = () => {
    if (onAddBookmark) {
      onAddBookmark(currentTime, newBookmarkLabel || undefined)
      setNewBookmarkLabel('')
      setShowAddBookmark(false)
    }
  }

  const handleAddChapter = () => {
    if (onAddChapter && newChapterTitle.trim()) {
      onAddChapter(currentTime, newChapterTitle.trim())
      setNewChapterTitle('')
      setShowAddChapter(false)
    }
  }

  return (
    <div className="bg-surface rounded-none overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-dark">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chapters'
              ? 'bg-dark text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-light'
          }`}
        >
          Chapters ({chapters.length})
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'bookmarks'
              ? 'bg-dark text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-light'
          }`}
        >
          Bookmarks ({bookmarks.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        {activeTab === 'chapters' && (
          <div className="space-y-2">
            {onAddChapter && (
              <div className="mb-3">
                {!showAddChapter ? (
                  <button
                    onClick={() => setShowAddChapter(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-light"
                  >
                    <Plus className="w-4 h-4" />
                    Add Chapter at Current Time
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="Chapter title..."
                      className="flex-1 bg-dark text-light px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                    />
                    <button
                      onClick={handleAddChapter}
                      className="px-3 py-2 bg-primary text-white text-sm rounded-none hover:bg-primary-dark"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddChapter(false)
                        setNewChapterTitle('')
                      }}
                      className="px-3 py-2 bg-surface-light text-gray-400 text-sm rounded-none hover:text-light"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {chapters.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No chapters available
              </div>
            ) : (
              chapters
                .sort((a, b) => a.startTime - b.startTime)
                .map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`flex items-center gap-3 p-3 rounded-none transition-colors ${
                      currentTime >= chapter.startTime &&
                      (!chapter.endTime || currentTime < chapter.endTime)
                        ? 'bg-primary/10 border-l-2 border-primary'
                        : 'bg-dark hover:bg-surface-light'
                    }`}
                  >
                    {chapter.thumbnail && (
                      <img
                        src={chapter.thumbnail}
                        alt={chapter.title}
                        className="w-16 h-10 object-cover rounded-none"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-light font-medium truncate">
                        {chapter.title}
                        {chapter.userGenerated && (
                          <span className="ml-2 text-xs text-gray-400">(custom)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(chapter.startTime)}
                        {chapter.endTime && ` - ${formatTime(chapter.endTime)}`}
                      </div>
                    </div>
                    <button
                      onClick={() => onSeek(chapter.startTime)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-none"
                      title="Jump to chapter"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    {chapter.userGenerated && onDeleteChapter && (
                      <button
                        onClick={() => onDeleteChapter(chapter.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-none"
                        title="Delete chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-2">
            {onAddBookmark && (
              <div className="mb-3">
                {!showAddBookmark ? (
                  <button
                    onClick={() => setShowAddBookmark(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-light"
                  >
                    <Plus className="w-4 h-4" />
                    Add Bookmark at Current Time
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBookmarkLabel}
                      onChange={(e) => setNewBookmarkLabel(e.target.value)}
                      placeholder="Optional label..."
                      className="flex-1 bg-dark text-light px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
                    />
                    <button
                      onClick={handleAddBookmark}
                      className="px-3 py-2 bg-primary text-white text-sm rounded-none hover:bg-primary-dark"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddBookmark(false)
                        setNewBookmarkLabel('')
                      }}
                      className="px-3 py-2 bg-surface-light text-gray-400 text-sm rounded-none hover:text-light"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {bookmarks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No bookmarks yet. Add your first bookmark!
              </div>
            ) : (
              bookmarks
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-3 p-3 bg-dark hover:bg-surface-light rounded-none transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-light truncate">
                        {bookmark.label || 'Unnamed bookmark'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(bookmark.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => onSeek(bookmark.timestamp)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-none"
                      title="Jump to bookmark"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    {onDeleteBookmark && (
                      <button
                        onClick={() => onDeleteBookmark(bookmark.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-none"
                        title="Delete bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
