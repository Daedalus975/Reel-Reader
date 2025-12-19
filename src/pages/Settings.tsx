import React, { useMemo, useState, useEffect } from 'react'
import { useUIStore } from '@store/index'
import { BulkUpdateModal } from '@components/index'
import { isSpotifyConnected, startSpotifyAuth, disconnectSpotify, refreshSpotifyToken } from '@/services/spotify'
import { useSpotifyStore } from '@store/spotifyStore'
import { createBackup } from '@/services/jobHelpers'
import { KeyboardShortcutsModal } from '@components/KeyboardShortcutsModal'

// Feature flags & feature-specific UIs
import { isFeatureEnabled } from '@/utils/featureFlags'
import { setFeatureFlag } from '@/features/flags'
import { SourcesSettings } from '@components/SourcesSettings'
import { ProviderManagementPanel } from '@components/ProviderManagementPanel'

type SettingsCategory = 'general' | 'appearance' | 'playback' | 'library' | 'integrations' | 'privacy' | 'api-keys' | 'advanced' | 'about'

export const Settings: React.FC = () => {
  const edgeOpenEnabled = useUIStore((s) => s.sidebarEdgeOpenEnabled)
  const setEdgeOpenEnabled = useUIStore((s) => s.setSidebarEdgeOpenEnabled)
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [globalHotkeysEnabled, setGlobalHotkeysEnabled] = useState(isFeatureEnabled('feature_global_hotkeys'))
  const connected = useMemo(() => isSpotifyConnected(), [])
  const [spotifyConnected, setSpotifyConnected] = useState(connected)
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general')

  // UI store - must be at top level, not in JSX
  const debugMode = useUIStore((s) => s.debugMode)
  const setDebugMode = useUIStore((s) => s.setDebugMode)

  // Spotify store
  const spotifyPlaylists = useSpotifyStore((s) => s.playlists)
  const spotifyLoading = useSpotifyStore((s) => s.loading)
  const spotifyError = useSpotifyStore((s) => s.error)
  const fetchPlaylists = useSpotifyStore((s) => s.fetchPlaylists)
  const clearSpotifyData = useSpotifyStore((s) => s.clearSpotifyData)

  async function handleSpotifyConnect() {
    await startSpotifyAuth()
  }

  async function handleSpotifyDisconnect() {
    disconnectSpotify()
    clearSpotifyData()
    setSpotifyConnected(false)
  }

  async function handleFetchSpotifyPlaylists() {
    await fetchPlaylists()
  }

  // Auto-fetch playlists when user first connects (if not already loaded)
  useEffect(() => {
    if (spotifyConnected && spotifyPlaylists.length === 0) {
      fetchPlaylists()
    }
  }, [spotifyConnected, spotifyPlaylists.length, fetchPlaylists])

  async function handleSpotifyRefresh() {
    const ok = await refreshSpotifyToken()
    if (ok) setSpotifyConnected(isSpotifyConnected())
  }

  const categories: { id: SettingsCategory; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'integrations', label: 'Integrations', icon: '🔌' },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
    { id: 'api-keys', label: 'API Keys', icon: '🔑' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ]

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-light mb-8">Settings</h1>

      <div className="flex gap-6 max-w-6xl">
        {/* Category Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-surface rounded-lg p-2 sticky top-24">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors flex items-center gap-3 ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-dark/50'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Settings Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeCategory === 'general' && (
            <section className="bg-surface p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-light mb-6">General</h2>
              <div className="space-y-4">
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
                    <p className="text-light font-medium">Keyboard Shortcuts</p>
                    <p className="text-sm text-gray-400">View all available keyboard shortcuts and hotkeys.</p>
                  </div>
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="px-4 py-2 bg-dark border border-surface text-light rounded-none hover:bg-surface text-sm"
                  >
                    View Shortcuts
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Appearance Settings */}
          {activeCategory === 'appearance' && (
            <section className="bg-surface p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-light mb-6">Appearance</h2>
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
          )}

          {/* Library Settings */}
          {activeCategory === 'library' && (
            <section className="bg-surface p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-light mb-6">Library</h2>
              <div className="space-y-4">
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
                <div className="h-px bg-dark" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-light font-medium">Backup Library Data</p>
                    <p className="text-sm text-gray-400">Export all library data to JSON file.</p>
                  </div>
                  <button
                    onClick={() => createBackup()}
                    className="px-4 py-2 bg-dark border border-surface text-light rounded-none hover:bg-surface text-sm"
                  >
                    Export Backup
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Integrations */}
          {activeCategory === 'integrations' && (
            <section className="bg-surface p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-light mb-6">Integrations</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-light font-medium">Spotify</p>
                    <p className="text-sm text-gray-400">Connect your Spotify account for playlists and metadata.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {spotifyConnected ? (
                      <>
                        <span className="text-xs text-green-400">Connected</span>
                        <button onClick={handleSpotifyRefresh} className="px-3 py-2 bg-dark border border-surface text-light text-xs">Refresh</button>
                        <button onClick={handleSpotifyDisconnect} className="px-3 py-2 bg-red-600 text-white text-xs">Disconnect</button>
                      </>
                    ) : (
                      <button onClick={handleSpotifyConnect} className="px-4 py-2 bg-primary text-white rounded-none hover:bg-primary/80 text-sm">Connect</button>
                    )}
                  </div>
                </div>
                <div className="h-px bg-dark" />
                {spotifyConnected && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-light font-medium">Spotify Playlists</p>
                      <button
                        onClick={handleFetchSpotifyPlaylists}
                        disabled={spotifyLoading}
                        className="px-3 py-2 bg-dark border border-surface text-light text-xs disabled:opacity-50"
                      >
                        {spotifyLoading ? 'Loading…' : 'Refresh'}
                      </button>
                    </div>
                    {spotifyError && <p className="text-red-400 text-sm mb-2">{spotifyError}</p>}
                    {spotifyPlaylists.length > 0 ? (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {spotifyPlaylists.map((p) => (
                          <div key={p.id} className="text-sm text-gray-300 truncate">
                            <span>{p.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({p.trackCount} tracks)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No playlists loaded yet.</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Privacy & Security */}
          {activeCategory === 'privacy' && (
            <section className="bg-surface p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-light mb-6">Privacy & Security</h2>
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Profile PINs and adult content settings can be managed in the <a href="/profile" className="text-primary hover:underline">Profile</a> and <a href="/account" className="text-primary hover:underline">Account</a> pages.
                </p>
              </div>
            </section>
          )}

          {/* API Keys */}
          {activeCategory === 'api-keys' && (
            <section className="bg-surface p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-light mb-6">API Keys</h2>
              <p className="text-sm text-gray-400 mb-6">
                Configure metadata providers for automatic enrichment of your media library.
              </p>
              <ProviderManagementPanel />
            </section>
          )}

          {/* Advanced Settings */}
          {activeCategory === 'advanced' && (
            <section className="bg-surface p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-light mb-6">Advanced</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-light font-medium">Debug Mode</p>
                    <p className="text-sm text-gray-400">Enable verbose logging for job execution and system operations.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                    className="accent-primary h-4 w-4"
                  />
                </div>
                <div className="h-px bg-dark" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-light font-medium">Global Hotkeys</p>
                    <p className="text-sm text-gray-400">Enable system-wide keyboard shortcuts for playback control (desktop only).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={globalHotkeysEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked
                      setGlobalHotkeysEnabled(enabled)
                      setFeatureFlag('feature_global_hotkeys', enabled)
                      if (enabled) {
                        alert('Restart the app to activate global hotkeys')
                      }
                    }}
                    className="accent-primary h-4 w-4"
                  />
                </div>
                <div className="h-px bg-dark" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-light font-medium">Error Log Viewer</p>
                    <p className="text-sm text-gray-400">View failed jobs with detailed error information.</p>
                  </div>
                  <a
                    href="/error-log"
                    className="px-4 py-2 bg-dark border border-surface text-light rounded-none hover:bg-surface text-sm"
                  >
                    View Errors
                  </a>
                </div>
                {isFeatureEnabled('feature_external_sources') && (
                  <>
                    <div className="h-px bg-dark" />
                    <SourcesSettings />
                  </>
                )}
              </div>
            </section>
          )}

          {/* About */}
          {activeCategory === 'about' && (
            <section className="bg-surface p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-light mb-6">About</h2>
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  <span className="text-light font-medium">App Version:</span> 0.1.0
                </p>
                <p>
                  <span className="text-light font-medium">Built with:</span> React + TypeScript + Tailwind CSS
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      <BulkUpdateModal isOpen={showBulkUpdate} onClose={() => setShowBulkUpdate(false)} />
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </main>
  )
}
