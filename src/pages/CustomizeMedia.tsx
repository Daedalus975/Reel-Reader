import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Save, X, FolderPlus, Tag, FileText } from 'lucide-react'
import { Button } from '../components/Button'
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

export const CustomizeMedia: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('collections')
  
  return (
    <main className="pt-20 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-light mb-2">Customize Media Library</h1>
        <p className="text-gray-400 mb-8">
          Manage collections, custom fields, and tag categories for your media types
        </p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-dark">
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'collections'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-light'
            }`}
          >
            <FolderPlus size={18} className="inline mr-2" />
            Collections & Groups
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
            Tag Categories
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'collections' && <CollectionsTab />}
        {activeTab === 'fields' && <CustomFieldsTab />}
        {activeTab === 'tags' && <TagCategoriesTab />}
      </div>
    </main>
  )
}

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
      <div className="bg-surface border border-dark rounded-lg p-6">
        <h2 className="text-xl font-semibold text-light mb-4">Create New Collection</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Collection name..."
            className="flex-1 bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <select
            value={newCollectionType}
            onChange={(e) => setNewCollectionType(e.target.value as 'manual' | 'smart')}
            className="bg-dark text-light px-4 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="manual">Manual Collection</option>
            <option value="smart">Smart Collection</option>
          </select>
          <Button onClick={handleCreate} disabled={!newCollectionName.trim()}>
            <Plus size={18} className="mr-2" />
            Create
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Manual collections let you add items manually. Smart collections auto-update based on rules.
        </p>
      </div>

      <div className="bg-surface border border-dark rounded-lg p-6">
        <h2 className="text-xl font-semibold text-light mb-4">Your Collections</h2>
        {collections.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No collections yet. Create one above!</p>
        ) : (
          <div className="space-y-2">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between bg-dark p-4 rounded border border-surface hover:border-primary transition"
              >
                {editingId === collection.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-surface text-light px-3 py-1 border border-dark focus:outline-none focus:ring-2 focus:ring-primary mr-4"
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
                      <h3 className="text-light font-medium">{collection.name}</h3>
                      <p className="text-sm text-gray-400">
                        {collection.type === 'smart' ? 'Smart Collection' : 'Manual Collection'} • {collection.itemIds.length} items
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
                          if (confirm(`Delete collection "${collection.name}"?`)) {
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

// Custom Fields Tab
const CustomFieldsTab: React.FC = () => {
  const { fieldDefinitions, addFieldDefinition, removeFieldDefinition } = useCustomFieldsStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    label: '',
    type: 'text' as CustomFieldDefinition['type'],
    mediaTypes: [] as MediaType[],
    options: [] as string[],
    required: false,
    autoPopulate: false,
    metadataKey: '',
  })
  const [newOption, setNewOption] = useState('')

  const handleSubmit = () => {
    if (formData.label.trim() && formData.mediaTypes.length > 0) {
      addFieldDefinition({
        label: formData.label,
        type: formData.type,
        mediaTypes: formData.mediaTypes,
        options: formData.options.length > 0 ? formData.options : undefined,
        required: formData.required,
        autoPopulate: formData.autoPopulate,
        metadataKey: formData.metadataKey || undefined,
      })
      setFormData({
        label: '',
        type: 'text',
        mediaTypes: [],
        options: [],
        required: false,
        autoPopulate: false,
        metadataKey: '',
      })
      setShowForm(false)
    }
  }

  const handleAddOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption)) {
      setFormData({ ...formData, options: [...formData.options, newOption] })
      setNewOption('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-dark rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-light">Custom Fields</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
            {showForm ? 'Cancel' : 'Add Field'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-dark border border-surface rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Field Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Studio, Publisher, Artist"
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

              {(formData.type === 'select' || formData.type === 'multiselect') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Options</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add option..."
                      className="flex-1 bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <Button onClick={handleAddOption} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.options.map((option, idx) => (
                      <span
                        key={idx}
                        className="bg-surface px-3 py-1 rounded-full text-sm text-light flex items-center gap-2"
                      >
                        {option}
                        <button
                          onClick={() =>
                            setFormData({
                              ...formData,
                              options: formData.options.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Apply to Media Types</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MEDIA_TYPES.map((type) => (
                    <label key={type.value} className="flex items-center gap-2 text-sm text-light">
                      <input
                        type="checkbox"
                        checked={formData.mediaTypes.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              mediaTypes: [...formData.mediaTypes, type.value],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              mediaTypes: formData.mediaTypes.filter((t) => t !== type.value),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-light">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded"
                  />
                  Required field
                </label>
                <label className="flex items-center gap-2 text-sm text-light">
                  <input
                    type="checkbox"
                    checked={formData.autoPopulate}
                    onChange={(e) => setFormData({ ...formData, autoPopulate: e.target.checked })}
                    className="rounded"
                  />
                  Auto-populate from metadata
                </label>
              </div>

              {formData.autoPopulate && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Metadata Key (e.g., "studio", "publisher")
                  </label>
                  <input
                    type="text"
                    value={formData.metadataKey}
                    onChange={(e) => setFormData({ ...formData, metadataKey: e.target.value })}
                    placeholder="Key name from API response"
                    className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <Button onClick={handleSubmit} disabled={!formData.label.trim() || formData.mediaTypes.length === 0}>
                Create Custom Field
              </Button>
            </div>
          </div>
        )}

        {fieldDefinitions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No custom fields yet. Add one above!</p>
        ) : (
          <div className="space-y-2">
            {fieldDefinitions.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between bg-dark p-4 rounded border border-surface hover:border-primary transition"
              >
                <div>
                  <h3 className="text-light font-medium">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Type: {FIELD_TYPES.find((t) => t.value === field.type)?.label} • 
                    For: {field.mediaTypes.join(', ')}
                    {field.autoPopulate && ' • Auto-populate enabled'}
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
          </div>
        )}
      </div>
    </div>
  )
}

// Tag Categories Tab
const TagCategoriesTab: React.FC = () => {
  const { tagCategories, addTagCategory, removeTagCategory, addTagToCategory, removeTagFromCategory } = useCustomFieldsStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    color: '#1659B6',
    mediaTypes: [] as MediaType[],
  })

  const handleSubmit = () => {
    if (formData.name.trim() && formData.mediaTypes.length > 0) {
      addTagCategory({
        name: formData.name,
        color: formData.color,
        mediaTypes: formData.mediaTypes,
        tags: [],
      })
      setFormData({ name: '', color: '#1659B6', mediaTypes: [] })
      setShowForm(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-dark rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-light">Tag Categories</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
            {showForm ? 'Cancel' : 'Add Category'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-dark border border-surface rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mood, Subgenre, Quality"
                  className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 bg-surface border border-dark cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Apply to Media Types</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MEDIA_TYPES.map((type) => (
                    <label key={type.value} className="flex items-center gap-2 text-sm text-light">
                      <input
                        type="checkbox"
                        checked={formData.mediaTypes.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              mediaTypes: [...formData.mediaTypes, type.value],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              mediaTypes: formData.mediaTypes.filter((t) => t !== type.value),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={!formData.name.trim() || formData.mediaTypes.length === 0}>
                Create Tag Category
              </Button>
            </div>
          </div>
        )}

        {tagCategories.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No tag categories yet. Add one above!</p>
        ) : (
          <div className="space-y-4">
            {tagCategories.map((category) => (
              <div
                key={category.id}
                className="bg-dark border border-surface rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-light font-medium">{category.name}</h3>
                    <span className="text-sm text-gray-400">
                      {category.mediaTypes.join(', ')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${category.name}"?`)) {
                        removeTagCategory(category.id)
                      }
                    }}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm text-light flex items-center gap-2"
                      style={{ backgroundColor: category.color + '40' }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTagFromCategory(category.id, tag)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <span className="text-sm text-gray-400 px-3 py-1">
                    {category.tags.length} tags
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
