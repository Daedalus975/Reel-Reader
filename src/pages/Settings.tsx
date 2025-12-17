import React from 'react'

export const Settings: React.FC = () => {

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
    </main>
  )
}
