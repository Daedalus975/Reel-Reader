import { useState } from 'react'
import { GripVertical, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from './Button'
import type { Media } from '../types'

interface FranchiseOrderEditorProps {
  items: Media[]
  onSave: (orderedIds: string[]) => void
  onCancel: () => void
}

export function FranchiseOrderEditor({ items, onSave, onCancel }: FranchiseOrderEditorProps) {
  const [orderedItems, setOrderedItems] = useState(items)

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= orderedItems.length) return

    const newItems = [...orderedItems]
    const [item] = newItems.splice(index, 1)
    newItems.splice(newIndex, 0, item)
    setOrderedItems(newItems)
  }

  const handleSave = () => {
    onSave(orderedItems.map((item) => item.id))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">Edit Viewing Order</h2>
            <p className="text-white/60 mt-1">Reorder items in this franchise</p>
          </div>
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {orderedItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="text-white/40 hover:text-white transition disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === orderedItems.length - 1}
                    className="text-white/40 hover:text-white transition disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <GripVertical size={20} className="text-white/20" />

                <div className="flex items-center gap-1 text-white/40 font-mono text-sm shrink-0">
                  <span className="w-8 text-right">{index + 1}</span>
                </div>

                {item.poster && (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-sm text-white/60">
                    {item.year} • {item.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save size={20} />
            Save Order
          </Button>
        </div>
      </div>
    </div>
  )
}
