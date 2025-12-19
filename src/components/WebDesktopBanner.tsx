import React from 'react'
import { isDesktop } from '@/utils/runtime'

export const WebDesktopBanner: React.FC = () => {
  const desktop = isDesktop()
  if (desktop) return null
  return (
    <div className="bg-yellow-600 text-black px-4 py-2 text-sm text-center">
      Note: Some features (local folder scanning, offline downloads, global hotkeys) are only available in the desktop app.
    </div>
  )
}

export default WebDesktopBanner
