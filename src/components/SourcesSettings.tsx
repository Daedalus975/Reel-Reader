import React, { useState, useEffect } from 'react'
import type { Source } from '../features/import/sourceModel'
import { SourceStore } from '../features/import/sourceModel'

const defaultTypeOptions = ['folder', 'external-drive', 'smb', 'ftp'] as const

export const SourcesSettings: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([])
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [type, setType] = useState<typeof defaultTypeOptions[number]>('folder')

  useEffect(() => {
    setSources(SourceStore.getAll())
  }, [])

  const handleAdd = () => {
    const now = new Date().toISOString()
    const s: Source = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      name: name || `Source ${sources.length + 1}`,
      path,
      type,
      enabled: true,
      createdAt: now,
    }
    SourceStore.add(s)
    setSources(SourceStore.getAll())
    setName('')
    setPath('')
  }

  return (
    <div className="bg-surface p-6 rounded-none mb-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-light mb-4">Library Sources</h2>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input className="flex-1 bg-dark p-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="flex-2 bg-dark p-2" placeholder="Path" value={path} onChange={(e) => setPath(e.target.value)} />
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="bg-dark p-2">
            {defaultTypeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button onClick={handleAdd} className="px-3 py-2 bg-primary text-white">Add</button>
        </div>

        <div className="pt-2">
          {sources.length ? (
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-dark/10">
                  <div>
                    <div className="font-medium text-light">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.path} • {s.type}</div>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400">No sources configured.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SourcesSettings
