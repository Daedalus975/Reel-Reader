import React, { useEffect, useMemo, useState } from 'react'
import { useUIStore } from '@store/index'
import { useJobQueueStore } from '@/store/jobQueueStore'
import { AlertCircle, RefreshCw, Trash2, Clock, XCircle } from 'lucide-react'
import { retryJob } from '@/services/jobQueue'

export const ErrorLog: React.FC = () => {
  const { setCurrentPage } = useUIStore()
  const jobs = useJobQueueStore((state) => state.jobs)
  const removeJob = useJobQueueStore((state) => state.removeJob)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'retries'>('date')

  useEffect(() => {
    setCurrentPage('/error-log')
  }, [setCurrentPage])

  // Filter for failed jobs only
  const failedJobs = useMemo(() => {
    let filtered = jobs.filter((job) => job.status === 'failed')

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term) ||
          job.error?.toLowerCase().includes(term) ||
          job.type.toLowerCase().includes(term)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return (b.completedAt || 0) - (a.completedAt || 0)
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type)
      } else if (sortBy === 'retries') {
        return b.retries - a.retries
      }
      return 0
    })

    return filtered
  }, [jobs, searchTerm, sortBy])

  const handleRetry = (jobId: string) => {
    retryJob(jobId)
  }

  const handleDelete = (jobId: string) => {
    removeJob(jobId)
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all failed jobs?')) {
      // Remove all failed jobs
      failedJobs.forEach((job) => removeJob(job.id))
    }
  }

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 minute
    if (diff < 60000) return 'Just now'
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    // Less than 24 hours
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    // More than 24 hours
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'import':
        return 'bg-blue-600'
      case 'scan':
        return 'bg-purple-600'
      case 'metadata':
        return 'bg-green-600'
      case 'backup':
        return 'bg-yellow-600'
      case 'encrypt':
        return 'bg-red-600'
      case 'download':
        return 'bg-cyan-600'
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-light mb-2">Error Log</h1>
            <p className="text-gray-400">
              Failed jobs: <span className="text-light font-semibold">{failedJobs.length}</span>
            </p>
          </div>
          {failedJobs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none transition"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-surface p-4 rounded-none mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, type, or error..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark text-light px-4 py-2 rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-light text-sm">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'type' | 'retries')}
              className="bg-dark text-light px-3 py-2 rounded-none border border-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="date">Date</option>
              <option value="type">Type</option>
              <option value="retries">Retry Count</option>
            </select>
          </div>
        </div>

        {/* Error List */}
        {failedJobs.length === 0 ? (
          <div className="bg-surface p-12 rounded-none text-center">
            <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-light text-lg mb-2">No Failed Jobs</p>
            <p className="text-gray-400">All jobs completed successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {failedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-surface p-6 rounded-none border-l-4 border-red-600"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`${getJobTypeColor(
                          job.type
                        )} text-white text-xs font-bold px-2 py-1 rounded-none uppercase`}
                      >
                        {job.type}
                      </span>
                      <h3 className="text-light font-semibold text-lg">{job.title}</h3>
                    </div>
                    {job.description && (
                      <p className="text-gray-400 text-sm mb-2">{job.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRetry(job.id)}
                      className="p-2 bg-dark hover:bg-primary text-light hover:text-dark rounded-none transition"
                      title="Retry Job"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="p-2 bg-dark hover:bg-red-600 text-light hover:text-white rounded-none transition"
                      title="Delete Job"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>

                {/* Error Details */}
                <div className="bg-dark p-4 rounded-none mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle size={16} className="text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-400 font-semibold text-sm mb-1">Error Message:</p>
                      <p className="text-light text-sm font-mono break-words">
                        {job.error || 'Unknown error'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Failed At</p>
                    <div className="flex items-center gap-1 text-light">
                      <Clock size={14} />
                      <span>{formatTimestamp(job.completedAt)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Retry Attempts</p>
                    <p className="text-light">
                      {job.retries} / {job.maxRetries}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Created At</p>
                    <p className="text-light">{formatTimestamp(job.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Job ID</p>
                    <p className="text-light font-mono text-xs truncate">{job.id}</p>
                  </div>
                </div>

                {/* Job Data (Debug) */}
                {job.data && Object.keys(job.data).length > 0 && (
                  <details className="mt-4">
                    <summary className="text-gray-400 text-sm cursor-pointer hover:text-light">
                      Show Job Data
                    </summary>
                    <pre className="bg-dark p-3 rounded-none text-xs text-light mt-2 overflow-x-auto">
                      {JSON.stringify(job.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
