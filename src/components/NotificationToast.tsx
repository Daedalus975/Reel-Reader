import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useNotificationsStore, type Notification } from '@/store/notificationsStore'

interface NotificationToastProps {
  notification: Notification
  onDismiss: (id: string) => void
}

const ToastIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} className="text-green-400" />
    case 'error':
      return <AlertCircle size={20} className="text-red-400" />
    case 'warning':
      return <AlertTriangle size={20} className="text-yellow-400" />
    case 'info':
    default:
      return <Info size={20} className="text-blue-400" />
  }
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Auto-dismiss after 5 seconds for non-error notifications
    if (notification.type !== 'error' && notification.dismissable) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss(notification.id)
    }, 300)
  }

  const bgColor = {
    success: 'bg-green-900/90 border-green-700',
    error: 'bg-red-900/90 border-red-700',
    warning: 'bg-yellow-900/90 border-yellow-700',
    info: 'bg-blue-900/90 border-blue-700',
  }[notification.type]

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-none shadow-lg backdrop-blur min-w-[320px] max-w-md transition-all duration-300 ${bgColor} ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <ToastIcon type={notification.type} />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-light mb-1">{notification.title}</h4>
        <p className="text-xs text-gray-300 break-words">{notification.message}</p>
        
        {notification.actionLabel && notification.actionCallback && (
          <button
            onClick={() => {
              notification.actionCallback?.()
              handleDismiss()
            }}
            className="mt-2 text-xs text-primary hover:underline font-medium"
          >
            {notification.actionLabel}
          </button>
        )}
      </div>

      {notification.dismissable && (
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-light transition"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export const NotificationToastContainer: React.FC = () => {
  const notifications = useNotificationsStore((state) => state.notifications)
  const dismissNotification = useNotificationsStore((state) => state.dismissNotification)

  // Show only the 3 most recent unread notifications as toasts
  const recentUnread = notifications.filter((n) => !n.read).slice(0, 3)

  if (recentUnread.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {recentUnread.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
          />
        ))}
      </div>
    </div>
  )
}
