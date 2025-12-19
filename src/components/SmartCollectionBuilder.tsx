import { Plus, X, Wand2 } from 'lucide-react'
import { Button } from './Button'
import type { SmartCollectionRule } from '../types'

interface SmartCollectionBuilderProps {
  rules: SmartCollectionRule[]
  onChange: (rules: SmartCollectionRule[]) => void
}

const FIELD_OPTIONS = [
  { value: 'type', label: 'Media Type' },
  { value: 'genre', label: 'Genre' },
  { value: 'year', label: 'Year' },
  { value: 'rating', label: 'Rating' },
  { value: 'tags', label: 'Tags' },
  { value: 'language', label: 'Language' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'codec', label: 'Codec' },
  { value: 'duration', label: 'Duration' },
  { value: 'dateAdded', label: 'Date Added' },
  { value: 'watched', label: 'Watched Status' },
  { value: 'viewCount', label: 'View Count' }
]

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'does not contain' },
  { value: 'greaterThan', label: 'greater than' },
  { value: 'lessThan', label: 'less than' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' }
]

export function SmartCollectionBuilder({ rules, onChange }: SmartCollectionBuilderProps) {
  const handleAddRule = () => {
    const newRule: SmartCollectionRule = {
      field: 'type',
      operator: 'equals',
      value: ''
    }
    onChange([...rules, newRule])
  }

  const handleUpdateRule = (index: number, updates: Partial<SmartCollectionRule>) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const handleRemoveRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-purple-400">
        <Wand2 size={20} />
        <h3 className="font-semibold">Smart Collection Rules</h3>
      </div>

      <p className="text-sm text-white/60">
        Media items that match {rules.length > 0 ? 'all' : 'any'} of the following rules will be automatically added:
      </p>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
          >
            <select
              value={rule.field}
              onChange={(e) => handleUpdateRule(index, { field: e.target.value as any })}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              {FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={rule.operator}
              onChange={(e) => handleUpdateRule(index, { operator: e.target.value as any })}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              {OPERATOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={rule.value}
              onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
              placeholder="Value..."
              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />

            <button
              onClick={() => handleRemoveRule(index)}
              className="text-white/40 hover:text-red-400 transition"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Rule Button */}
      <Button
        variant="secondary"
        onClick={handleAddRule}
        className="w-full"
      >
        <Plus size={20} />
        Add Rule
      </Button>

      {rules.length === 0 && (
        <div className="text-center text-white/40 py-8 border-2 border-dashed border-white/10 rounded-lg">
          <Wand2 size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">No rules defined yet</p>
          <p className="text-xs mt-1">Add rules to automatically populate this collection</p>
        </div>
      )}
    </div>
  )
}
