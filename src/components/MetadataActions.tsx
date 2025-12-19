/**
 * Metadata Refresh Button Component
 * 
 * Action button to manually refresh metadata for a media item.
 */

import { useState } from 'react'
import { metadataService } from '../features/metadata'
import { buildProviderContext } from '../features/metadata/integration'
import { useProfileStore } from '../store/profileStore'
import { Button } from './Button'

interface MetadataRefreshButtonProps {
  mediaId: string
  canonicalId?: string
  onRefreshComplete?: () => void
}

export function MetadataRefreshButton({
  mediaId,
  canonicalId,
  onRefreshComplete
}: MetadataRefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleRefresh = async () => {
    setRefreshing(true)
    setStatus('idle')

    try {
      const context = buildProviderContext(useProfileStore.getState(), {
        tmdbApiKey: localStorage.getItem('tmdb_api_key') ?? ''
      })

      // Schedule refresh job
      const jobId = await metadataService.refreshMetadata(
        canonicalId ?? mediaId,
        'tmdb',
        context
      )

      console.log(`Refresh job scheduled: ${jobId}`)

      setStatus('success')
      onRefreshComplete?.()

      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      console.error('Refresh failed:', error)
      setStatus('error')

      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Button
      onClick={handleRefresh}
      disabled={refreshing}
      variant="secondary"
      className="relative"
    >
      {refreshing && <span className="animate-spin mr-2">⟳</span>}
      {status === 'success' && <span className="mr-2">✓</span>}
      {status === 'error' && <span className="mr-2">✗</span>}
      {refreshing
        ? 'Refreshing...'
        : status === 'success'
        ? 'Refreshed!'
        : status === 'error'
        ? 'Failed'
        : 'Refresh Metadata'}
    </Button>
  )
}

/**
 * Field Lock Toggle Component
 * 
 * Lock/unlock individual metadata fields to prevent overwriting.
 */

interface FieldLockToggleProps {
  mediaId: string
  canonicalId?: string
  fieldPath: string
  currentValue: any
  isLocked: boolean
  onToggle?: (locked: boolean) => void
}

export function FieldLockToggle({
  mediaId,
  canonicalId,
  fieldPath,
  currentValue,
  isLocked,
  onToggle
}: FieldLockToggleProps) {
  const [locked, setLocked] = useState(isLocked)
  const [processing, setProcessing] = useState(false)

  const handleToggle = async () => {
    setProcessing(true)

    try {
      if (locked) {
        // Unlock
        await metadataService.unlockField(canonicalId ?? mediaId, fieldPath)
        setLocked(false)
        onToggle?.(false)
      } else {
        // Lock
        await metadataService.lockField(
          canonicalId ?? mediaId,
          fieldPath,
          currentValue,
          'User locked'
        )
        setLocked(true)
        onToggle?.(true)
      }
    } catch (error) {
      console.error('Field lock toggle failed:', error)
      alert('Failed to toggle field lock')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={processing}
      className={`
        p-1 rounded transition-colors
        ${locked ? 'text-yellow-500 hover:text-yellow-400' : 'text-gray-500 hover:text-gray-400'}
        ${processing ? 'opacity-50 cursor-wait' : ''}
      `}
      title={locked ? 'Locked - click to unlock' : 'Unlocked - click to lock'}
    >
      {locked ? '🔒' : '🔓'}
    </button>
  )
}
