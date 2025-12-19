/**
 * Provider Management Panel
 * 
 * UI for managing metadata providers and configurations.
 */

import { useState, useEffect } from 'react'
import { metadataService } from '../features/metadata'
import { buildProviderContext } from '../features/metadata/integration'
import { useProfileStore } from '../store/profileStore'
import { Button } from './Button'

interface ProviderConfig {
  id: string
  name: string
  description: string
  requiresApiKey: boolean
  signupUrl?: string
  supportedTypes: string[]
}

const AVAILABLE_PROVIDERS: ProviderConfig[] = [
  {
    id: 'tmdb',
    name: 'The Movie Database (TMDB)',
    description: 'Movies and TV shows',
    requiresApiKey: true,
    signupUrl: 'https://www.themoviedb.org/settings/api',
    supportedTypes: ['movie', 'tv']
  },
  {
    id: 'musicbrainz',
    name: 'MusicBrainz',
    description: 'Music albums and artists',
    requiresApiKey: false,
    signupUrl: 'https://musicbrainz.org/',
    supportedTypes: ['music']
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Music and podcast metadata',
    requiresApiKey: true,
    signupUrl: 'https://developer.spotify.com/dashboard',
    supportedTypes: ['music', 'podcast']
  },
  {
    id: 'listennotes',
    name: 'Listen Notes',
    description: 'Podcast search and metadata',
    requiresApiKey: true,
    signupUrl: 'https://www.listennotes.com/api/',
    supportedTypes: ['podcast']
  },
  {
    id: 'openlibrary',
    name: 'OpenLibrary',
    description: 'Books and publications',
    requiresApiKey: false,
    signupUrl: 'https://openlibrary.org/',
    supportedTypes: ['book']
  },
  {
    id: 'googlebooks',
    name: 'Google Books',
    description: 'Alternative book metadata',
    requiresApiKey: true,
    signupUrl: 'https://developers.google.com/books/docs/v1/using#APIKey',
    supportedTypes: ['book']
  },
  {
    id: 'igdb',
    name: 'IGDB',
    description: 'Video games',
    requiresApiKey: true,
    signupUrl: 'https://api-docs.igdb.com/#getting-started',
    supportedTypes: ['game']
  },
  {
    id: 'javlibrary',
    name: 'JAVLibrary',
    description: 'JAV content metadata',
    requiresApiKey: false,
    signupUrl: 'https://www.javlibrary.com/',
    supportedTypes: ['jav']
  },
  {
    id: 'r18',
    name: 'R18 / DMM',
    description: 'Adult content metadata',
    requiresApiKey: true,
    signupUrl: 'https://affiliate.dmm.com/',
    supportedTypes: ['jav', 'adult']
  }
]

