import React, { useState, useEffect } from 'react'
import { X, Keyboard, Check } from 'lucide-react'
import { getAvailableHotkeys, isHotkeyRegistered } from '@/services/globalHotkeys'
import { isDesktop } from '@/utils/runtime'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [hotkeys] = useState(getAvailableHotkeys())
  const [registeredStatus, setRegisteredStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isOpen || !isDesktop()) return

    // Check registration status for each hotkey
    const checkStatuses = async () => {
      const statuses: Record<string, boolean> = {}
      for (const hotkey of hotkeys) {
        statuses[hotkey.keys] = await isHotkeyRegistered(hotkey.keys)
      }
      setRegisteredStatus(statuses)
    }

    checkStatuses()
  }, [isOpen, hotkeys])

  if (!isOpen) return null

  const formatKeys = (keys: string): string => {
    return keys
      .replace('CommandOrControl', '⌘/Ctrl')
      .replace('Alt', 'Alt')
      .replace('Shift', 'Shift')
      .replace('MediaPlayPause', 'Play/Pause Key')
      .replace('MediaNextTrack', 'Next Track Key')
      .replace('MediaPrevTrack', 'Previous Track Key')
      .replace('MediaStop', 'Stop Key')
      .replace('Left', '←')
      .replace('Right', '→')
      .replace('Up', '↑')
      .replace('Down', '↓')
      .replace('+', ' + ')
  }

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'play-pause':
        return 'bg-green-600'
      case 'next':
        return 'bg-blue-600'
      case 'previous':
        return 'bg-purple-600'
      case 'volume-up':
      case 'volume-down':
        return 'bg-yellow-600'
      case 'mute':
        return 'bg-orange-600'
      case 'stop':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const localShortcuts = [
    { keys: 'Space', action: 'Play/Pause', context: 'Video Player' },
    { keys: '← / →', action: 'Seek ±10s', context: 'Video Player' },
    { keys: 'F', action: 'Fullscreen', context: 'Video Player' },
    { keys: 'M', action: 'Mute', context: 'Video Player' },
    { keys: '↑ / ↓', action: 'Volume ±10%', context: 'Video Player' },
    { keys: '0-9', action: 'Seek to %', context: 'Video Player' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-none max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-dark p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="text-primary" size={24} />
            <h2 className="text-2xl font-bold text-light">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark rounded-none transition text-light"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Global Hotkeys Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-light">Global Hotkeys</h3>
              {!isDesktop() && (
                <span className="text-sm text-yellow-400">Desktop app only</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              These shortcuts work system-wide, even when the app is in the background.
            </p>
            <div className="space-y-2">
              {hotkeys.map((hotkey) => (
                <div
                  key={hotkey.keys}
                  className="flex items-center justify-between bg-dark p-4 rounded-none"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span
                      className={`${getActionColor(
                        hotkey.action
                      )} text-white text-xs font-bold px-2 py-1 rounded-none uppercase min-w-[100px] text-center`}
                    >
                      {hotkey.action}
                    </span>
                    <span className="text-light">{hotkey.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <kbd className="px-3 py-1 bg-surface text-light text-sm font-mono rounded-none border border-gray-600">
                      {formatKeys(hotkey.keys)}
                    </kbd>
                    {isDesktop() && registeredStatus[hotkey.keys] && (
                      <Check size={16} className="text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Local Shortcuts Section */}
          <section>
            <h3 className="text-xl font-semibold text-light mb-4">Local Shortcuts</h3>
            <p className="text-sm text-gray-400 mb-4">
              These shortcuts only work when the app window is focused.
            </p>
            <div className="space-y-2">
              {localShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-dark p-4 rounded-none"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-gray-400 text-sm min-w-[120px]">
                      {shortcut.context}
                    </span>
                    <span className="text-light">{shortcut.action}</span>
                  </div>
                  <kbd className="px-3 py-1 bg-surface text-light text-sm font-mono rounded-none border border-gray-600">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Tips Section */}
          <section className="bg-dark p-4 rounded-none">
            <h4 className="text-light font-semibold mb-2">Tips</h4>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Media keys (Play/Pause, Next, Previous) are standard multimedia keyboard keys</li>
              <li>Custom hotkeys use ⌘/Ctrl + Alt combinations to avoid conflicts</li>
              <li>Global hotkeys can be disabled in Settings if they conflict with other apps</li>
              <li>Some hotkeys may not work on all platforms or keyboard layouts</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
