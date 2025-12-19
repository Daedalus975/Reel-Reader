import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../store/profileStore'
import { useProfileMediaStore } from '../store/profileMediaStore'
import { Button } from '../components/Button'
import { ProfilePinModal } from '../components/ProfilePinModal'
import { COLORS } from '../styles/tokens'

export function Profile() {
  const navigate = useNavigate()
  const { profiles, currentProfileId, createProfile, switchProfile, deleteProfile, verifyPin, setProfilePin } = useProfileStore()
  const { initializeProfileMedia } = useProfileMediaStore()
  const [newProfileName, setNewProfileName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [adultOnly, setAdultOnly] = useState(false)
  const [newProfilePassword, setNewProfilePassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      const newProfile = createProfile(newProfileName.trim(), undefined, adultOnly)
      if (usePassword && newProfilePassword.trim()) {
        setProfilePin(newProfile.id, newProfilePassword.trim())
      }
      initializeProfileMedia(newProfile.id)
      // Auto-navigate to appropriate home based on profile type
      if (adultOnly) {
        navigate('/adult/movies')
      } else {
        navigate('/')
      }
      setNewProfileName('')
      setNewProfilePassword('')
      setUsePassword(false)
      setAdultOnly(false)
      setShowCreateForm(false)
    }
  }

  const handleSwitchProfile = async (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) return

    // Check if profile has a PIN
    if (profile.pinHash) {
      setSelectedProfileId(profileId)
      setShowPinModal(true)
      return
    }

    // No PIN required, switch immediately
    switchProfile(profileId)
    // Auto-navigate based on profile type
    if (profile.adultContentEnabled) {
      navigate('/adult/movies')
    } else {
      navigate('/')
    }
  }

  const handlePinVerified = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) return

    switchProfile(profileId)
    setShowPinModal(false)
    setSelectedProfileId(null)
    // Auto-navigate based on profile type
    if (profile.adultContentEnabled) {
      navigate('/adult/movies')
    } else {
      navigate('/')
    }
  }

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length > 1) {
      deleteProfile(profileId)
    }
  }

  return (
    <div className={`min-h-screen bg-dark text-light p-8`}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: COLORS.highlight }}>Profiles</h1>

        {/* Current Profile Display */}
        <div className="mb-8 p-6 rounded-lg border border-surface/40" style={{ backgroundColor: 'rgba(36, 22, 76, 0.2)' }}>
          <h2 className="text-lg font-semibold mb-4">Current Profile</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{profiles.find((p) => p.id === currentProfileId)?.name}</p>
              <p className="text-sm opacity-60">ID: {currentProfileId}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-surface/40" style={{ backgroundColor: `rgba(22, 89, 182, 0.4)` }}>
              {profiles.find((p) => p.id === currentProfileId)?.avatar ? (
                profiles.find((p) => p.id === currentProfileId)?.avatar?.startsWith('data:') || profiles.find((p) => p.id === currentProfileId)?.avatar?.startsWith('http') ? (
                  <img src={profiles.find((p) => p.id === currentProfileId)?.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold">{profiles.find((p) => p.id === currentProfileId)?.avatar}</span>
                )
              ) : (
                <span className="text-xl font-bold">👤</span>
              )}
            </div>
          </div>
        </div>

        {/* Profiles List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Profiles</h2>
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-4 rounded-lg border-2 transition-all`}
                style={{
                  borderColor: profile.id === currentProfileId ? COLORS.highlight : 'rgba(36, 22, 76, 0.4)',
                  backgroundColor: profile.id === currentProfileId ? 'rgba(225, 213, 13, 0.1)' : 'rgba(36, 22, 76, 0.1)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-surface/40" style={{ backgroundColor: 'rgba(22, 89, 182, 0.4)' }}>
                      {profile.avatar ? (
                        profile.avatar.startsWith('data:') || profile.avatar.startsWith('http') ? (
                          <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{profile.avatar}</span>
                        )
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{profile.name}</p>
                      <p className="text-xs opacity-60">
                        {profile.isDefault ? 'Default' : profile.adultContentEnabled ? 'Adult Profile' : 'General Profile'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {profile.id !== currentProfileId && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSwitchProfile(profile.id)}
                      >
                        Switch
                      </Button>
                    )}
                    {!profile.isDefault && profiles.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProfile(profile.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Profile */}
        <div className="rounded-lg p-6 border border-surface/40" style={{ backgroundColor: 'rgba(36, 22, 76, 0.1)' }}>
          <h2 className="text-lg font-semibold mb-4">Add New Profile</h2>
          {showCreateForm ? (
            <div className="space-y-4">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name"
                className="w-full px-4 py-2 rounded-lg text-light placeholder-opacity-40 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgba(36, 22, 76, 0.3)',
                  borderColor: 'rgba(36, 22, 76, 0.4)',
                  borderWidth: '1px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProfile()
                  }
                }}
              />
              <label className="flex items-center gap-2 text-sm opacity-80">
                <input
                  type="checkbox"
                  checked={adultOnly}
                  onChange={(e) => setAdultOnly(e.target.checked)}
                />
                Adult content profile
              </label>
              
              <label className="flex items-center gap-2 text-sm opacity-80">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                />
                Require password/PIN
              </label>
              
              {usePassword && (
                <input
                  type="text"
                  value={newProfilePassword}
                  onChange={(e) => setNewProfilePassword(e.target.value)}
                  placeholder="Enter password/PIN (letters and numbers)"
                  className="w-full px-4 py-2 rounded-lg text-light placeholder-opacity-40 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(36, 22, 76, 0.3)',
                    borderColor: 'rgba(36, 22, 76, 0.4)',
                    borderWidth: '1px',
                  }}
                />
              )}
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewProfileName('')
                    setNewProfilePassword('')
                    setUsePassword(false)
                    setAdultOnly(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim()}
                >
                  Create Profile
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
            >
              + Create New Profile
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 rounded-lg border text-sm text-light" style={{ backgroundColor: 'rgba(22, 89, 182, 0.1)', borderColor: 'rgba(22, 89, 182, 0.2)' }}>
          <p>💡 Each profile has its own library, favorites, and watch history. Switch profiles anytime to see different media collections.</p>
        </div>
      </div>
      
      {/* PIN Modal */}
      {showPinModal && selectedProfileId && (
        <ProfilePinModal
          isOpen={showPinModal}
          onClose={() => {
            setShowPinModal(false)
            setSelectedProfileId(null)
          }}
          onSuccess={() => handlePinVerified(selectedProfileId)}
          profileId={selectedProfileId}
          mode="verify"
        />
      )}
    </div>
  )
}