export function ProviderManagementPanel() {
  const currentProfile = useProfileStore(state => state.getCurrentProfile())
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    [key: string]: { success: boolean; error?: string }
  }>({})

  // Load saved API keys on mount
  useEffect(() => {
    const loaded: Record<string, string> = {}
    AVAILABLE_PROVIDERS.forEach(provider => {
      if (provider.requiresApiKey) {
        const saved = localStorage.getItem(`${provider.id}_api_key`)
        if (saved) loaded[provider.id] = saved
      }
    })
    setApiKeys(loaded)
  }, [])

  const handleSaveApiKey = (providerId: string) => {
    const key = apiKeys[providerId]?.trim()
    if (!key) return

    // Update the metadata service
    metadataService.updateApiKey(providerId, key)
    
    // Save to localStorage for persistence
    localStorage.setItem(`${providerId}_api_key`, key)
    
    // Re-initialize the service with the new API key
    const context = buildProviderContext(useProfileStore.getState(), {
      tmdbApiKey: key
    })
    metadataService.initialize(context).catch(err => {
      console.error('Failed to reinitialize metadata service:', err)
    })
    
    alert(`${AVAILABLE_PROVIDERS.find(p => p.id === providerId)?.name} API key saved!`)
  }

  const handleTestConnection = async (providerId: string) => {
    setTestingConnection(providerId)
    const providerName = AVAILABLE_PROVIDERS.find(p => p.id === providerId)?.name || providerId
    
    try {
      // Build context with the specific provider's API key
      const apiKeyForProvider = providerId === 'tmdb' ? apiKeys.tmdb : 
                                providerId === 'r18' ? apiKeys.r18 :
                                undefined

      const context = buildProviderContext(useProfileStore.getState(), {
        tmdbApiKey: apiKeys.tmdb,
        // Provider being tested gets its specific key
        [providerId + 'ApiKey']: apiKeyForProvider
      })

      const results = await metadataService.testConnections(context)
      const result = results.find(r => r.providerId === providerId)

      if (result) {
        setConnectionStatus({
          ...connectionStatus,
          [providerId]: {
            success: result.success,
            error: result.error
          }
        })

        // Show user feedback
        if (result.success) {
          alert(`✓ ${providerName} connection successful!`)
        } else {
          alert(`✗ ${providerName} connection failed: ${result.error || 'Unknown error'}`)
        }
      } else {
        alert(`✗ No test result returned for ${providerName}`)
      }
    } catch (error: any) {
      console.error('Connection test failed:', error)
      const errorMsg = error?.message || 'Test failed'
      setConnectionStatus({
        ...connectionStatus,
        [providerId]: {
          success: false,
          error: errorMsg
        }
      })
      alert(`✗ ${providerName} test error: ${errorMsg}`)
    } finally {
      setTestingConnection(null)
    }
  }

  const handleCleanCache = async () => {
    try {
      const deleted = await metadataService.cleanCache()
      alert(`Cleaned ${deleted} expired cache entries`)
    } catch (error) {
      console.error('Cache clean failed:', error)
      alert('Failed to clean cache')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {AVAILABLE_PROVIDERS.map(provider => (
          <div key={provider.id} className="bg-dark rounded-lg p-3 border border-surface">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-light text-sm">{provider.name}</h4>
                  {connectionStatus[provider.id] && (
                    <span
                      className={`text-xs ${
                        connectionStatus[provider.id].success ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {connectionStatus[provider.id].success ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{provider.description} · {provider.supportedTypes.join(', ')}</p>
              </div>
            </div>

            {provider.requiresApiKey ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeys[provider.id] || ''}
                    onChange={e => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                    placeholder="Enter API key"
                    className="flex-1 px-2 py-1.5 text-sm bg-surface border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-primary text-light"
                  />
                  <button
                    onClick={() => handleSaveApiKey(provider.id)}
                    disabled={!apiKeys[provider.id]?.trim()}
                    className="px-3 py-1.5 bg-primary text-white rounded text-xs hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={!apiKeys[provider.id]?.trim() || testingConnection === provider.id}
                    className="px-3 py-1.5 bg-dark border border-surface text-light rounded text-xs hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingConnection === provider.id ? '...' : 'Test'}
                  </button>
                </div>
                {provider.signupUrl && (
                  <p className="text-xs text-gray-500">
                    Get key:{' '}
                    <a
                      href={provider.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {provider.name}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">✓ No API key required</p>
            )}
          </div>
        ))}
      </div>

      {/* Cache & Info */}
      <div className="flex gap-3">
        <div className="flex-1 bg-dark border border-surface rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-light">Cache Management</p>
              <p className="text-xs text-gray-500">Clear old metadata</p>
            </div>
            <button
              onClick={handleCleanCache}
              className="px-3 py-1.5 bg-dark border border-surface text-light rounded text-xs hover:bg-surface"
            >
              Clean
            </button>
          </div>
        </div>
        <div className="flex-1 bg-dark border border-surface rounded-lg p-3">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-light">Note:</span> Only TMDB is currently implemented.
          </p>
        </div>
      </div>
    </div>
  )
}
