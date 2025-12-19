import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadingProgress } from '../types/features'

interface Highlight {
  id: string
  mediaId: string
  text: string
  cfiRange: string // EPUB CFI range
  color: string
  note?: string
  createdAt: Date
}

interface Annotation {
  id: string
  mediaId: string
  text: string
  cfiRange: string
  createdAt: Date
  updatedAt: Date
}

interface ReaderSettings {
  fontSize: number // 12-32
  fontFamily: string
  lineHeight: number // 1.2-2.0
  theme: 'light' | 'dark' | 'sepia' | 'night'
  pageMode: 'single' | 'double' | 'scroll'
  alignment: 'left' | 'center' | 'justify'
  maxWidth: number // pixels
}

interface BookState {
  currentBook: string | null
  progress: Record<string, ReadingProgress>
  highlights: Highlight[]
  annotations: Annotation[]
  settings: ReaderSettings
  ttsEnabled: boolean
  ttsVoice?: string
  ttsRate: number
  bookmarks: Record<string, string[]> // mediaId -> cfi locations
}

interface BookActions {
  // Book Management
  openBook: (mediaId: string) => void
  closeBook: () => void
  
  // Progress
  updateProgress: (mediaId: string, location: string, percent: number) => void
  getProgress: (mediaId: string) => ReadingProgress | undefined
  
  // Highlights
  addHighlight: (mediaId: string, text: string, cfiRange: string, color: string, note?: string) => void
  removeHighlight: (id: string) => void
  updateHighlight: (id: string, updates: Partial<Highlight>) => void
  getHighlights: (mediaId: string) => Highlight[]
  
  // Annotations
  addAnnotation: (mediaId: string, text: string, cfiRange: string) => void
  removeAnnotation: (id: string) => void
  updateAnnotation: (id: string, text: string) => void
  getAnnotations: (mediaId: string) => Annotation[]
  
  // Bookmarks
  addBookmark: (mediaId: string, cfi: string) => void
  removeBookmark: (mediaId: string, cfi: string) => void
  getBookmarks: (mediaId: string) => string[]
  
  // Settings
  updateSettings: (settings: Partial<ReaderSettings>) => void
  resetSettings: () => void
  
  // Text-to-Speech
  toggleTTS: () => void
  setTTSVoice: (voice: string) => void
  setTTSRate: (rate: number) => void
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  fontFamily: 'Georgia',
  lineHeight: 1.6,
  theme: 'dark',
  pageMode: 'single',
  alignment: 'left',
  maxWidth: 800
}

export const useBookStore = create<BookState & BookActions>()(
  persist(
    (set, get) => ({
      // State
      currentBook: null,
      progress: {},
      highlights: [],
      annotations: [],
      settings: DEFAULT_SETTINGS,
      ttsEnabled: false,
      ttsRate: 1.0,
      bookmarks: {},

      // Book Management
      openBook: (mediaId) => {
        set({ currentBook: mediaId })
      },

      closeBook: () => {
        set({ currentBook: null })
      },

      // Progress
      updateProgress: (mediaId, location, percent) => {
        set((state) => ({
          progress: {
            ...state.progress,
            [mediaId]: {
              mediaId,
              location,
              percent,
              lastRead: new Date(),
              chapter: undefined
            }
          }
        }))
      },

      getProgress: (mediaId) => {
        return get().progress[mediaId]
      },

      // Highlights
      addHighlight: (mediaId, text, cfiRange, color, note) => {
        const highlight: Highlight = {
          id: crypto.randomUUID(),
          mediaId,
          text,
          cfiRange,
          color,
          note,
          createdAt: new Date()
        }
        set((state) => ({
          highlights: [...state.highlights, highlight]
        }))
      },

      removeHighlight: (id) => {
        set((state) => ({
          highlights: state.highlights.filter((h) => h.id !== id)
        }))
      },

      updateHighlight: (id, updates) => {
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          )
        }))
      },

      getHighlights: (mediaId) => {
        return get().highlights.filter((h) => h.mediaId === mediaId)
      },

      // Annotations
      addAnnotation: (mediaId, text, cfiRange) => {
        const annotation: Annotation = {
          id: crypto.randomUUID(),
          mediaId,
          text,
          cfiRange,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        set((state) => ({
          annotations: [...state.annotations, annotation]
        }))
      },

      removeAnnotation: (id) => {
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id)
        }))
      },

      updateAnnotation: (id, text) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, text, updatedAt: new Date() } : a
          )
        }))
      },

      getAnnotations: (mediaId) => {
        return get().annotations.filter((a) => a.mediaId === mediaId)
      },

      // Bookmarks
      addBookmark: (mediaId, cfi) => {
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            [mediaId]: [...(state.bookmarks[mediaId] || []), cfi]
          }
        }))
      },

      removeBookmark: (mediaId, cfi) => {
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            [mediaId]: (state.bookmarks[mediaId] || []).filter((b) => b !== cfi)
          }
        }))
      },

      getBookmarks: (mediaId) => {
        return get().bookmarks[mediaId] || []
      },

      // Settings
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings }
        }))
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS })
      },

      // Text-to-Speech
      toggleTTS: () => {
        set((state) => ({ ttsEnabled: !state.ttsEnabled }))
      },

      setTTSVoice: (voice) => {
        set({ ttsVoice: voice })
      },

      setTTSRate: (rate) => {
        set({ ttsRate: Math.max(0.5, Math.min(2.0, rate)) })
      }
    }),
    {
      name: 'book-store',
      version: 1
    }
  )
)
