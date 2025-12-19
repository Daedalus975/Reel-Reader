import { useState } from 'react'
import { Cloud, CloudOff, RefreshCw, Save, AlertCircle, Check } from 'lucide-react'
import { useCloudSyncStore } from '../store/cloudSyncStore'
import { Button } from '../components/Button'
import { HeaderBar } from '../components/HeaderBar'

export function CloudSync() {
  const {
    enabled,
    provider,
    lastSync,
    syncInProgress,
    autoSync,
    syncInterval,
    conflictResolution,
    enableSync,
    disableSync,
    syncNow,
    updateConfig,
    createBackup
  } = useCloudSyncStore()

  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<'firebase' | 'supabase' | 'custom'>('firebase')

  const handleEnable = () => {
    enableSync(selectedProvider, {
      ...(selectedProvider === 'custom' && { endpoint }),
      ...(apiKey && { apiKey })
    })
  }

  const handleSync = async () => {
    try {
      await syncNow()
      alert('Sync completed successfully!')
    } catch (error) {
      alert('Sync failed: ' + error)
    }
  }

  const handleBackup = async () => {
    const backupId = await createBackup()
    alert(`Backup created: ${backupId}`)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <HeaderBar />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cloud Sync</h1>
          <p className="text-white/60 mt-1">
            Sync your library and progress across devices
          </p>
        </div>

        {/* Status */}
        <div className={`
          border-2 rounded-lg p-6 flex items-center gap-4
          ${enabled ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}
        `}>
          {enabled ? (
            <>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Cloud size={24} className="text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Sync Enabled</h3>
                <p className="text-sm text-white/60 mt-1">
                  Provider: {provider} • Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                </p>
              </div>
              <Button variant="secondary" onClick={disableSync}>
                <CloudOff size={20} />
                Disable
              </Button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <CloudOff size={24} className="text-white/40" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Sync Disabled</h3>
                <p className="text-sm text-white/60 mt-1">
                  Enable cloud sync to backup and sync across devices
                </p>
              </div>
            </>
          )}
        </div>

        {!enabled && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Setup Cloud Sync</h2>

            <div>
              <label className="text-sm text-white/60 mb-2 block">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="firebase">Firebase</option>
                <option value="supabase">Supabase</option>
                <option value="custom">Custom Backend</option>
              </select>
            </div>

            {selectedProvider === 'custom' && (
              <div>
                <label className="text-sm text-white/60 mb-2 block">API Endpoint</label>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-white/60 mb-2 block">API Key (Optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <Button onClick={handleEnable} className="w-full">
              <Cloud size={20} />
              Enable Sync
            </Button>
          </div>
        )}

        {enabled && (
          <>
            {/* Sync Controls */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sync Controls</h2>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleSync}
                  disabled={syncInProgress}
                  className="w-full"
                >
                  <RefreshCw size={20} className={syncInProgress ? 'animate-spin' : ''} />
                  {syncInProgress ? 'Syncing...' : 'Sync Now'}
                </Button>

                <Button
                  onClick={handleBackup}
                  variant="secondary"
                  className="w-full"
                >
                  <Save size={20} />
                  Create Backup
                </Button>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Settings</h2>

              <label className="flex items-center justify-between">
                <span className="text-sm">Automatic Sync</span>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => updateConfig({ autoSync: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              {autoSync && (
                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Sync Interval: {syncInterval} minutes
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={syncInterval}
                    onChange={(e) => updateConfig({ syncInterval: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-white/60 mb-2 block">Conflict Resolution</label>
                <select
                  value={conflictResolution}
                  onChange={(e) => updateConfig({ conflictResolution: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="local">Prefer Local Changes</option>
                  <option value="remote">Prefer Remote Changes</option>
                  <option value="manual">Manual Resolution</option>
                </select>
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-400">
                <p className="font-medium mb-1">Sync Status</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center gap-2">
                    <Check size={14} />
                    Media library synced
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} />
                    Playback progress synced
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} />
                    Settings synced
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
