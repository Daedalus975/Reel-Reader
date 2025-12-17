import React from 'react'

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
  const bgColor = color || '#E1D50D'
  const textColor = color ? '#FDF9F3' : '#08080A'

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
