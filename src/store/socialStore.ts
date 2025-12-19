import { create } from 'zustand'

interface ShareLink {
  id: string
  mediaId: string
  token: string
  expiresAt?: Date
  accessCount: number
  maxAccess?: number
  createdAt: Date
}

interface Friend {
  id: string
  username: string
  avatar?: string
  status: 'pending' | 'accepted' | 'blocked'
}

interface Recommendation {
  id: string
  mediaId: string
  fromUserId: string
  message?: string
  createdAt: Date
  viewed: boolean
}

interface SocialState {
  shareLinks: ShareLink[]
  friends: Friend[]
  recommendations: Recommendation[]
}

interface SocialActions {
  // Share Links
  createShareLink: (mediaId: string, options?: { expiresIn?: number; maxAccess?: number }) => ShareLink
  revokeShareLink: (linkId: string) => void
  getShareLink: (linkId: string) => ShareLink | undefined
  incrementAccess: (linkId: string) => void
  
  // Friends
  sendFriendRequest: (userId: string) => void
  acceptFriendRequest: (userId: string) => void
  removeFriend: (userId: string) => void
  blockUser: (userId: string) => void
  
  // Recommendations
  sendRecommendation: (mediaId: string, friendId: string, message?: string) => void
  markRecommendationViewed: (recommendationId: string) => void
  deleteRecommendation: (recommendationId: string) => void
}

export const useSocialStore = create<SocialState & SocialActions>()((set, get) => ({
  // State
  shareLinks: [],
  friends: [],
  recommendations: [],

  // Share Links
  createShareLink: (mediaId, options) => {
    const link: ShareLink = {
      id: crypto.randomUUID(),
      mediaId,
      token: crypto.randomUUID().replace(/-/g, '').substring(0, 16),
      expiresAt: options?.expiresIn
        ? new Date(Date.now() + options.expiresIn * 1000)
        : undefined,
      accessCount: 0,
      maxAccess: options?.maxAccess,
      createdAt: new Date()
    }

    set((state) => ({
      shareLinks: [...state.shareLinks, link]
    }))

    return link
  },

  revokeShareLink: (linkId) => {
    set((state) => ({
      shareLinks: state.shareLinks.filter((l) => l.id !== linkId)
    }))
  },

  getShareLink: (linkId) => {
    const link = get().shareLinks.find((l) => l.id === linkId)
    
    if (!link) return undefined
    
    // Check expiry
    if (link.expiresAt && link.expiresAt < new Date()) {
      get().revokeShareLink(linkId)
      return undefined
    }
    
    // Check max access
    if (link.maxAccess && link.accessCount >= link.maxAccess) {
      return undefined
    }
    
    return link
  },

  incrementAccess: (linkId) => {
    set((state) => ({
      shareLinks: state.shareLinks.map((l) =>
        l.id === linkId ? { ...l, accessCount: l.accessCount + 1 } : l
      )
    }))
  },

  // Friends
  sendFriendRequest: (userId) => {
    const friend: Friend = {
      id: userId,
      username: userId, // TODO: Fetch from API
      status: 'pending'
    }

    set((state) => ({
      friends: [...state.friends, friend]
    }))
  },

  acceptFriendRequest: (userId) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === userId ? { ...f, status: 'accepted' as const } : f
      )
    }))
  },

  removeFriend: (userId) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== userId)
    }))
  },

  blockUser: (userId) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === userId ? { ...f, status: 'blocked' as const } : f
      )
    }))
  },

  // Recommendations
  sendRecommendation: (mediaId, friendId, message) => {
    const recommendation: Recommendation = {
      id: crypto.randomUUID(),
      mediaId,
      fromUserId: friendId,
      message,
      createdAt: new Date(),
      viewed: false
    }

    set((state) => ({
      recommendations: [...state.recommendations, recommendation]
    }))
  },

  markRecommendationViewed: (recommendationId) => {
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === recommendationId ? { ...r, viewed: true } : r
      )
    }))
  },

  deleteRecommendation: (recommendationId) => {
    set((state) => ({
      recommendations: state.recommendations.filter((r) => r.id !== recommendationId)
    }))
  }
}))
