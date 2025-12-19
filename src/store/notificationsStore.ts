import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  actionLabel?: string
  actionCallback?: () => void
  dismissable: boolean
}

interface NotificationsState {
  notifications: Notification[]
  maxNotifications: number

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissNotification: (id: string) => void
  clearAll: () => void
  getUnreadCount: () => number
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      maxNotifications: 50,

      addNotification: (notificationData) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const notification: Notification = {
          ...notificationData,
          id,
          timestamp: Date.now(),
          read: false,
        }

        set((state) => {
          const newNotifications = [notification, ...state.notifications]
          // Keep only the last N notifications
          if (newNotifications.length > state.maxNotifications) {
            newNotifications.splice(state.maxNotifications)
          }
          return { notifications: newNotifications }
        })

        return id
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({
            ...notif,
            read: true,
          })),
        }))
      },

      dismissNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== id),
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      getUnreadCount: () => {
        return get().notifications.filter((notif) => !notif.read).length
      },
    }),
    {
      name: 'reel-reader-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, state.maxNotifications),
      }),
    }
  )
)
