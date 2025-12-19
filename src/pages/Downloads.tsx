// Downloads Manager Page - Manage offline downloads queue
// Features: #61-63, #67-70

import React, { useEffect, useState } from 'react'
import { Download, Pause, Play, X, Trash2, RefreshCw, Calendar } from 'lucide-react'
import { useDownloadManagerStore } from '../store/downloadManagerStore'
import { useLibraryStore } from '../store'
import { useUIStore } from '../store'

export const Downloads: React.FC = () => {
  const { setCurrentPage } = useUIStore()
  const {
    downloads,
    maxConcurrent,
    bandwidthLimit,
    storageQuota,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    removeDownload,
    clearCompleted,
    clearFailed,
    setMaxConcurrent,
    setBandwidthLimit,
    setStorageQuota,
    getActiveDownloads,
    getTotalDownloadedBytes,
    getEstimatedTimeRemaining,
  } = useDownloadManagerStore()
  const { media } = useLibraryStore()

  const [showSettings, setShowSettings] = useState(false)
  const [tempMaxConcurrent, setTempMaxConcurrent] = useState(maxConcurrent)
  const [tempBandwidthLimit, setTempBandwidthLimit] = useState(
    bandwidthLimit ? bandwidthLimit / 1024 / 1024 : 0
  )
  const [tempStorageQuota, setTempStorageQuota] = useState(
    storageQuota ? storageQuota / 1024 / 1024 / 1024 : 0
  )

  useEffect(() => {
    setCurrentPage('/downloads')
  }, [setCurrentPage])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatSpeed = (bytesPerSec: number) => {
    return `${formatBytes(bytesPerSec)}/s`
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return 'Unknown'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const getMediaTitle = (mediaId: string) => {
    const item = media.find((m) => m.id === mediaId)
    return item?.title || 'Unknown'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'text-blue-400'
      case 'completed':
        return 'text-green-400'
      case 'failed':
        return 'text-red-400'
      case 'paused':
        return 'text-yellow-400'
      case 'cancelled':
        return 'text-gray-500'
      default:
        return 'text-gray-400'
    }
  }

  const activeDownloads = getActiveDownloads()
  const totalBytes = getTotalDownloadedBytes()
  const eta = getEstimatedTimeRemaining()

  const handleSaveSettings = () => {
    setMaxConcurrent(tempMaxConcurrent)
    setBandwidthLimit(tempBandwidthLimit > 0 ? tempBandwidthLimit * 1024 * 1024 : undefined)
    setStorageQuota(tempStorageQuota > 0 ? tempStorageQuota * 1024 * 1024 * 1024 : undefined)
    setShowSettings(false)
  }

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-light">Downloads</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-surface text-light rounded-none hover:bg-surface-light transition-colors"
            >
              Settings
            </button>
            {downloads.some((d) => d.status === 'completed') && (
              <button
                onClick={clearCompleted}
                className="px-4 py-2 bg-surface text-gray-400 rounded-none hover:bg-surface-light hover:text-light transition-colors"
              >
                Clear Completed
              </button>
            )}
            {downloads.some((d) => d.status === 'failed') && (
              <button
                onClick={clearFailed}
                className="px-4 py-2 bg-surface text-red-400 rounded-none hover:bg-surface-light transition-colors"
              >
                Clear Failed
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Active</div>
            <div className="text-2xl font-bold text-primary">{activeDownloads.length}</div>
          </div>
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Total Downloaded</div>
            <div className="text-2xl font-bold text-light">{formatBytes(totalBytes)}</div>
          </div>
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Est. Time Remaining</div>
            <div className="text-2xl font-bold text-light">{eta ? formatTime(eta) : '—'}</div>
          </div>
          <div className="bg-surface p-4 rounded-none">
            <div className="text-sm text-gray-400 mb-1">Total in Queue</div>
            <div className="text-2xl font-bold text-light">{downloads.length}</div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-surface p-6 rounded-none mb-6">
            <h2 className="text-xl font-semibold text-light mb-4">Download Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Max Concurrent Downloads
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempMaxConcurrent}
                  onChange={(e) => setTempMaxConcurrent(parseInt(e.target.value) || 1)}
                  className="w-full bg-dark text-light px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Bandwidth Limit (MB/s, 0 = unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={tempBandwidthLimit}
                  onChange={(e) => setTempBandwidthLimit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark text-light px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Storage Quota (GB, 0 = unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tempStorageQuota}
                  onChange={(e) => setTempStorageQuota(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark text-light px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-dark text-gray-400 rounded-none hover:text-light"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-primary text-white rounded-none hover:bg-primary-dark"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Downloads List */}
        <div className="space-y-3">
          {downloads.length === 0 ? (
            <div className="bg-surface p-12 rounded-none text-center">
              <Download className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No downloads in queue</p>
              <p className="text-gray-500 text-sm mt-2">
                Downloads will appear here when you add media for offline access
              </p>
            </div>
          ) : (
            downloads.map((download) => (
              <div key={download.id} className="bg-surface p-4 rounded-none">
                <div className="flex items-start gap-4">
                  {/* Progress Circle */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-dark"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - download.progress / 100)}`}
                        className="text-primary transition-all"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-light font-medium">
                        {Math.round(download.progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Download Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-light font-medium truncate">
                        {getMediaTitle(download.mediaId)}
                      </h3>
                      <span className={`text-xs font-medium ${getStatusColor(download.status)}`}>
                        {download.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {download.bytesTotal > 0 && (
                        <span>
                          {formatBytes(download.bytesDownloaded)} / {formatBytes(download.bytesTotal)}
                        </span>
                      )}
                      {download.speed && download.status === 'downloading' && (
                        <span className="ml-3">{formatSpeed(download.speed)}</span>
                      )}
                    </div>
                    {download.error && (
                      <div className="text-sm text-red-400 mt-1">{download.error}</div>
                    )}
                    {download.scheduledFor && download.status === 'queued' && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        Scheduled for {new Date(download.scheduledFor).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {download.status === 'downloading' && (
                      <button
                        onClick={() => pauseDownload(download.id)}
                        className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-none"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {download.status === 'paused' && (
                      <button
                        onClick={() => resumeDownload(download.id)}
                        className="p-2 text-green-400 hover:bg-green-400/10 rounded-none"
                        title="Resume"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {download.status === 'failed' && (
                      <button
                        onClick={() => retryDownload(download.id)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-none"
                        title="Retry"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    {(download.status === 'downloading' ||
                      download.status === 'queued' ||
                      download.status === 'paused') && (
                      <button
                        onClick={() => cancelDownload(download.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-none"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {(download.status === 'completed' ||
                      download.status === 'failed' ||
                      download.status === 'cancelled') && (
                      <button
                        onClick={() => removeDownload(download.id)}
                        className="p-2 text-gray-400 hover:bg-gray-400/10 rounded-none"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
