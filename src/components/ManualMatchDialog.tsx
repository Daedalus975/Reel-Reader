/**
 * Manual Match Dialog Component
 * 
 * UI for reviewing and selecting metadata matches when confidence is low.
 */

import { useState } from 'react'
import { MatchCandidate, MatchResult } from '../features/metadata/core/matching'
import { Button } from './Button'

interface ManualMatchDialogProps {
  isOpen: boolean
  onClose: () => void
  matchResult: MatchResult
  mediaTitle: string
  onSelect: (candidateId: string) => void
  onSkip: () => void
}

export function ManualMatchDialog({
  isOpen,
  onClose,
  matchResult,
  mediaTitle,
  onSelect,
  onSkip
}: ManualMatchDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Review Metadata Matches</h2>
          <p className="text-gray-400 mt-1">
            Multiple matches found for: <span className="text-white font-medium">{mediaTitle}</span>
          </p>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {matchResult.candidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.searchResult.externalId}
              candidate={candidate}
              isSelected={selectedId === candidate.searchResult.externalId}
              onSelect={() => setSelectedId(candidate.searchResult.externalId)}
              rank={index + 1}
            />
          ))}

          {matchResult.candidates.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No confident matches found</p>
              <p className="text-sm mt-2">Try refining the file name or search manually</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <Button onClick={onSkip} variant="secondary">
            Skip This Item
          </Button>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedId}>
              Confirm Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CandidateCardProps {
  candidate: MatchCandidate
  isSelected: boolean
  onSelect: () => void
  rank: number
}

function CandidateCard({ candidate, isSelected, onSelect, rank }: CandidateCardProps) {
  const { searchResult, confidence, reasons, warnings } = candidate

  return (
    <div
      onClick={onSelect}
      className={`
        border-2 rounded-lg p-4 cursor-pointer transition-all
        ${
          isSelected
            ? 'border-blue-500 bg-blue-900/20'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800'
        }
      `}
    >
      <div className="flex gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div
            className={`
            w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
            ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-700 text-gray-400'}
          `}
          >
            {rank}
          </div>
        </div>

        {/* Thumbnail */}
        {searchResult.thumbnail && (
          <div className="flex-shrink-0">
            <img
              src={searchResult.thumbnail}
              alt={searchResult.title}
              className="w-24 h-36 object-cover rounded"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold truncate">{searchResult.title}</h3>
              {searchResult.year && (
                <p className="text-gray-400 text-sm">{searchResult.year}</p>
              )}
            </div>

            {/* Confidence Badge */}
            <div
              className={`
              px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
              ${
                confidence >= 0.87
                  ? 'bg-green-500/20 text-green-500'
                  : confidence >= 0.75
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-red-500/20 text-red-500'
              }
            `}
            >
              {Math.round(confidence * 100)}% match
            </div>
          </div>

          {searchResult.description && (
            <p className="text-sm text-gray-400 mt-2 line-clamp-2">
              {searchResult.description}
            </p>
          )}

          {/* Match Reasons */}
          {reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {reasons.map((reason, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded"
                >
                  ✓ {reason}
                </span>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {warnings.map((warning, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded"
                >
                  ⚠ {warning}
                </span>
              ))}
            </div>
          )}

          {/* Provider Info */}
          <div className="mt-3 text-xs text-gray-500">
            Source: {searchResult.providerId.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  )
}
