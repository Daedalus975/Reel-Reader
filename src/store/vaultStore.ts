// Vault Store - Encrypted library management
// Features: #49, #191-200

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vault } from '../types'

interface VaultStore {
  vaults: Vault[]
  activeVaultId?: string
  
  // Vault management
  createVault: (name: string, keyRef: string) => Vault
  deleteVault: (id: string) => void
  lockVault: (id: string) => void
  unlockVault: (id: string, keyRef: string) => Promise<boolean>
  
  // Source management
  addSourceToVault: (vaultId: string, sourceId: string) => void
  removeSourceFromVault: (vaultId: string, sourceId: string) => void
  
  // Queries
  getVault: (id: string) => Vault | undefined
  getVaultBySourceId: (sourceId: string) => Vault | undefined
  getActiveVault: () => Vault | undefined
  isSourceInVault: (sourceId: string) => boolean
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      vaults: [],
      activeVaultId: undefined,
      
      createVault: (name, keyRef) => {
        const vault: Vault = {
          id: `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          sourceIds: [],
          isLocked: true,
          keyRef,
          createdAt: new Date(),
        }
        set((state) => ({ vaults: [...state.vaults, vault] }))
        return vault
      },
      
      deleteVault: (id) => {
        set((state) => ({
          vaults: state.vaults.filter((v) => v.id !== id),
          activeVaultId: state.activeVaultId === id ? undefined : state.activeVaultId,
        }))
      },
      
      lockVault: (id) => {
        set((state) => ({
          vaults: state.vaults.map((v) =>
            v.id === id ? { ...v, isLocked: true } : v
          ),
          activeVaultId: state.activeVaultId === id ? undefined : state.activeVaultId,
        }))
      },
      
      unlockVault: async (id, keyRef) => {
        // Stub implementation - real implementation would:
        // 1. Verify keyRef matches vault.keyRef
        // 2. Use cryptographic key derivation (PBKDF2, Argon2, etc.)
        // 3. Decrypt vault metadata
        // 4. Return success/failure
        
        const vault = get().getVault(id)
        if (!vault) return false
        
        // Simple verification stub
        if (vault.keyRef !== keyRef) {
          console.error('Invalid vault key')
          return false
        }
        
        set((state) => ({
          vaults: state.vaults.map((v) =>
            v.id === id ? { ...v, isLocked: false } : v
          ),
          activeVaultId: id,
        }))
        
        return true
      },
      
      addSourceToVault: (vaultId, sourceId) => {
        set((state) => ({
          vaults: state.vaults.map((v) =>
            v.id === vaultId && !v.sourceIds.includes(sourceId)
              ? { ...v, sourceIds: [...v.sourceIds, sourceId] }
              : v
          ),
        }))
      },
      
      removeSourceFromVault: (vaultId, sourceId) => {
        set((state) => ({
          vaults: state.vaults.map((v) =>
            v.id === vaultId
              ? { ...v, sourceIds: v.sourceIds.filter((id) => id !== sourceId) }
              : v
          ),
        }))
      },
      
      getVault: (id) => {
        return get().vaults.find((v) => v.id === id)
      },
      
      getVaultBySourceId: (sourceId) => {
        return get().vaults.find((v) => v.sourceIds.includes(sourceId))
      },
      
      getActiveVault: () => {
        const { activeVaultId, vaults } = get()
        return vaults.find((v) => v.id === activeVaultId)
      },
      
      isSourceInVault: (sourceId) => {
        return get().vaults.some((v) => v.sourceIds.includes(sourceId))
      },
    }),
    {
      name: 'reel-reader-vaults',
      partialize: (state) => ({
        vaults: state.vaults.map((v) => ({ ...v, isLocked: true })), // Always persist as locked
        activeVaultId: undefined, // Never persist active vault
      }),
    }
  )
)
