# Global State Management Plan

Tool: Zustand (lightweight and fast)

Stores
- Auth state (planned)
- Media library and filters — implemented at [src/store/libraryStore.ts](src/store/libraryStore.ts)
- UI preferences (dark mode, layout, language) — implemented at [src/store/uiStore.ts](src/store/uiStore.ts)

Guidelines
- Keep stores small, composable
- Derive `filteredMedia` from `media + filters`
- Persist profile-specific toggles locally (e.g., adult-mode)