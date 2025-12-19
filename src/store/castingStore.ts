// Casting Store - Device discovery and casting management
// Features: #64-66, #171-177, #182-187

import { create } from 'zustand'
import type { CastDevice, CastSession } from '../types'

interface CastingStore {
  devices: CastDevice[]
  activeSession?: CastSession
  isDiscovering: boolean
  
  // Device discovery
  startDiscovery: () => Promise<void>
  stopDiscovery: () => void
  addDevice: (device: CastDevice) => void
  removeDevice: (deviceId: string) => void
  updateDeviceStatus: (deviceId: string, status: CastDevice['status']) => void
  
  // Casting
  startCast: (deviceId: string, mediaId: string) => Promise<void>
  stopCast: () => void
  pauseCast: () => void
  resumeCast: () => void
  seekCast: (position: number) => void
  updateCastPosition: (position: number) => void
  
  // Queries
  getDevice: (id: string) => CastDevice | undefined
  getAvailableDevices: () => CastDevice[]
}

export const useCastingStore = create<CastingStore>()((set, get) => ({
  devices: [],
  activeSession: undefined,
  isDiscovering: false,
  
  startDiscovery: async () => {
    set({ isDiscovering: true })
    
    // Stub implementation - real implementation would use:
    // - DLNA/SSDP discovery for DLNA devices
    // - Cast SDK for Chromecast
    // - Bonjour/mDNS for AirPlay
    
    try {
      // Simulate discovery delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Add mock devices for testing
      if (get().devices.length === 0) {
        get().addDevice({
          id: 'mock-dlna-1',
          name: 'Living Room TV',
          type: 'dlna',
          status: 'available',
          ipAddress: '192.168.1.100',
        })
      }
    } finally {
      set({ isDiscovering: false })
    }
  },
  
  stopDiscovery: () => {
    set({ isDiscovering: false })
  },
  
  addDevice: (device) => {
    set((state) => {
      const exists = state.devices.some((d) => d.id === device.id)
      if (exists) return state
      return { devices: [...state.devices, device] }
    })
  },
  
  removeDevice: (deviceId) => {
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
    }))
  },
  
  updateDeviceStatus: (deviceId, status) => {
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, status } : d
      ),
    }))
  },
  
  startCast: async (deviceId, mediaId) => {
    const device = get().getDevice(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }
    
    set({ activeSession: undefined })
    get().updateDeviceStatus(deviceId, 'connected')
    
    // Stub implementation - real implementation would:
    // - For DLNA: Use UPnP SetAVTransportURI + Play commands
    // - For Chromecast: Use Cast SDK loadMedia
    // - For AirPlay: Use AirPlay protocol
    
    const session: CastSession = {
      id: `cast-${Date.now()}`,
      deviceId,
      mediaId,
      status: 'playing',
      position: 0,
    }
    
    set({ activeSession: session })
  },
  
  stopCast: () => {
    const session = get().activeSession
    if (session) {
      get().updateDeviceStatus(session.deviceId, 'available')
    }
    set({ activeSession: undefined })
  },
  
  pauseCast: () => {
    set((state) => {
      if (!state.activeSession) return state
      return {
        activeSession: {
          ...state.activeSession,
          status: 'paused',
        },
      }
    })
  },
  
  resumeCast: () => {
    set((state) => {
      if (!state.activeSession) return state
      return {
        activeSession: {
          ...state.activeSession,
          status: 'playing',
        },
      }
    })
  },
  
  seekCast: (position) => {
    set((state) => {
      if (!state.activeSession) return state
      return {
        activeSession: {
          ...state.activeSession,
          position,
        },
      }
    })
  },
  
  updateCastPosition: (position) => {
    set((state) => {
      if (!state.activeSession) return state
      return {
        activeSession: {
          ...state.activeSession,
          position,
        },
      }
    })
  },
  
  getDevice: (id) => {
    return get().devices.find((d) => d.id === id)
  },
  
  getAvailableDevices: () => {
    return get().devices.filter((d) => d.status === 'available')
  },
}))
