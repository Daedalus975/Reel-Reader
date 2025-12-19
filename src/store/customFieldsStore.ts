import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MediaType } from '../types'

export interface CustomFieldDefinition {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'url' | 'select' | 'multiselect' | 'boolean' | 'rating'
  mediaTypes: MediaType[]
  options?: string[] // For select/multiselect types
  defaultValue?: string | number | boolean
  required?: boolean
  autoPopulate?: boolean // If true, try to auto-populate from metadata
  metadataKey?: string // Key to map from external metadata sources
}

export interface TagCategory {
  id: string
  name: string
  color: string
  mediaTypes: MediaType[]
  tags: string[]
}

interface CustomFieldsStore {
  fieldDefinitions: CustomFieldDefinition[]
  tagCategories: TagCategory[]
  
  // Custom Fields
  addFieldDefinition: (definition: Omit<CustomFieldDefinition, 'id'>) => void
  updateFieldDefinition: (id: string, updates: Partial<CustomFieldDefinition>) => void
  removeFieldDefinition: (id: string) => void
  getFieldsForMediaType: (mediaType: MediaType) => CustomFieldDefinition[]
  
  // Tag Categories
  addTagCategory: (category: Omit<TagCategory, 'id'>) => void
  updateTagCategory: (id: string, updates: Partial<TagCategory>) => void
  removeTagCategory: (id: string) => void
  addTagToCategory: (categoryId: string, tag: string) => void
  removeTagFromCategory: (categoryId: string, tag: string) => void
  getCategoriesForMediaType: (mediaType: MediaType) => TagCategory[]
}

export const useCustomFieldsStore = create<CustomFieldsStore>()(
  persist(
    (set, get) => ({
      fieldDefinitions: [],
      tagCategories: [],

      // Custom Fields
      addFieldDefinition: (definition) => {
        const newField: CustomFieldDefinition = {
          ...definition,
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }
        set((state) => ({
          fieldDefinitions: [...state.fieldDefinitions, newField],
        }))
      },

      updateFieldDefinition: (id, updates) => {
        set((state) => ({
          fieldDefinitions: state.fieldDefinitions.map((field) =>
            field.id === id ? { ...field, ...updates } : field
          ),
        }))
      },

      removeFieldDefinition: (id) => {
        set((state) => ({
          fieldDefinitions: state.fieldDefinitions.filter((f) => f.id !== id),
        }))
      },

      getFieldsForMediaType: (mediaType) => {
        // Treat doujinshi and adult books as the same type
        const effectiveType = mediaType === 'doujinshi' ? 'doujinshi' : mediaType
        return get().fieldDefinitions.filter((field) =>
          field.mediaTypes.includes(effectiveType) || 
          (mediaType === 'doujinshi' && field.mediaTypes.some((t) => t === 'doujinshi'))
        )
      },

      // Tag Categories
      addTagCategory: (category) => {
        const newCategory: TagCategory = {
          ...category,
          id: `tagcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }
        set((state) => ({
          tagCategories: [...state.tagCategories, newCategory],
        }))
      },

      updateTagCategory: (id, updates) => {
        set((state) => ({
          tagCategories: state.tagCategories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        }))
      },

      removeTagCategory: (id) => {
        set((state) => ({
          tagCategories: state.tagCategories.filter((cat) => cat.id !== id),
        }))
      },

      addTagToCategory: (categoryId, tag) => {
        set((state) => ({
          tagCategories: state.tagCategories.map((cat) =>
            cat.id === categoryId && !cat.tags.includes(tag)
              ? { ...cat, tags: [...cat.tags, tag] }
              : cat
          ),
        }))
      },

      removeTagFromCategory: (categoryId, tag) => {
        set((state) => ({
          tagCategories: state.tagCategories.map((cat) =>
            cat.id === categoryId
              ? { ...cat, tags: cat.tags.filter((t) => t !== tag) }
              : cat
          ),
        }))
      },

      getCategoriesForMediaType: (mediaType) => {
        // Treat doujinshi and adult books as the same type
        const effectiveType = mediaType === 'doujinshi' ? 'doujinshi' : mediaType
        return get().tagCategories.filter((cat) =>
          cat.mediaTypes.includes(effectiveType) ||
          (mediaType === 'doujinshi' && cat.mediaTypes.some((t) => t === 'doujinshi'))
        )
      },
    }),
    {
      name: 'reel-reader-custom-fields',
    }
  )
)
