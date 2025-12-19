import { Monitor } from 'lucide-react'

interface AspectRatioSelectorProps {
  value: string
  onChange: (ratio: string) => void
}

const ASPECT_RATIOS = [
  { label: 'Auto', value: 'auto' },
  { label: '16:9', value: '16:9' },
  { label: '4:3', value: '4:3' },
  { label: '21:9', value: '21:9' },
  { label: '2.35:1', value: '2.35:1' },
  { label: '2.39:1', value: '2.39:1' },
  { label: '1:1', value: '1:1' },
  { label: 'Fill', value: 'fill' },
  { label: 'Fit', value: 'fit' }
]

export function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <Monitor size={20} className="text-white/60" />
      <div className="flex-1">
        <label className="text-sm text-white/60 mb-1 block">Aspect Ratio</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
        >
          {ASPECT_RATIOS.map((ratio) => (
            <option key={ratio.value} value={ratio.value}>
              {ratio.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
