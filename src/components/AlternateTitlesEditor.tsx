import { useState } from 'react'
import { Plus, X, Globe } from 'lucide-react'
import { Button } from './Button'
import type { AlternativeTitle } from '../types'

interface AlternateTitlesEditorProps {
  titles: AlternativeTitle[]
  onChange: (titles: AlternativeTitle[]) => void
}

export function AlternateTitlesEditor({ titles, onChange }: AlternateTitlesEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCountry, setNewCountry] = useState('')
  const [newType, setNewType] = useState<AlternativeTitle['type']>('localized')

  const handleAdd = () => {
    if (!newTitle.trim()) return

    const altTitle: AlternativeTitle = {
      title: newTitle.trim(),
      type: newType,
      ...(newCountry.trim() && { country: newCountry.trim() })
    }

    onChange([...titles, altTitle])
    setNewTitle('')
    setNewCountry('')
    setNewType('localized')
    setIsAdding(false)
  }

  const handleRemove = (index: number) => {
    onChange(titles.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/80">Alternate Titles</label>
        {!isAdding && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={16} />
            Add Title
          </Button>
        )}
      </div>

      {/* Existing Titles */}
      <div className="space-y-2">
        {titles.map((alt, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
          >
            <Globe size={16} className="text-white/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{alt.title}</p>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="capitalize">{alt.type}</span>
                {alt.country && (
                  <>
                    <span>•</span>
                    <span>{alt.country}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="text-white/40 hover:text-red-400 transition shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Title Form */}
      {isAdding && (
        <div className="bg-white/5 border border-purple-500/30 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Alternate title..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as AlternativeTitle['type'])}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="localized">Localized</option>
              <option value="original">Original</option>
              <option value="aka">AKA</option>
              <option value="working">Working Title</option>
              <option value="festival">Festival</option>
              <option value="dvd">DVD</option>
              <option value="tv">TV</option>
            </select>

            <input
              type="text"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              placeholder="Country (optional)"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setNewTitle('')
                setNewCountry('')
                setNewType('localized')
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newTitle.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {titles.length === 0 && !isAdding && (
        <p className="text-sm text-white/40 text-center py-4">
          No alternate titles added
        </p>
      )}
    </div>
  )
}
