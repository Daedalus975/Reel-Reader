import React, { useState } from 'react'
import { useUIStore } from '@store/index'
import { BulkUpdateModal } from '@components/index'

export const Settings: React.FC = () => {
  const edgeOpenEnabled = useUIStore((s) => s.sidebarEdgeOpenEnabled)
  const setEdgeOpenEnabled = useUIStore((s) => s.setSidebarEdgeOpenEnabled)
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-light mb-8">Settings</h1>

      {/* General Settings */}
      <section className="bg-surface p-6 rounded-none mb-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-light mb-4">General</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light font-medium">Dark Mode</p>
              <p className="text-sm text-gray-400">Always enabled</p>
            </div>
            <input type="checkbox" defaultChecked disabled />
          </div>
          <div className="h-px bg-dark" />
          <div>
            <p className="text-light font-medium mb-2">Default Library View</p>
            <select className="bg-dark text-light px-3 py-2 rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Grid</option>
              <option>List</option>
            </select>
          </div>
          <div className="h-px bg-dark" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light font-medium">Auto-open sidebar on edge hover</p>
              <p className="text-sm text-gray-400">Open menu when cursor hits the left edge (desktop).</p>
            </div>
            <input
              type="checkbox"
              checked={edgeOpenEnabled}
              onChange={(e) => setEdgeOpenEnabled(e.target.checked)}
              className="accent-primary h-4 w-4"
            />
          </div>
          <div className="h-px bg-dark" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light font-medium">Bulk metadata update</p>
              <p className="text-sm text-gray-400">Run global merge updates with progress tracking.</p>
            </div>
            <button
              onClick={() => setShowBulkUpdate(true)}
              className="px-4 py-2 bg-primary text-white rounded-none hover:bg-primary/80 text-sm"
            >
              Open
            </button>
          </div>
        </div>
      </section>

      {/* Content Settings removed: adult visibility is enforced per profile */}

      {/* About Section */}
      <section className="bg-surface p-6 rounded-none max-w-2xl">
        <h2 className="text-xl font-semibold text-light mb-4">About</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            <span className="text-light font-medium">App Version:</span> 0.1.0
          </p>
          <p>
            <span className="text-light font-medium">Built with:</span> React + TypeScript + Tailwind CSS
          </p>
        </div>
      </section>

      <BulkUpdateModal isOpen={showBulkUpdate} onClose={() => setShowBulkUpdate(false)} />
    </main>
  )
}
