import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useBulkUpdateStore } from '@store/bulkUpdateStore'
import type { MediaType } from '../types'

interface BulkUpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

const mediaTypes: MediaType[] = ['movie', 'tv', 'music', 'book', 'photo', 'podcast', 'adult', 'jav', 'doujinshi']

export const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({ isOpen, onClose }) => {
  const { runBulkUpdate, isRunning, progress, message, reset } = useBulkUpdateStore()
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('')
  const [idsInput, setIdsInput] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState<string | undefined>()

  const ids = useMemo(() => idsInput.split(/[,\s]+/).filter(Boolean), [idsInput])

  const handleSubmit = async () => {
    setError(undefined)
    let updates: Record<string, unknown>
    try {
      updates = jsonInput ? JSON.parse(jsonInput) : {}
    } catch (e) {
      setError('Invalid JSON for updates')
      return
    }

    if (!updates || Object.keys(updates).length === 0) {
      setError('Provide at least one field to update')
      return
    }

    await runBulkUpdate({
      type: typeFilter || undefined,
      ids: ids.length ? ids : undefined,
      updates,
    })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface rounded-lg max-w-3xl w-full shadow-2xl border border-dark">
              <div className="flex items-center justify-between p-4 border-b border-dark">
                <h2 className="text-xl font-semibold text-light">Bulk Metadata Update</h2>
                <button onClick={handleClose} className="p-2 hover:bg-dark rounded-none">
                  <X size={20} className="text-light" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Filter by media type (optional)</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as MediaType | '')}
                      className="w-full bg-dark text-light px-3 py-2 rounded-none border border-surface"
                    >
                      <option value="">All types</option>
                      {mediaTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Specific IDs (optional, comma or space separated)</label>
                    <textarea
                      value={idsInput}
                      onChange={(e) => setIdsInput(e.target.value)}
                      rows={3}
                      className="w-full bg-dark text-light px-3 py-2 rounded-none border border-surface"
                      placeholder="id1, id2, id3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Updates (JSON object)</label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={6}
                    className="w-full bg-dark text-light px-3 py-2 rounded-none border border-surface font-mono text-sm"
                    placeholder='{"rating": 9.1, "genres": ["Rock"], "artist": "..."}'
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}
                {message && <p className="text-sm text-gray-300">{message}</p>}

                {isRunning && (
                  <div className="space-y-2">
                    <div className="w-full bg-dark h-3 rounded-none overflow-hidden border border-surface">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">Progress: {Math.round(progress * 100)}%</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-dark text-light border border-surface rounded-none hover:bg-surface"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isRunning}
                    className="px-4 py-2 bg-primary text-white rounded-none hover:bg-primary/80 disabled:opacity-60"
                  >
                    {isRunning ? 'Updating...' : 'Run Update'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
