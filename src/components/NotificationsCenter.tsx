import React from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Trash2 } from 'lucide-react'
import { useNotificationsStore, type Notification } from '@/store/notificationsStore'

interface NotificationsCenterProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={18} className="text-green-400" />
    case 'error':
      return <AlertCircle size={18} className="text-red-400" />
    case 'warning':
      return <AlertTriangle size={18} className="text-yellow-400" />
    case 'info':
    default:
      return <Info size={18} className="text-blue-400" />
  }
}

const NotificationItem: React.FC<{
  notification: Notification
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
}> = ({ notification, onDismiss, onMarkRead }) => {
  const formattedTime = new Date(notification.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`p-4 border-b border-surface hover:bg-surface/30 transition ${
        !notification.read ? 'bg-surface/10' : ''
      }`}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-light">{notification.title}</h4>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          
          <p className="text-xs text-gray-400 mb-1">{notification.message}</p>
          <p className="text-xs text-gray-500">{formattedTime}</p>

          <div className="flex items-center gap-2 mt-2">
            {notification.actionLabel && notification.actionCallback && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  notification.actionCallback?.()
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                {notification.actionLabel}
              </button>
            )}
            
            {notification.dismissable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(notification.id)
                }}
                className="text-xs text-gray-500 hover:text-red-400 transition"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const notifications = useNotificationsStore((state) => state.notifications)
  const markAsRead = useNotificationsStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead)
  const dismissNotification = useNotificationsStore((state) => state.dismissNotification)
  const clearAll = useNotificationsStore((state) => state.clearAll)

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-dark border-l border-surface z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface">
          <div>
            <h2 className="text-lg font-bold text-light">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-none text-gray-400 hover:text-light transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-surface bg-surface/30">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-red-400 transition flex items-center gap-1"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Info size={48} className="text-gray-600 mb-4" />
              <p className="text-sm text-gray-400">No notifications yet</p>
              <p className="text-xs text-gray-500 mt-1">
                You'll see updates about imports, scans, and other operations here
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDismiss={dismissNotification}
                onMarkRead={markAsRead}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
