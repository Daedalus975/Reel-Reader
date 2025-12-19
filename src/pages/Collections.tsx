// Collections Management Page
// Features: #3, #6, #8, #9 - Collections, box sets, franchises, smart collections

import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Folder, Star, Sparkles, Film } from 'lucide-react'
import { useCollectionsStore } from '../store/collectionsStore'
import { useLibraryStore, useUIStore } from '../store'
import { Link } from 'react-router-dom'
import type { Collection } from '../types'

export const Collections: React.FC = () => {
  const { setCurrentPage } = useUIStore()
  const { collections, franchises, createCollection, deleteCollection, evaluateSmartCollection } =
    useCollectionsStore()
  const { media } = useLibraryStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionType, setNewCollectionType] = useState<Collection['type']>('manual')

  useEffect(() => {
    setCurrentPage('/collections')
  }, [setCurrentPage])

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim(), newCollectionType)
      setNewCollectionName('')
      setNewCollectionType('manual')
      setShowCreateModal(false)
    }
  }

  const getCollectionIcon = (type: Collection['type']) => {
    switch (type) {
      case 'boxset':
        return <Folder className="w-5 h-5" />
      case 'franchise':
        return <Film className="w-5 h-5" />
      case 'smart':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Star className="w-5 h-5" />
    }
  }

  const getCollectionTypeLabel = (type: Collection['type']) => {
    switch (type) {
      case 'boxset':
        return 'Box Set'
      case 'franchise':
        return 'Franchise'
      case 'smart':
        return 'Smart Collection'
      default:
        return 'Manual Collection'
    }
  }

  const handleRefreshSmartCollection = (collectionId: string) => {
    const matchedIds = evaluateSmartCollection(collectionId, media)
    const collection = collections.find((c) => c.id === collectionId)
    if (collection) {
      alert(`Smart collection "${collection.name}" refreshed: ${matchedIds.length} items matched`)
    }
  }

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-light">Collections</h1>
            <p className="text-gray-400 mt-1">
              Organize your media into collections, box sets, and franchises
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-none hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Total Collections</div>
            <div className="text-2xl font-bold text-light">{collections.length}</div>
          </div>
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Manual</div>
            <div className="text-2xl font-bold text-primary">
              {collections.filter((c) => c.type === 'manual').length}
            </div>
          </div>
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Smart Collections</div>
            <div className="text-2xl font-bold text-purple-400">
              {collections.filter((c) => c.type === 'smart').length}
            </div>
          </div>
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Franchises</div>
            <div className="text-2xl font-bold text-green-400">{franchises.length}</div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {collections.length === 0 ? (
            <div className="col-span-full bg-surface p-12 rounded-none text-center">
              <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No collections yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Create your first collection to organize your media
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-none hover:bg-primary-dark"
              >
                Create Collection
              </button>
            </div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-surface rounded-none overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
              >
                <Link to={`/collection/${collection.id}`}>
                  {collection.poster ? (
                    <img
                      src={collection.poster}
                      alt={collection.name}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-dark flex items-center justify-center">
                      {getCollectionIcon(collection.type)}
                    </div>
                  )}
                </Link>
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      to={`/collection/${collection.id}`}
                      className="flex-1 min-w-0"
                    >
                      <h3 className="text-light font-semibold truncate group-hover:text-primary transition-colors">
                        {collection.name}
                      </h3>
                    </Link>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          // TODO: Implement edit modal
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-none"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCollection(collection.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-none"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{collection.itemIds.length} items</span>
                    <span className="text-xs text-gray-500 capitalize">
                      {getCollectionTypeLabel(collection.type)}
                    </span>
                  </div>

                  {collection.type === 'smart' && (
                    <button
                      onClick={() => handleRefreshSmartCollection(collection.id)}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-purple-500/20 text-purple-300 rounded-none hover:bg-purple-500/30 transition-colors"
                    >
                      Refresh Smart Collection
                    </button>
                  )}

                  {collection.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Collection Modal */}
        {showCreateModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <div 
              className="bg-surface rounded-none p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-light mb-4">Create New Collection</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Collection Name</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Marvel Cinematic Universe"
                    className="w-full bg-dark text-light px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Collection Type</label>
                  <select
                    value={newCollectionType}
                    onChange={(e) => setNewCollectionType(e.target.value as Collection['type'])}
                    className="w-full bg-dark text-light px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="manual">Manual Collection</option>
                    <option value="smart">Smart Collection</option>
                    <option value="boxset">Box Set</option>
                    <option value="franchise">Franchise</option>
                  </select>
                </div>

                {newCollectionType === 'smart' && (
                  <div className="bg-dark p-3 rounded-none">
                    <p className="text-xs text-gray-400">
                      Smart collections automatically update based on rules you define. You can
                      configure rules after creating the collection.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewCollectionName('')
                    setNewCollectionType('manual')
                  }}
                  className="flex-1 px-4 py-2 bg-dark text-gray-400 rounded-none hover:text-light"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-none hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
