import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Settings, Bookmark, Highlighter, MessageSquare, Volume2, Sun, Moon, AlignLeft, AlignCenter, AlignJustify, X } from 'lucide-react'
import { useBookStore } from '../store/bookStore'
import { Button } from '../components/Button'
import type { Media } from '../types'

interface EReaderProps {
  media: Media
  onClose: () => void
}

export function EReader({ media, onClose }: EReaderProps) {
  const readerRef = useRef<HTMLDivElement>(null)
  const {
    settings,
    updateSettings,
    ttsEnabled,
    toggleTTS,
    ttsRate,
    setTTSRate,
    updateProgress,
    addHighlight,
    addBookmark,
    addAnnotation
  } = useBookStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(100)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [showTextMenu, setShowTextMenu] = useState(false)

  useEffect(() => {
    // TODO: Load EPUB/PDF using epub.js or pdf.js
    // For now, simulate page loading
  }, [media.id])

  const handlePageChange = (delta: number) => {
    const newPage = Math.max(1, Math.min(totalPages, currentPage + delta))
    setCurrentPage(newPage)
    updateProgress(media.id, `page-${newPage}`, (newPage / totalPages) * 100)
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString())
      setShowTextMenu(true)
    }
  }

  const handleAddHighlight = (color: string) => {
    if (selectedText) {
      addHighlight(media.id, selectedText, `page-${currentPage}`, color)
      setShowTextMenu(false)
      setSelectedText('')
    }
  }

  const handleAddAnnotation = () => {
    if (selectedText) {
      const note = prompt('Add annotation:')
      if (note) {
        addAnnotation(media.id, note, `page-${currentPage}`)
      }
      setShowTextMenu(false)
      setSelectedText('')
    }
  }

  const themeColors = {
    light: 'bg-white text-black',
    dark: 'bg-neutral-900 text-white',
    sepia: 'bg-amber-50 text-amber-900',
    night: 'bg-neutral-950 text-green-400'
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${themeColors[settings.theme]}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-current/10">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X size={18} />
            Close
          </Button>
          <div>
            <h1 className="font-semibold">{media.title}</h1>
            <p className="text-sm opacity-60">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addBookmark(media.id, `page-${currentPage}`)}
          >
            <Bookmark size={18} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTTS}
            className={ttsEnabled ? 'bg-purple-500/20' : ''}
          >
            <Volume2 size={18} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Reader */}
        <div
          ref={readerRef}
          className="flex-1 overflow-y-auto flex justify-center p-8"
          onMouseUp={handleTextSelection}
        >
          <div
            className="prose prose-lg"
            style={{
              fontSize: `${settings.fontSize}px`,
              fontFamily: settings.fontFamily,
              lineHeight: settings.lineHeight,
              textAlign: settings.alignment,
              maxWidth: `${settings.maxWidth}px`
            }}
          >
            {/* TODO: Render actual book content from EPUB/PDF */}
            <h2>Chapter 1</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </div>

        {/* Settings Panel */}
        {settingsOpen && (
          <div className="w-80 border-l border-current/10 p-6 space-y-6 overflow-y-auto">
            <h3 className="font-semibold text-lg">Reader Settings</h3>

            {/* Theme */}
            <div>
              <label className="text-sm opacity-60 mb-2 block">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {(['light', 'dark', 'sepia', 'night'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ theme })}
                    className={`
                      p-3 rounded-lg border-2 capitalize transition
                      ${settings.theme === theme ? 'border-purple-500' : 'border-current/10'}
                    `}
                  >
                    {theme === 'light' && <Sun size={20} className="mx-auto" />}
                    {theme === 'dark' && <Moon size={20} className="mx-auto" />}
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-sm opacity-60 mb-2 block">
                Font Size: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="32"
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Line Height */}
            <div>
              <label className="text-sm opacity-60 mb-2 block">
                Line Height: {settings.lineHeight}
              </label>
              <input
                type="range"
                min="1.2"
                max="2.0"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-sm opacity-60 mb-2 block">Font</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className="w-full bg-transparent border border-current/20 rounded-lg px-3 py-2"
              >
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="text-sm opacity-60 mb-2 block">Alignment</label>
              <div className="flex gap-2">
                {(['left', 'center', 'justify'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateSettings({ alignment: align })}
                    className={`
                      flex-1 p-2 rounded-lg border-2 transition
                      ${settings.alignment === align ? 'border-purple-500' : 'border-current/10'}
                    `}
                  >
                    {align === 'left' && <AlignLeft size={20} className="mx-auto" />}
                    {align === 'center' && <AlignCenter size={20} className="mx-auto" />}
                    {align === 'justify' && <AlignJustify size={20} className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* TTS Speed */}
            {ttsEnabled && (
              <div>
                <label className="text-sm opacity-60 mb-2 block">
                  Speech Rate: {ttsRate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={ttsRate}
                  onChange={(e) => setTTSRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Menu */}
      {showTextMenu && selectedText && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-800 border border-white/20 rounded-lg shadow-lg p-2 flex gap-2 z-50">
          <button
            onClick={() => handleAddHighlight('yellow')}
            className="p-2 hover:bg-white/10 rounded"
            title="Yellow highlight"
          >
            <Highlighter size={20} className="text-yellow-400" />
          </button>
          <button
            onClick={() => handleAddHighlight('green')}
            className="p-2 hover:bg-white/10 rounded"
            title="Green highlight"
          >
            <Highlighter size={20} className="text-green-400" />
          </button>
          <button
            onClick={() => handleAddHighlight('blue')}
            className="p-2 hover:bg-white/10 rounded"
            title="Blue highlight"
          >
            <Highlighter size={20} className="text-blue-400" />
          </button>
          <button
            onClick={handleAddAnnotation}
            className="p-2 hover:bg-white/10 rounded"
            title="Add annotation"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between p-4 border-t border-current/10">
        <Button
          variant="secondary"
          onClick={() => handlePageChange(-1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={20} />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
            className="w-20 bg-transparent border border-current/20 rounded px-2 py-1 text-center"
            min="1"
            max={totalPages}
          />
          <span className="opacity-60">of {totalPages}</span>
        </div>

        <Button
          variant="secondary"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  )
}
