import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MediaType } from '../types'

export interface CustomFieldDefinition {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'url'
  mediaTypes: MediaType[]
}

interface CustomFieldsStore {
  fieldDefinitions: CustomFieldDefinition[]
  
  addFieldDefinition: (definition: Omit<CustomFieldDefinition, 'id'>) => void
  removeFieldDefinition: (id: string) => void
  getFieldsForMediaType: (mediaType: MediaType) => CustomFieldDefinition[]
}

export const useCustomFieldsStore = create<CustomFieldsStore>()(
  persist(
    (set, get) => ({
      fieldDefinitions: [],

      addFieldDefinition: (definition) => {
        const newField: CustomFieldDefinition = {
          ...definition,
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }
        set((state) => ({
          fieldDefinitions: [...state.fieldDefinitions, newField],
        }))
      },

      removeFieldDefinition: (id) => {
        set((state) => ({
          fieldDefinitions: state.fieldDefinitions.filter((f) => f.id !== id),
        }))
      },

      getFieldsForMediaType: (mediaType) => {
        return get().fieldDefinitions.filter((field) =>
          field.mediaTypes.includes(mediaType)
        )
      },
    }),
    {
      name: 'reel-reader-custom-fields',
    }
  )
)
