// Collections Store - Manage collections, box sets, smart collections, and franchises
// Features: #3, #6, #8, #9

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Collection, Franchise, SmartCollectionRule } from '../types'
import type { Media } from '../types'

interface CollectionsStore {
  collections: Collection[]
  franchises: Franchise[]
  
  // Collections
  createCollection: (name: string, type: Collection['type'], itemIds?: string[]) => Collection
  updateCollection: (id: string, updates: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  addItemToCollection: (collectionId: string, mediaId: string) => void
  removeItemFromCollection: (collectionId: string, mediaId: string) => void
  reorderCollection: (collectionId: string, itemIds: string[]) => void
  
  // Smart collections
  updateSmartCollectionRules: (collectionId: string, rules: SmartCollectionRule[]) => void
  evaluateSmartCollection: (collectionId: string, allMedia: Media[]) => string[]
  
  // Franchises
  createFranchise: (name: string, itemIds?: string[]) => Franchise
  updateFranchise: (id: string, updates: Partial<Franchise>) => void
  deleteFranchise: (id: string) => void
  setFranchiseOrder: (franchiseId: string, customOrder: string[]) => void
  
  // Queries
  getCollectionById: (id: string) => Collection | undefined
  getCollectionsByMediaId: (mediaId: string) => Collection[]
  getFranchiseById: (id: string) => Franchise | undefined
  getFranchiseByMediaId: (mediaId: string) => Franchise | undefined
}

export const useCollectionsStore = create<CollectionsStore>()(
  persist(
    (set, get) => ({
      collections: [],
      franchises: [],
      
      createCollection: (name, type, itemIds = []) => {
        const collection: Collection = {
          id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          type,
          itemIds,
          createdAt: new Date(),
        }
        set((state) => ({ collections: [...state.collections, collection] }))
        return collection
      },
      
      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        }))
      },
      
      deleteCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        }))
      },
      
      addItemToCollection: (collectionId, mediaId) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId && !c.itemIds.includes(mediaId)
              ? { ...c, itemIds: [...c.itemIds, mediaId], updatedAt: new Date() }
              : c
          ),
        }))
      },
      
      removeItemFromCollection: (collectionId, mediaId) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, itemIds: c.itemIds.filter((id) => id !== mediaId), updatedAt: new Date() }
              : c
          ),
        }))
      },
      
      reorderCollection: (collectionId, itemIds) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, sortOrder: itemIds, updatedAt: new Date() }
              : c
          ),
        }))
      },
      
      updateSmartCollectionRules: (collectionId, rules) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, rules, updatedAt: new Date() }
              : c
          ),
        }))
      },
      
      evaluateSmartCollection: (collectionId, allMedia) => {
        const collection = get().collections.find((c) => c.id === collectionId)
        if (!collection || collection.type !== 'smart' || !collection.rules) {
          return []
        }
        
        const matches = allMedia.filter((media) => {
          return collection.rules!.every((rule) => {
            const fieldValue = (media as any)[rule.field]
            
            switch (rule.operator) {
              case 'equals':
                return fieldValue === rule.value
              case 'contains':
                return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase())
              case 'greaterThan':
                return Number(fieldValue) > Number(rule.value)
              case 'lessThan':
                return Number(fieldValue) < Number(rule.value)
              case 'in':
                return Array.isArray(rule.value) && rule.value.includes(fieldValue)
              default:
                return false
            }
          })
        })
        
        const matchIds = matches.map((m) => m.id)
        
        // Auto-update smart collection items
        get().updateCollection(collectionId, { itemIds: matchIds })
        
        return matchIds
      },
      
      createFranchise: (name, itemIds = []) => {
        const franchise: Franchise = {
          id: `fran-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          itemIds,
        }
        set((state) => ({ franchises: [...state.franchises, franchise] }))
        return franchise
      },
      
      updateFranchise: (id, updates) => {
        set((state) => ({
          franchises: state.franchises.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }))
      },
      
      deleteFranchise: (id) => {
        set((state) => ({
          franchises: state.franchises.filter((f) => f.id !== id),
        }))
      },
      
      setFranchiseOrder: (franchiseId, customOrder) => {
        set((state) => ({
          franchises: state.franchises.map((f) =>
            f.id === franchiseId ? { ...f, customOrder } : f
          ),
        }))
      },
      
      getCollectionById: (id) => {
        return get().collections.find((c) => c.id === id)
      },
      
      getCollectionsByMediaId: (mediaId) => {
        return get().collections.filter((c) => c.itemIds.includes(mediaId))
      },
      
      getFranchiseById: (id) => {
        return get().franchises.find((f) => f.id === id)
      },
      
      getFranchiseByMediaId: (mediaId) => {
        return get().franchises.find((f) => f.itemIds.includes(mediaId))
      },
    }),
    {
      name: 'reel-reader-collections',
      partialize: (state) => ({
        collections: state.collections,
        franchises: state.franchises,
      }),
    }
  )
)
