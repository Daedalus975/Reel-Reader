import React, { useEffect, useState } from 'react'
import { useUIStore } from '@store/index'
import type { Profile } from '../types'

const mockProfile: Profile = {
  id: 'default',
  name: 'Primary Profile',
  avatar: undefined,
  adultContentEnabled: false,
  isDefault: true,
}

export const Account: React.FC = () => {
  const { setCurrentPage } = useUIStore()
  const [profile] = useState<Profile>(mockProfile)

  useEffect(() => {
    setCurrentPage('/account')
  }, [setCurrentPage])


  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-light mb-6">Account</h1>

      <section className="bg-surface p-6 rounded-none mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold text-light mb-3">Profile</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p><span className="text-light font-medium">Name:</span> {profile.name}</p>
          <p><span className="text-light font-medium">Default:</span> {profile.isDefault ? 'Yes' : 'No'}</p>
        </div>
      </section>

      {/* Content controls removed as adult visibility is profile-based */}

      <section className="bg-surface p-6 rounded-none max-w-3xl space-y-2">
        <h2 className="text-xl font-semibold text-light">Security</h2>
        <p className="text-sm text-gray-400">2FA, device approvals, and session management go here (stub).</p>
      </section>
    </main>
  )
}
