import { create } from 'zustand'
import type { UIState } from '../types'

interface UIStore extends UIState {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleDarkMode: () => void
  setCurrentPage: (page: string) => void
  selectMedia: (id?: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  darkMode: true,
  selectedMediaId: undefined,
  currentPage: '/',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setCurrentPage: (page) => set({ currentPage: page }),
  selectMedia: (id) => set({ selectedMediaId: id }),
}))
