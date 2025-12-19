import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WatchParty, ChatMessage } from '../types/features'

interface WatchPartyState {
  parties: WatchParty[]
  activePartyId: string | null
  isHost: boolean
  syncEnabled: boolean
}

interface WatchPartyActions {
  // Party Management
  createParty: (mediaId: string) => WatchParty
  joinParty: (partyId: string) => void
  leaveParty: () => void
  endParty: (partyId: string) => void
  
  // Sync Control
  syncPosition: (partyId: string, position: number) => void
  syncPlayState: (partyId: string, state: 'playing' | 'paused') => void
  toggleSync: () => void
  
  // Chat
  sendMessage: (partyId: string, text: string, userId: string) => void
  addReaction: (partyId: string, messageId: string, reaction: string) => void
  
  // Participants
  addParticipant: (partyId: string, userId: string) => void
  removeParticipant: (partyId: string, userId: string) => void
  
  // Queries
  getParty: (partyId: string) => WatchParty | undefined
  getActiveParty: () => WatchParty | undefined
}

export const useWatchPartyStore = create<WatchPartyState & WatchPartyActions>()(
  persist(
    (set, get) => ({
      // State
      parties: [],
      activePartyId: null,
      isHost: false,
      syncEnabled: true,

      // Party Management
      createParty: (mediaId) => {
        const party: WatchParty = {
          id: crypto.randomUUID(),
          hostId: 'current-user', // TODO: Get from auth
          mediaId,
          participants: ['current-user'],
          status: 'waiting',
          syncPosition: 0,
          createdAt: new Date(),
          messages: []
        }

        set((state) => ({
          parties: [...state.parties, party],
          activePartyId: party.id,
          isHost: true
        }))

        return party
      },

      joinParty: (partyId) => {
        const userId = 'current-user' // TODO: Get from auth
        
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === partyId
              ? { ...p, participants: [...p.participants, userId] }
              : p
          ),
          activePartyId: partyId,
          isHost: false
        }))
      },

      leaveParty: () => {
        const { activePartyId } = get()
        if (!activePartyId) return

        const userId = 'current-user'

        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === activePartyId
              ? { ...p, participants: p.participants.filter((id) => id !== userId) }
              : p
          ),
          activePartyId: null,
          isHost: false
        }))
      },

      endParty: (partyId) => {
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === partyId ? { ...p, status: 'ended' as const } : p
          ),
          activePartyId: state.activePartyId === partyId ? null : state.activePartyId
        }))
      },

      // Sync Control
      syncPosition: (partyId, position) => {
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === partyId ? { ...p, syncPosition: position } : p
          )
        }))
      },

      syncPlayState: (partyId, state) => {
        set((currentState) => ({
          parties: currentState.parties.map((p) =>
            p.id === partyId ? { ...p, status: state } : p
          )
        }))
      },

      toggleSync: () => {
        set((state) => ({ syncEnabled: !state.syncEnabled }))
      },

      // Chat
      sendMessage: (partyId, text, userId) => {
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          userId,
          text,
          timestamp: new Date()
        }

        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === partyId
              ? { ...p, messages: [...(p.messages || []), message] }
              : p
          )
        }))
      },

      addReaction: (partyId, messageId, reaction) => {
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === partyId
              ? {
                  ...p,
                  messages: p.messages?.map((m) =>
                    m.id === messageId ? { ...m, reaction } : m
                  )
                }
              : p
          )
        }))
      },

      // Participants
      addParticipant: (partyId, userId) => {
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === partyId
              ? { ...p, participants: [...p.participants, userId] }
              : p
          )
        }))
      },

      removeParticipant: (partyId, userId) => {
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === partyId
              ? { ...p, participants: p.participants.filter((id) => id !== userId) }
              : p
          )
        }))
      },

      // Queries
      getParty: (partyId) => {
        return get().parties.find((p) => p.id === partyId)
      },

      getActiveParty: () => {
        const { activePartyId, parties } = get()
        return activePartyId ? parties.find((p) => p.id === activePartyId) : undefined
      }
    }),
    {
      name: 'watch-party-store',
      version: 1,
      partialize: (state) => ({
        // Don't persist active sessions
        parties: state.parties.filter((p) => p.status === 'ended')
      })
    }
  )
)
