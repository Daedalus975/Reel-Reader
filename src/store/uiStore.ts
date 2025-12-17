import { create } from 'zustand'
import type { UIState } from '../types'

interface UIStore extends UIState {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleDarkMode: () => void
  setCurrentPage: (page: string) => void
  selectMedia: (id?: string) => void
  setSidebarEdgeOpenEnabled: (enabled: boolean) => void
  setMediaViewMode: (mode: 'grid' | 'list') => void
  setMediaCardSize: (size: 'xs' | 'sm' | 'md' | 'lg') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  darkMode: true,
  selectedMediaId: undefined,
  currentPage: '/',
  sidebarEdgeOpenEnabled: true,
  mediaViewMode: 'grid',
  mediaCardSize: 'md',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setCurrentPage: (page) => set({ currentPage: page }),
  selectMedia: (id) => set({ selectedMediaId: id }),
  setSidebarEdgeOpenEnabled: (enabled) => set({ sidebarEdgeOpenEnabled: enabled }),
  setMediaViewMode: (mode) => set({ mediaViewMode: mode }),
  setMediaCardSize: (size) => set({ mediaCardSize: size }),
}))
