import React, { useEffect, useState } from 'react'
import { useUIStore } from '@store/index'
import { useProfileStore } from '../store/profileStore'
import { Button } from '../components/Button'
import type { Profile } from '../types'

export const Account: React.FC = () => {
  const { setCurrentPage } = useUIStore()
  const { profiles, currentProfileId, setProfilePin, removeProfilePin, updateProfile } = useProfileStore()
  const currentProfile = profiles.find(p => p.id === currentProfileId)
  
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState(currentProfile?.avatar || '')

  useEffect(() => {
    setCurrentPage('/account')
  }, [setCurrentPage])

  const handlePasswordUpdate = () => {
    setPasswordError('')
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters')
      return
    }
    
    if (currentProfile) {
      setProfilePin(currentProfile.id, newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setShowPasswordSection(false)
      alert('Password/PIN updated successfully!')
    }
  }


  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-light mb-6">Account</h1>

      <section className="bg-surface p-6 rounded-none mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold text-light mb-3">Profile</h2>
        <div className="space-y-4">
          <div className="space-y-2 text-sm text-gray-300">
            <p><span className="text-light font-medium">Name:</span> {currentProfile?.name}</p>
            <p><span className="text-light font-medium">Type:</span> {currentProfile?.adultContentEnabled ? 'Adult Profile' : 'General Profile'}</p>
            <p><span className="text-light font-medium">Password Protected:</span> {currentProfile?.pinHash ? 'Yes' : 'No'}</p>
          </div>
          
          <div className="h-px bg-dark my-4" />
          
          {/* Profile Picture */}
          <div>
            <p className="text-light font-medium mb-3">Profile Picture</p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-dark flex items-center justify-center overflow-hidden border-2 border-surface">
                {currentProfile?.avatar ? (
                  <img src={currentProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id="profile-picture-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const imageUrl = event.target?.result as string
                        if (currentProfile) {
                          updateProfile(currentProfile.id, { avatar: imageUrl })
                          setProfilePictureUrl(imageUrl)
                        }
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('profile-picture-upload')?.click()}
                >
                  Upload Photo
                </Button>
                {currentProfile?.avatar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentProfile && confirm('Remove profile picture?')) {
                        updateProfile(currentProfile.id, { avatar: undefined })
                        setProfilePictureUrl('')
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface p-6 rounded-none mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold text-light mb-4">Security</h2>
        
        {/* Password/PIN Management */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light font-medium">Password/PIN</p>
              <p className="text-sm text-gray-400">
                {currentProfile?.pinHash ? 'Change your password or PIN' : 'Set a password or PIN to protect this profile'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {currentProfile?.pinHash ? 'Change Password' : 'Set Password'}
              </Button>
              {currentProfile?.pinHash && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentProfile && confirm('Remove password protection from this profile?')) {
                      removeProfilePin(currentProfile.id)
                      alert('Password/PIN removed successfully!')
                    }
                  }}
                >
                  Remove Password
                </Button>
              )}
            </div>
          </div>
          
          {showPasswordSection && (
            <div className="bg-dark p-4 rounded space-y-3">
              {currentProfile?.pinHash && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter current password"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-2">New Password/PIN</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface text-light px-4 py-2 border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className="text-red-400 text-sm">{passwordError}</p>
              )}
              <div className="flex gap-2">
                <Button variant="primary" onClick={handlePasswordUpdate}>
                  Update Password
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowPasswordSection(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setCurrentPassword('')
                  setPasswordError('')
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-px bg-dark my-4" />
        
        {/* MFA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-light font-medium">Multi-Factor Authentication (MFA)</p>
            <p className="text-sm text-gray-400">Add an extra layer of security with 2FA/MFA</p>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mfaEnabled}
              onChange={(e) => {
                setMfaEnabled(e.target.checked)
                if (e.target.checked) {
                  alert('MFA feature coming soon! This will require authentication app setup.')
                }
              }}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-light">{mfaEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        
        <div className="h-px bg-dark my-4" />
        
        <div className="text-sm text-gray-400">
          <p className="mb-2"><strong className="text-light">Security Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use a unique password for each profile</li>
            <li>Enable MFA for enhanced security</li>
            <li>Passwords are stored securely using hashing</li>
            <li>Consider using 4+ digit PINs for quick access</li>
          </ul>
        </div>
      </section>

      {/* Metadata Settings */}
      <section className="bg-surface p-6 rounded-none mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold text-light mb-4">Metadata & Import Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light font-medium">Auto-fetch metadata</p>
              <p className="text-sm text-gray-400">Automatically fetch additional information for imported media</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={false}
              className="w-4 h-4 accent-primary"
              onChange={(e) => {
                if (e.target.checked) {
                  alert('Metadata auto-fetch enabled! Information will be retrieved from:\n\n• TMDB (Movies/TV)\n• MusicBrainz (Music)\n• Google Books (Books)\n• Filename parsing\n• .nfo files\n\nConfigure API keys in Settings > Advanced > Metadata Settings')
                }
              }}
            />
          </div>
          
          <div className="h-px bg-dark" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light font-medium">Parse filenames</p>
              <p className="text-sm text-gray-400">Extract metadata from file and folder names</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="w-4 h-4 accent-primary"
            />
          </div>
          
          <div className="h-px bg-dark" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light font-medium">Scan for .nfo files</p>
              <p className="text-sm text-gray-400">Look for Kodi/Plex metadata sidecar files</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="w-4 h-4 accent-primary"
            />
          </div>
          
          
          {/* Adult content metadata toggle - only shown in Adult profiles */}
          {currentProfile?.type === 'adult' && (
            <>
              <div className="h-px bg-dark" />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-light font-medium">Adult content metadata</p>
                  <p className="text-sm text-gray-400">Enable metadata fetching for adult libraries</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="w-4 h-4 accent-primary"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-dark/50 rounded text-sm text-gray-400">
          <p className="font-medium text-light mb-2">📋 Supported Formats:</p>
          <ul className="space-y-1">
            <li><strong className="text-light">Filename patterns:</strong> "Movie Title (2020).mp4", "Show S01E05.mkv", "Artist - Song.mp3"</li>
            <li><strong className="text-light">Sidecar files:</strong> .nfo (Kodi/Plex), .json, .xml</li>
            {currentProfile?.type === 'adult' && (
              <li><strong className="text-light">Adult content:</strong> Product codes (IPX-123), circle names [Circle]</li>
            )}
          </ul>
        </div>
      </section>
    </main>
  )
}
