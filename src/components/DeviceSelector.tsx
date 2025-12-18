import React, { useEffect, useState } from 'react'
import { getAvailableDevices, getDeviceId } from '@/services/spotifyPlayback'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'

export const DeviceSelector: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const transferToDevice = useSpotifyPlaybackStore((s) => s.transferToDevice)
  const currentDeviceId = getDeviceId()

  useEffect(() => {
    setLoading(true)
    getAvailableDevices()
      .then((d) => setDevices(d))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-400">Device</div>
      <select
        className="bg-dark/60 text-sm p-1 rounded-none"
        value={currentDeviceId || ''}
        onChange={(e) => transferToDevice(e.target.value)}
      >
        <option value="">Auto</option>
        {loading ? <option>Loading...</option> : null}
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} {d.is_active ? '• active' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

export default DeviceSelector
