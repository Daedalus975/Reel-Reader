import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, Save, X, FolderPlus, Tag, FileText } from 'lucide-react'
import { Button } from './Button'
import { useCustomFieldsStore, type CustomFieldDefinition } from '../store/customFieldsStore'
import { useCollectionsStore } from '../store/collectionsStore'
import type { MediaType } from '../types'

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'music', label: 'Music' },
  { value: 'book', label: 'Books' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'photo', label: 'Photos' },
  { value: 'jav', label: 'JAV' },
  { value: 'doujinshi', label: 'Adult Books / Doujinshi' },
]

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'rating', label: 'Rating (1-10)' },
]

type TabType = 'collections' | 'fields' | 'tags'

interface CustomizeMediaModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: TabType
}

export const CustomizeMediaModal: React.FC<CustomizeMediaModalProps> = ({ isOpen, onClose, initialTab = 'collections' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-surface border border-dark rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark">
            <div>
              <h2 className="text-2xl font-bold text-light">Customize Media Library</h2>
              <p className="text-gray-400 text-sm mt-1">
                Manage collections, custom fields, and tag categories
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-light transition p-2 hover:bg-dark rounded"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 px-6 pt-4 border-b border-dark">
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'collections'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-light'
              }`}
            >
              <FolderPlus size={18} className="inline mr-2" />
              Collections
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'fields'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-light'
              }`}
            >
              <FileText size={18} className="inline mr-2" />
              Custom Fields
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'tags'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-light'
              }`}
            >
              <Tag size={18} className="inline mr-2" />
              Tag Colors
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'collections' && <CollectionsTab />}
            {activeTab === 'fields' && <CustomFieldsTab />}
            {activeTab === 'tags' && <TagColorsTab />}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Import the existing tab components from CustomizeMedia.tsx
// Collections Tab
const CollectionsTab: React.FC = () => {
  const { collections, createCollection, deleteCollection, updateCollection } = useCollectionsStore()
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionType, setNewCollectionType] = useState<'manual' | 'smart'>('manual')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName, newCollectionType)
      setNewCollectionName('')
    }
  }

  const handleUpdate = (id: string) => {
    if (editName.trim()) {
      updateCollection(id, { name: editName })
      setEditingId(null)
      setEditName('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-dark border border-surface rounded-lg p-6">
        <h3 className="text-lg font-semibold text-light mb-4">Create New Collection</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Collection name..."
            className="flex-1 bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <select
            value={newCollectionType}
            onChange={(e) => setNewCollectionType(e.target.value as 'manual' | 'smart')}
            className="bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="manual">Manual</option>
            <option value="smart">Smart</option>
          </select>
          <Button onClick={handleCreate} disabled={!newCollectionName.trim()}>
            <Plus size={18} className="mr-2" />
            Create
          </Button>
        </div>
      </div>

      <div className="bg-dark border border-surface rounded-lg p-6">
        <h3 className="text-lg font-semibold text-light mb-4">Your Collections</h3>
        {collections.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No collections yet.</p>
        ) : (
          <div className="space-y-2">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between bg-surface p-4 rounded border border-dark hover:border-primary transition"
              >
                {editingId === collection.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-dark text-light px-3 py-1 border border-surface focus:outline-none focus:ring-2 focus:ring-primary mr-4"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(collection.id)}
                        className="p-2 bg-primary hover:bg-primary/80 text-white rounded transition"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditName('')
                        }}
                        className="p-2 bg-dark hover:bg-surface text-light rounded transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="text-light font-medium">{collection.name}</h4>
                      <p className="text-sm text-gray-400">
                        {collection.type === 'smart' ? 'Smart' : 'Manual'} • {collection.itemIds.length} items
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(collection.id)
                          setEditName(collection.name)
                        }}
                        className="p-2 bg-dark hover:bg-surface text-light rounded transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${collection.name}"?`)) {
                            deleteCollection(collection.id)
                          }
                        }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Custom Fields Tab - simplified version
const CustomFieldsTab: React.FC = () => {
  const { fieldDefinitions, addFieldDefinition, removeFieldDefinition } = useCustomFieldsStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    label: '',
    type: 'text' as CustomFieldDefinition['type'],
    mediaTypes: [] as MediaType[],
  })

  const handleSubmit = () => {
    if (formData.label.trim() && formData.mediaTypes.length > 0) {
      addFieldDefinition({
        label: formData.label,
        type: formData.type,
        mediaTypes: formData.mediaTypes,
      })
      setFormData({ label: '', type: 'text', mediaTypes: [] })
      setShowForm(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-light">Custom Fields</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
          {showForm ? 'Cancel' : 'Add Field'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-dark border border-surface rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Field Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Studio, Publisher"
                className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Field Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Media Types</label>
              <div className="grid grid-cols-2 gap-2">
                {MEDIA_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 text-sm text-light">
                    <input
                      type="checkbox"
                      checked={formData.mediaTypes.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, mediaTypes: [...formData.mediaTypes, type.value] })
                        } else {
                          setFormData({ ...formData, mediaTypes: formData.mediaTypes.filter((t) => t !== type.value) })
                        }
                      }}
                      className="rounded"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={!formData.label.trim() || formData.mediaTypes.length === 0}>
              Create Field
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {fieldDefinitions.map((field) => (
          <div
            key={field.id}
            className="bg-dark border border-surface rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <h4 className="text-light font-medium">{field.label}</h4>
              <p className="text-sm text-gray-400">
                {field.type} • {field.mediaTypes.join(', ')}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm(`Delete field "${field.label}"?`)) {
                  removeFieldDefinition(field.id)
                }
              }}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {fieldDefinitions.length === 0 && (
          <p className="text-gray-400 text-center py-8">No custom fields yet.</p>
        )}
      </div>
    </div>
  )
}

// Tag Colors Tab - NEW
const TagColorsTab: React.FC = () => {
  const [tagColors, setTagColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('reel-reader-tag-colors')
    return saved ? JSON.parse(saved) : {}
  })
  const [newTag, setNewTag] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')

  const saveColors = (colors: Record<string, string>) => {
    setTagColors(colors)
    localStorage.setItem('reel-reader-tag-colors', JSON.stringify(colors))
  }

  const handleAddTag = () => {
    if (newTag.trim()) {
      const updated = { ...tagColors, [newTag.trim()]: newColor }
      saveColors(updated)
      setNewTag('')
      setNewColor('#3B82F6')
    }
  }

  const handleRemoveTag = (tag: string) => {
    const updated = { ...tagColors }
    delete updated[tag]
    saveColors(updated)
  }

  return (
    <div className="space-y-6">
      <div className="bg-dark border border-surface rounded-lg p-6">
        <h3 className="text-lg font-semibold text-light mb-4">Add Tag Color</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Tag name..."
            className="flex-1 bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-16 h-10 bg-surface border border-dark cursor-pointer"
          />
          <Button onClick={handleAddTag} disabled={!newTag.trim()}>
            <Plus size={18} className="mr-2" />
            Add
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Create custom colors for your tags. These will be applied throughout the app.
        </p>
      </div>

      <div className="bg-dark border border-surface rounded-lg p-6">
        <h3 className="text-lg font-semibold text-light mb-4">Tag Colors</h3>
        {Object.keys(tagColors).length === 0 ? (
          <p className="text-gray-400 text-center py-8">No tag colors defined yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(tagColors).map(([tag, color]) => (
              <div
                key={tag}
                className="flex items-center justify-between bg-surface p-4 rounded border border-dark"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-light font-medium">{tag}</span>
                </div>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
