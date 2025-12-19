// Cast Device Selector Component
// Features: #64-66 - DLNA/Chromecast casting

import React, { useEffect, useState } from 'react'
import { Tv, Cast, RefreshCw, X } from 'lucide-react'
import { useCastingStore } from '../store/castingStore'

interface CastDeviceSelectorProps {
  isOpen: boolean
  onClose: () => void
  mediaId?: string
  onCastStart?: () => void
}

export const CastDeviceSelector: React.FC<CastDeviceSelectorProps> = ({
  isOpen,
  onClose,
  mediaId,
  onCastStart,
}) => {
  const {
    devices,
    activeSession,
    isDiscovering,
    startDiscovery,
    stopDiscovery,
    startCast,
    stopCast,
  } = useCastingStore()

  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      startDiscovery()
    }
    return () => {
      stopDiscovery()
    }
  }, [isOpen])

  const handleCast = async () => {
    if (!selectedDevice || !mediaId) return

    try {
      await startCast(selectedDevice, mediaId)
      onCastStart?.()
      onClose()
    } catch (error) {
      console.error('Failed to start cast:', error)
      alert('Failed to start casting. Please try again.')
    }
  }

  const handleStopCast = () => {
    stopCast()
    onClose()
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'chromecast':
        return <Cast className="w-5 h-5" />
      case 'dlna':
        return <Tv className="w-5 h-5" />
      case 'airplay':
        return <Tv className="w-5 h-5" />
      default:
        return <Tv className="w-5 h-5" />
    }
  }

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-400'
      case 'connected':
        return 'text-primary'
      case 'busy':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-surface rounded-none p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-light">Cast to Device</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-light hover:bg-dark rounded-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Session */}
        {activeSession && (
          <div className="bg-primary/10 border border-primary rounded-none p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Cast className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium text-primary">Currently Casting</div>
                <div className="text-xs text-gray-400">
                  {devices.find((d) => d.id === activeSession.deviceId)?.name}
                </div>
              </div>
            </div>
            <button
              onClick={handleStopCast}
              className="w-full px-3 py-2 bg-red-500/20 text-red-300 rounded-none hover:bg-red-500/30 transition-colors text-sm"
            >
              Stop Casting
            </button>
          </div>
        )}

        {/* Discovery Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-400">
            {isDiscovering ? 'Searching for devices...' : `${devices.length} device(s) found`}
          </div>
          <button
            onClick={() => startDiscovery()}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-none disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isDiscovering ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Device List */}
        <div className="space-y-2">
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No devices found</p>
              <p className="text-gray-500 text-sm mt-1">
                Make sure your devices are on the same network
              </p>
            </div>
          ) : (
            devices.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                disabled={device.status === 'busy'}
                className={`w-full p-4 rounded-none text-left transition-all ${
                  selectedDevice === device.id
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-dark hover:bg-surface-light border-2 border-transparent'
                } ${device.status === 'busy' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={getDeviceStatusColor(device.status)}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-light truncate">{device.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 capitalize">{device.type}</span>
                      {device.ipAddress && (
                        <span className="text-xs text-gray-600">{device.ipAddress}</span>
                      )}
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${getDeviceStatusColor(device.status)}`}>
                    {device.status === 'available' && '●'}
                    {device.status === 'connected' && '● Connected'}
                    {device.status === 'busy' && '● Busy'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        {!activeSession && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark text-gray-400 rounded-none hover:text-light"
            >
              Cancel
            </button>
            <button
              onClick={handleCast}
              disabled={!selectedDevice || !mediaId}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-none hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Casting
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-dark rounded-none">
          <p className="text-xs text-gray-400">
            <strong>Supported devices:</strong> DLNA/UPnP media renderers, Chromecast (requires
            feature flag), AirPlay (macOS/iOS only)
          </p>
        </div>
      </div>
    </div>
  )
}
