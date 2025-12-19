import { useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { useProfileStore } from '../store/profileStore'

interface ProfilePinModalProps {
  profileId: string
  onClose: () => void
  onSuccess: () => void
}

export function ProfilePinModal({ profileId, onClose, onSuccess }: ProfilePinModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const { verifyPin } = useProfileStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (pin.length < 4) {
      setError('Password/PIN must be at least 4 characters')
      return
    }

    const isValid = await verifyPin(profileId, pin)
    if (isValid) {
      onSuccess()
      onClose()
    } else {
      setError('Incorrect password/PIN')
      setPin('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Enter Password</h2>
          <p className="text-white/60 text-center">
            This profile is protected
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm text-white/60 mb-2">Password/PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your password or PIN"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pin.length < 4}
              className="flex-1"
            >
              Unlock
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
