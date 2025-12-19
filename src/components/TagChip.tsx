import React, { useMemo } from 'react'

interface TagChipProps {
  label: string
  color?: string
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
}

export const TagChip: React.FC<TagChipProps> = ({
  label,
  color,
  onClick,
  removable,
  onRemove,
}) => {
  // Get custom tag colors from localStorage
  const customColors = useMemo(() => {
    try {
      const saved = localStorage.getItem('reel-reader-tag-colors')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  }, [])

  // Use custom color if defined for this tag, otherwise use provided color or default
  const bgColor = customColors[label] || color || '#E1D50D'
  const textColor = customColors[label] || color ? '#FDF9F3' : '#08080A'

  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs font-medium px-2 py-0.5 rounded-sm cursor-pointer hover:opacity-80 transition"
    >
      {label}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="hover:opacity-60"
        >
          ✕
        </button>
      )}
    </span>
  )
}
