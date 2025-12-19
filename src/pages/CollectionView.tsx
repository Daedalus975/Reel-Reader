import React, { useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, RefreshCw } from 'lucide-react'
import { useCollectionsStore } from '../store/collectionsStore'
import { useLibraryStore, useUIStore } from '../store'
import { MediaCard } from '../components/MediaCard'
import { motion } from 'framer-motion'

export const CollectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setCurrentPage } = useUIStore()
  const { getCollectionById, deleteCollection, evaluateSmartCollection } = useCollectionsStore()
  const { media } = useLibraryStore()
  
  const collection = useMemo(() => getCollectionById(id || ''), [id, getCollectionById])
  
  useEffect(() => {
    setCurrentPage(`/collection/${id}`)
  }, [id, setCurrentPage])
  
  const collectionMedia = useMemo(() => {
    if (!collection) return []
    return media.filter((m) => collection.itemIds.includes(m.id))
  }, [collection, media])
  
  const handleRefreshSmart = () => {
    if (collection && collection.type === 'smart' && id) {
      evaluateSmartCollection(id, media)
    }
  }
  
  const handleDelete = () => {
    if (collection && confirm(`Delete collection "${collection.name}"?`)) {
      deleteCollection(collection.id)
      navigate('/collections')
    }
  }
  
  if (!collection) {
    return (
      <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
        <div className="bg-surface p-6 rounded-none">
          <h1 className="text-2xl font-bold text-light mb-2">Collection not found</h1>
          <Link to="/collections" className="text-primary font-semibold">Back to Collections</Link>
        </div>
      </main>
    )
  }
  
  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/collections')}
            className="p-2 hover:bg-surface rounded-none transition"
          >
            <ArrowLeft size={24} className="text-light" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-light">{collection.name}</h1>
            <p className="text-gray-400 mt-1">
              {collection.type === 'smart' ? 'Smart Collection' : 
               collection.type === 'boxset' ? 'Set' :
               collection.type === 'franchise' ? 'Series' : 'Collection'} • {collectionMedia.length} items
            </p>
          </div>
          <div className="flex gap-2">
            {collection.type === 'smart' && (
              <button
                onClick={handleRefreshSmart}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-none hover:bg-purple-500/30 transition"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-none hover:bg-red-500/30 transition"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
        
        {collection.description && (
          <div className="bg-surface p-4 rounded-none mb-6">
            <p className="text-gray-300">{collection.description}</p>
          </div>
        )}
        
        {/* Media Grid */}
        {collectionMedia.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-none">
            <p className="text-gray-400 text-lg mb-4">This collection is empty</p>
            <p className="text-gray-500 text-sm">
              {collection.type === 'smart' 
                ? 'Configure rules to automatically add items' 
                : 'Add items from your library'}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            {collectionMedia.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <MediaCard media={item} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  )
}
